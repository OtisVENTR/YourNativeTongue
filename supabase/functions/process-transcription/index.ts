/**
 * Process Transcription Edge Function
 * 
 * Handles the transcription workflow:
 * 1. Gets audio file from job record
 * 2. Submits to AssemblyAI for transcription
 * 3. Polls until transcription is complete
 * 4. Saves transcript to database
 * 5. Triggers process-translation function
 */

import { createCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import {
  startAssemblyAITranscription,
  getAssemblyAITranscription,
} from '../_shared/apis.ts';
import {
  jsonResponse,
  errorResponse,
  parseJsonBody,
  validateRequired,
  validateUUID,
  successResponse,
  handleError,
  asyncHandler,
} from '../_shared/utils.ts';
import { ValidationError, ApiError, NotFoundError } from '../_shared/types.ts';

interface ProcessTranscriptionRequest {
  job_id: string;
}

const POLL_INTERVAL_MS = 3000; // Poll every 3 seconds
const MAX_POLL_ATTEMPTS = 120; // Maximum 6 minutes (120 * 3s = 360s)
const MAX_RETRIES = 3;

/**
 * Validates the process transcription request
 */
function validateRequest(data: unknown): ProcessTranscriptionRequest {
  if (typeof data !== 'object' || data === null) {
    throw new ValidationError('Request body must be an object');
  }

  const body = data as Record<string, unknown>;
  validateRequired(body, ['job_id']);

  if (!validateUUID(body.job_id as string)) {
    throw new ValidationError('job_id must be a valid UUID');
  }

  return {
    job_id: body.job_id as string,
  };
}

/**
 * Gets the job record from the database
 */
async function getJobRecord(
  supabase: ReturnType<typeof createSupabaseClient>,
  jobId: string
) {
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error || !job) {
    throw new NotFoundError(`Job not found: ${jobId}`);
  }

  return job;
}

/**
 * Gets a public URL for the audio file from Supabase Storage
 */
async function getAudioFileUrl(
  supabase: ReturnType<typeof createSupabaseClient>,
  filePath: string
): Promise<string> {
  // Extract bucket and path from file_path
  // Format: {user_id}/{filename} or {job_id}/{filename}
  // Bucket: input-files
  
  const bucket = 'input-files';
  
  // Get a signed URL that's valid for 1 hour
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error || !data) {
    throw new ApiError(`Failed to get audio file URL: ${error?.message}`, 500);
  }

  return data.signedUrl;
}

/**
 * Updates job status in the database
 */
async function updateJobStatus(
  supabase: ReturnType<typeof createSupabaseClient>,
  jobId: string,
  status: string,
  updates?: Record<string, unknown>
) {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
    ...updates,
  };

  const { error } = await supabase
    .from('jobs')
    .update(updateData)
    .eq('id', jobId);

  if (error) {
    console.error('Error updating job status:', error);
    throw new ApiError('Failed to update job status', 500);
  }
}

/**
 * Polls AssemblyAI until transcription is complete
 */
async function pollTranscription(
  transcriptId: string,
  maxAttempts: number = MAX_POLL_ATTEMPTS
): Promise<string> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const transcript = await getAssemblyAITranscription(transcriptId);

    if (transcript.status === 'completed') {
      if (!transcript.text) {
        throw new ApiError('Transcription completed but no text was returned', 500);
      }
      return transcript.text;
    }

    if (transcript.status === 'error') {
      throw new ApiError(
        `Transcription failed: ${transcript.error || 'Unknown error'}`,
        500
      );
    }

    // Still processing, wait and try again
    attempts++;
    if (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  throw new ApiError(
    'Transcription polling timed out - transcription took too long',
    504
  );
}

/**
 * Saves the transcript to the job record
 */
async function saveTranscript(
  supabase: ReturnType<typeof createSupabaseClient>,
  jobId: string,
  transcriptText: string
) {
  await updateJobStatus(supabase, jobId, 'processing_translation', {
    transcript_text: transcriptText,
  });
}

/**
 * Triggers the process-translation function asynchronously
 */
async function triggerProcessTranslation(
  supabase: ReturnType<typeof createSupabaseClient>,
  jobId: string
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn(
        'Supabase URL or Service Role Key not found, skipping async trigger'
      );
      return;
    }

    // Call the process-translation function asynchronously
    fetch(`${supabaseUrl}/functions/v1/process-translation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ job_id: jobId }),
    }).catch((error) => {
      console.error('Failed to trigger process-translation:', error);
      // Don't throw - job can be processed later
    });
  } catch (error) {
    console.error('Error triggering process-translation:', error);
    // Don't throw - job can be processed later
  }
}

/**
 * Main handler function
 */
async function handleRequest(request: Request): Promise<Response> {
  const corsHeaders = createCorsHeaders();

  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  // Validate HTTP method
  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405, corsHeaders);
  }

  // Create Supabase client
  const supabase = createSupabaseClient();

  // Parse and validate request body
  let requestData: ProcessTranscriptionRequest;
  try {
    const body = await parseJsonBody(request);
    requestData = validateRequest(body);
  } catch (error) {
    return errorResponse(error, error instanceof ApiError ? error.statusCode : 400, corsHeaders);
  }

  const { job_id } = requestData;

  try {
    // Get job record
    const job = await getJobRecord(supabase, job_id);

    // Check if job is in the correct state
    if (job.status !== 'queued' && job.status !== 'processing_asr') {
      console.warn(`Job ${job_id} is in status ${job.status}, skipping transcription`);
      return successResponse(
        { job_id, message: 'Job not in queued/processing_asr status, skipping' },
        undefined,
        corsHeaders
      );
    }

    // Update job status to processing_asr
    await updateJobStatus(supabase, job_id, 'processing_asr', {
      processing_started_at: new Date().toISOString(),
    });

    // Get audio file URL from Supabase Storage
    const audioUrl = await getAudioFileUrl(supabase, job.input_file_path);
    console.log(`Got audio file URL for job ${job_id}`);

    // Submit transcription to AssemblyAI
    const transcriptId = await startAssemblyAITranscription(audioUrl);
    console.log(`Started AssemblyAI transcription ${transcriptId} for job ${job_id}`);

    // Poll until transcription is complete
    const transcriptText = await pollTranscription(transcriptId);
    console.log(`Transcription completed for job ${job_id}, length: ${transcriptText.length}`);

    // Save transcript to database
    await saveTranscript(supabase, job_id, transcriptText);

    // Trigger process-translation asynchronously
    triggerProcessTranslation(supabase, job_id);

    return successResponse(
      {
        job_id,
        transcript_id: transcriptId,
        transcript_length: transcriptText.length,
      },
      'Transcription completed successfully',
      corsHeaders
    );
  } catch (error) {
    console.error(`Error processing transcription for job ${job_id}:`, error);

    // Update job status to failed with error message
    try {
      await updateJobStatus(supabase, job_id, 'failed', {
        error_message:
          error instanceof Error ? error.message : 'Unknown error occurred',
        processing_completed_at: new Date().toISOString(),
      });
    } catch (updateError) {
      console.error('Failed to update job status to failed:', updateError);
    }

    return errorResponse(error, error instanceof ApiError ? error.statusCode : 500, corsHeaders);
  }
}

// Deno.serve is the entry point for Edge Functions
Deno.serve(asyncHandler(handleRequest));

