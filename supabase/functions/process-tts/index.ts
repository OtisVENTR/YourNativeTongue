/**
 * Process TTS Edge Function
 * 
 * Handles the text-to-speech workflow:
 * 1. Gets translations from job record
 * 2. Gets speaker's voice_clone_id
 * 3. Generates audio for each target language using ElevenLabs
 * 4. Uploads audio files to Supabase Storage
 * 5. Saves file paths to job.output_files
 * 6. Triggers finalize-job function
 */

import { createCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { generateSpeech } from '../_shared/apis.ts';
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

interface ProcessTTSRequest {
  job_id: string;
}

/**
 * Validates the process TTS request
 */
function validateRequest(data: unknown): ProcessTTSRequest {
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
 * Gets the speaker record to retrieve voice_clone_id
 */
async function getSpeaker(
  supabase: ReturnType<typeof createSupabaseClient>,
  speakerId: string
) {
  const { data: speaker, error } = await supabase
    .from('speakers')
    .select('id, voice_clone_id, voice_quality')
    .eq('id', speakerId)
    .single();

  if (error || !speaker) {
    throw new NotFoundError(`Speaker not found: ${speakerId}`);
  }

  if (!speaker.voice_clone_id) {
    throw new ApiError('Speaker does not have a voice_clone_id configured', 400);
  }

  return speaker;
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
 * Generates TTS audio for all translations and uploads to storage
 */
async function generateAndUploadAudio(
  supabase: ReturnType<typeof createSupabaseClient>,
  jobId: string,
  translations: Record<string, string>,
  voiceId: string,
  targetLanguages: string[]
): Promise<Record<string, { audio_path: string }>> {
  const outputFiles: Record<string, { audio_path: string }> = {};
  const bucket = 'output-files';

  // Process each translation
  for (const targetLang of targetLanguages) {
    const translatedText = translations[targetLang];

    if (!translatedText || translatedText.startsWith('[Translation failed:')) {
      console.warn(`Skipping TTS for ${targetLang} - translation failed or missing`);
      continue;
    }

    try {
      console.log(`Generating TTS audio for ${targetLang}...`);

      // Generate audio using ElevenLabs
      const audioBuffer = await generateSpeech(translatedText, voiceId);
      console.log(`TTS generated for ${targetLang}, size: ${audioBuffer.byteLength} bytes`);

      // Create file path: {job_id}/{language}.mp3
      const fileName = `${targetLang}.mp3`;
      const filePath = `${jobId}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true, // Overwrite if exists
        });

      if (uploadError) {
        console.error(`Failed to upload audio for ${targetLang}:`, uploadError);
        throw new ApiError(`Failed to upload audio for ${targetLang}: ${uploadError.message}`, 500);
      }

      outputFiles[targetLang] = {
        audio_path: filePath,
      };

      console.log(`Audio uploaded for ${targetLang} to ${filePath}`);
    } catch (error) {
      console.error(`Error generating TTS for ${targetLang}:`, error);
      // Continue with other languages even if one fails
      // Don't add to outputFiles if generation/upload failed
    }
  }

  return outputFiles;
}

/**
 * Triggers the finalize-job function asynchronously
 */
async function triggerFinalizeJob(
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

    // Call the finalize-job function asynchronously
    fetch(`${supabaseUrl}/functions/v1/finalize-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ job_id: jobId }),
    }).catch((error) => {
      console.error('Failed to trigger finalize-job:', error);
      // Don't throw - job can be processed later
    });
  } catch (error) {
    console.error('Error triggering finalize-job:', error);
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
  let requestData: ProcessTTSRequest;
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
    if (job.status !== 'processing_tts') {
      console.warn(`Job ${job_id} is in status ${job.status}, skipping TTS`);
      return successResponse(
        { job_id, message: 'Job not in processing_tts status, skipping' },
        undefined,
        corsHeaders
      );
    }

    // Validate translations exist
    if (!job.translations || typeof job.translations !== 'object') {
      throw new ApiError('Translations not found for this job', 400);
    }

    const translations = job.translations as Record<string, string>;
    const targetLanguages = job.target_languages || [];

    if (targetLanguages.length === 0) {
      throw new ApiError('No target languages specified', 400);
    }

    // Get speaker to retrieve voice_clone_id
    const speaker = await getSpeaker(supabase, job.speaker_id);
    const voiceId = speaker.voice_clone_id!;

    console.log(`Starting TTS generation for job ${job_id} with voice ${voiceId}`);

    // Generate audio for all translations and upload to storage
    const outputFiles = await generateAndUploadAudio(
      supabase,
      job_id,
      translations,
      voiceId,
      targetLanguages
    );

    console.log(`TTS generation completed for job ${job_id}, ${Object.keys(outputFiles).length} audio files generated`);

    // Update job with output files and status
    await updateJobStatus(supabase, job_id, 'processing_finalize', {
      output_files: outputFiles,
    });

    // Trigger finalize-job asynchronously
    triggerFinalizeJob(supabase, job_id);

    return successResponse(
      {
        job_id,
        audio_files_count: Object.keys(outputFiles).length,
        output_files: outputFiles,
      },
      'TTS generation completed successfully',
      corsHeaders
    );
  } catch (error) {
    console.error(`Error processing TTS for job ${job_id}:`, error);

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

