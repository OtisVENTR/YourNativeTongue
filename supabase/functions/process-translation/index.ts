/**
 * Process Translation Edge Function
 * 
 * Handles the translation workflow:
 * 1. Gets transcript from job record
 * 2. Calls Google Translation API with glossary for each target language
 * 3. Saves translations to database
 * 4. Triggers process-tts function for each target language
 */

import { createCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { translateText } from '../_shared/apis.ts';
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

interface ProcessTranslationRequest {
  job_id: string;
}

/**
 * Validates the process translation request
 */
function validateRequest(data: unknown): ProcessTranslationRequest {
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
 * Translates text to all target languages
 */
async function translateToAllLanguages(
  transcriptText: string,
  sourceLanguage: string,
  targetLanguages: string[]
): Promise<Record<string, string>> {
  const translations: Record<string, string> = {};

  // Translate to each target language sequentially
  for (const targetLang of targetLanguages) {
    try {
      console.log(`Translating to ${targetLang}...`);
      const translatedText = await translateText(
        transcriptText,
        targetLang,
        sourceLanguage
      );
      translations[targetLang] = translatedText;
      console.log(`Translation to ${targetLang} completed, length: ${translatedText.length}`);
    } catch (error) {
      console.error(`Failed to translate to ${targetLang}:`, error);
      // Continue with other languages even if one fails
      // Store error message in translation
      translations[targetLang] = `[Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}]`;
    }
  }

  return translations;
}

/**
 * Saves translations to the job record
 */
async function saveTranslations(
  supabase: ReturnType<typeof createSupabaseClient>,
  jobId: string,
  translations: Record<string, string>
) {
  await updateJobStatus(supabase, jobId, 'processing_tts', {
    translations,
  });
}

/**
 * Triggers the process-tts function asynchronously
 */
async function triggerProcessTTS(
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

    // Call the process-tts function asynchronously
    fetch(`${supabaseUrl}/functions/v1/process-tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ job_id: jobId }),
    }).catch((error) => {
      console.error('Failed to trigger process-tts:', error);
      // Don't throw - job can be processed later
    });
  } catch (error) {
    console.error('Error triggering process-tts:', error);
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
  let requestData: ProcessTranslationRequest;
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
    if (job.status !== 'processing_translation') {
      console.warn(`Job ${job_id} is in status ${job.status}, skipping translation`);
      return successResponse(
        { job_id, message: 'Job not in processing_translation status, skipping' },
        undefined,
        corsHeaders
      );
    }

    // Validate transcript exists
    if (!job.transcript_text) {
      throw new ApiError('Transcript not found for this job', 400);
    }

    const transcriptText = job.transcript_text;
    const sourceLanguage = job.source_language;
    const targetLanguages = job.target_languages || [];

    if (targetLanguages.length === 0) {
      throw new ApiError('No target languages specified for translation', 400);
    }

    console.log(`Starting translation for job ${job_id}: ${sourceLanguage} -> ${targetLanguages.join(', ')}`);

    // Translate to all target languages
    const translations = await translateToAllLanguages(
      transcriptText,
      sourceLanguage,
      targetLanguages
    );

    console.log(`Translation completed for job ${job_id}, ${Object.keys(translations).length} languages translated`);

    // Save translations to database
    await saveTranslations(supabase, job_id, translations);

    // Trigger process-tts asynchronously
    triggerProcessTTS(supabase, job_id);

    return successResponse(
      {
        job_id,
        translations_count: Object.keys(translations).length,
        target_languages: targetLanguages,
      },
      'Translation completed successfully',
      corsHeaders
    );
  } catch (error) {
    console.error(`Error processing translation for job ${job_id}:`, error);

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

