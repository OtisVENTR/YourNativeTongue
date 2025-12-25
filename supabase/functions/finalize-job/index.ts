/**
 * Finalize Job Edge Function
 * 
 * Finalizes a completed translation job:
 * 1. Marks job as completed
 * 2. Calculates and saves job cost
 * 3. Updates user's minutes_used_current_period
 * 4. Sets processing_completed_at timestamp
 */

import { createCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
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

interface FinalizeJobRequest {
  job_id: string;
}

// Pricing constants (per minute of audio)
const ASSEMBLYAI_COST_PER_MINUTE = 0.00025; // $0.00025 per minute
const GOOGLE_TRANSLATE_COST_PER_MINUTE = 0.0001; // $0.0001 per minute per language
const ELEVENLABS_COST_PER_MINUTE = 0.30; // $0.30 per minute
const TOTAL_COST_PER_MINUTE = ASSEMBLYAI_COST_PER_MINUTE + ELEVENLABS_COST_PER_MINUTE;

/**
 * Validates the finalize job request
 */
function validateRequest(data: unknown): FinalizeJobRequest {
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
 * Calculates the total cost for the job
 */
function calculateJobCost(
  durationMinutes: number,
  targetLanguageCount: number
): number {
  // Base cost: AssemblyAI + ElevenLabs (per minute per language)
  const baseCostPerMinute = ASSEMBLYAI_COST_PER_MINUTE + ELEVENLABS_COST_PER_MINUTE;
  
  // Translation cost: Google Translate (per minute per language)
  const translationCostPerMinute = GOOGLE_TRANSLATE_COST_PER_MINUTE * targetLanguageCount;
  
  // Total cost
  const totalCost = (baseCostPerMinute + translationCostPerMinute) * durationMinutes;
  
  // Round to 4 decimal places
  return Math.round(totalCost * 10000) / 10000;
}

/**
 * Updates job status to completed
 */
async function updateJobToCompleted(
  supabase: ReturnType<typeof createSupabaseClient>,
  jobId: string,
  costUsd: number
) {
  const { error } = await supabase
    .from('jobs')
    .update({
      status: 'completed',
      cost_usd: costUsd,
      processing_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) {
    console.error('Error updating job to completed:', error);
    throw new ApiError('Failed to update job to completed', 500);
  }
}

/**
 * Updates user's minutes_used_current_period
 */
async function updateUserMinutesUsed(
  supabase: ReturnType<typeof createSupabaseClient>,
  userId: string,
  minutesUsed: number
) {
  // Get current usage
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('minutes_used_current_period')
    .eq('id', userId)
    .single();

  if (fetchError || !user) {
    console.error('Error fetching user:', fetchError);
    throw new ApiError('Failed to fetch user data', 500);
  }

  // Update minutes used
  const { error: updateError } = await supabase
    .from('users')
    .update({
      minutes_used_current_period: (user.minutes_used_current_period || 0) + minutesUsed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    console.error('Error updating user minutes:', updateError);
    throw new ApiError('Failed to update user minutes', 500);
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
  let requestData: FinalizeJobRequest;
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
    if (job.status !== 'processing_finalize') {
      console.warn(`Job ${job_id} is in status ${job.status}, skipping finalization`);
      return successResponse(
        { job_id, message: 'Job not in processing_finalize status, skipping' },
        undefined,
        corsHeaders
      );
    }

    // Validate required data exists
    if (!job.output_files || typeof job.output_files !== 'object') {
      throw new ApiError('Output files not found for this job', 400);
    }

    // Calculate duration in minutes
    const durationSeconds = job.input_duration_seconds || 0;
    const durationMinutes = Math.ceil(durationSeconds / 60) || 1; // Minimum 1 minute
    const targetLanguageCount = job.target_languages?.length || 1;

    // Calculate cost
    const costUsd = calculateJobCost(durationMinutes, targetLanguageCount);
    console.log(`Job ${job_id} cost calculated: $${costUsd} (${durationMinutes} min, ${targetLanguageCount} languages)`);

    // Update job to completed
    await updateJobToCompleted(supabase, job_id, costUsd);

    // Update user's minutes used
    await updateUserMinutesUsed(supabase, job.user_id, durationMinutes);

    console.log(`Job ${job_id} finalized successfully`);

    return successResponse(
      {
        job_id,
        status: 'completed',
        cost_usd: costUsd,
        duration_minutes: durationMinutes,
      },
      'Job finalized successfully',
      corsHeaders
    );
  } catch (error) {
    console.error(`Error finalizing job ${job_id}:`, error);

    // Update job status to failed with error message
    try {
      await supabase
        .from('jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error occurred',
          processing_completed_at: new Date().toISOString(),
        })
        .eq('id', job_id);
    } catch (updateError) {
      console.error('Failed to update job status to failed:', updateError);
    }

    return errorResponse(error, error instanceof ApiError ? error.statusCode : 500, corsHeaders);
  }
}

// Deno.serve is the entry point for Edge Functions
Deno.serve(asyncHandler(handleRequest));

