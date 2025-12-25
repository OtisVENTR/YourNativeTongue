/**
 * Create Job Edge Function
 * 
 * Creates a new translation job record in the database.
 * Validates user authentication, checks remaining minutes,
 * and triggers asynchronous processing.
 */

import { createCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, getAuthUser } from '../_shared/supabase.ts';
import {
  jsonResponse,
  errorResponse,
  parseJsonBody,
  validateRequired,
  validateUUID,
  validateLanguageCode,
  successResponse,
  handleError,
  asyncHandler,
} from '../_shared/utils.ts';
import { ValidationError, UnauthorizedError, ApiError } from '../_shared/types.ts';

interface CreateJobRequest {
  speaker_id: string;
  job_type: 'audio' | 'video';
  source_language: string;
  target_languages: string[];
  input_file_path: string;
  input_duration_seconds?: number;
}

/**
 * Validates the create job request
 */
function validateCreateJobRequest(data: unknown): CreateJobRequest {
  if (typeof data !== 'object' || data === null) {
    throw new ValidationError('Request body must be an object');
  }

  const body = data as Record<string, unknown>;

  // Validate required fields
  validateRequired(body, [
    'speaker_id',
    'job_type',
    'source_language',
    'target_languages',
    'input_file_path',
  ]);

  // Validate speaker_id is a UUID
  if (!validateUUID(body.speaker_id as string)) {
    throw new ValidationError('speaker_id must be a valid UUID');
  }

  // Validate job_type
  if (body.job_type !== 'audio' && body.job_type !== 'video') {
    throw new ValidationError('job_type must be "audio" or "video"');
  }

  // Validate source_language
  if (!validateLanguageCode(body.source_language as string)) {
    throw new ValidationError('source_language must be a valid language code');
  }

  // Validate target_languages
  if (!Array.isArray(body.target_languages) || body.target_languages.length === 0) {
    throw new ValidationError('target_languages must be a non-empty array');
  }

  for (const lang of body.target_languages) {
    if (!validateLanguageCode(lang as string)) {
      throw new ValidationError(`Invalid language code in target_languages: ${lang}`);
    }
  }

  // Validate input_file_path
  if (typeof body.input_file_path !== 'string' || body.input_file_path.trim() === '') {
    throw new ValidationError('input_file_path must be a non-empty string');
  }

  // Validate input_duration_seconds if provided
  if (body.input_duration_seconds !== undefined) {
    if (typeof body.input_duration_seconds !== 'number' || body.input_duration_seconds < 0) {
      throw new ValidationError('input_duration_seconds must be a non-negative number');
    }
  }

  return {
    speaker_id: body.speaker_id as string,
    job_type: body.job_type as 'audio' | 'video',
    source_language: body.source_language as string,
    target_languages: body.target_languages as string[],
    input_file_path: body.input_file_path as string,
    input_duration_seconds: body.input_duration_seconds as number | undefined,
  };
}

/**
 * Checks if user has enough minutes remaining
 */
async function checkUserMinutes(
  supabase: ReturnType<typeof createSupabaseClient>,
  userId: string,
  requiredMinutes: number
): Promise<void> {
  const { data: user, error } = await supabase
    .from('users')
    .select('minutes_used_current_period, minutes_included')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new ApiError('Failed to fetch user data', 500);
  }

  const minutesRemaining = user.minutes_included - user.minutes_used_current_period;

  if (minutesRemaining < requiredMinutes) {
    throw new ApiError(
      `Insufficient minutes remaining. Required: ${requiredMinutes}, Available: ${minutesRemaining}`,
      402 // Payment Required
    );
  }
}

/**
 * Verifies the speaker belongs to the user
 */
async function verifySpeakerOwnership(
  supabase: ReturnType<typeof createSupabaseClient>,
  userId: string,
  speakerId: string
): Promise<void> {
  const { data: speaker, error } = await supabase
    .from('speakers')
    .select('id, user_id')
    .eq('id', speakerId)
    .eq('user_id', userId)
    .single();

  if (error || !speaker) {
    throw new ValidationError('Speaker not found or does not belong to user');
  }
}

/**
 * Creates a job record in the database
 */
async function createJobRecord(
  supabase: ReturnType<typeof createSupabaseClient>,
  userId: string,
  jobData: CreateJobRequest
): Promise<string> {
  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      user_id: userId,
      speaker_id: jobData.speaker_id,
      job_type: jobData.job_type,
      status: 'queued',
      source_language: jobData.source_language,
      target_languages: jobData.target_languages,
      input_file_path: jobData.input_file_path,
      input_duration_seconds: jobData.input_duration_seconds,
      retry_count: 0,
    })
    .select('id')
    .single();

  if (error || !job) {
    console.error('Error creating job:', error);
    throw new ApiError('Failed to create job record', 500);
  }

  return job.id;
}

/**
 * Triggers the process-transcription function asynchronously
 */
async function triggerProcessTranscription(
  supabase: ReturnType<typeof createSupabaseClient>,
  jobId: string
): Promise<void> {
  try {
    // Use Supabase's built-in function invocation via HTTP
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Supabase URL or Service Role Key not found, skipping async trigger');
      return;
    }

    // Call the process-transcription function asynchronously
    // Using fetch with no await to make it fire-and-forget
    // Using service role key for internal function-to-function calls
    fetch(`${supabaseUrl}/functions/v1/process-transcription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ job_id: jobId }),
    }).catch((error) => {
      console.error('Failed to trigger process-transcription:', error);
      // Don't throw - we don't want to fail the job creation if triggering fails
      // The job can be processed later via a cron job or manual trigger
    });
  } catch (error) {
    console.error('Error triggering process-transcription:', error);
    // Don't throw - job creation succeeds even if trigger fails
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

  // Get authenticated user
  const authToken = getAuthUser(request);
  if (!authToken) {
    return errorResponse(new UnauthorizedError('Authentication required'), 401, corsHeaders);
  }

  // Create Supabase client (service role for admin operations)
  const supabase = createSupabaseClient();
  
  // Verify the user's token and get user ID
  // Use the service role client to verify the JWT token
  const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
  if (authError || !user) {
    return errorResponse(new UnauthorizedError('Invalid authentication token'), 401, corsHeaders);
  }

  const userId = user.id;

  // Parse and validate request body
  let jobData: CreateJobRequest;
  try {
    const body = await parseJsonBody(request);
    jobData = validateCreateJobRequest(body);
  } catch (error) {
    return errorResponse(error, error instanceof ApiError ? error.statusCode : 400, corsHeaders);
  }

  // Verify speaker ownership
  try {
    await verifySpeakerOwnership(supabase, userId, jobData.speaker_id);
  } catch (error) {
    return errorResponse(error, error instanceof ApiError ? error.statusCode : 400, corsHeaders);
  }

  // Calculate required minutes (estimate: 1 minute of audio = 1 minute of processing)
  const requiredMinutes = jobData.input_duration_seconds
    ? Math.ceil(jobData.input_duration_seconds / 60)
    : 1; // Default to 1 minute if not provided

  // Check user has enough minutes
  try {
    await checkUserMinutes(supabase, userId, requiredMinutes);
  } catch (error) {
    return errorResponse(error, error instanceof ApiError ? error.statusCode : 402, corsHeaders);
  }

  // Create job record
  let jobId: string;
  try {
    jobId = await createJobRecord(supabase, userId, jobData);
  } catch (error) {
    return errorResponse(error, error instanceof ApiError ? error.statusCode : 500, corsHeaders);
  }

  // Trigger process-transcription asynchronously (fire-and-forget)
  triggerProcessTranscription(supabase, jobId);

  // Return success response with job ID
  return successResponse(
    { job_id: jobId },
    'Job created successfully',
    corsHeaders
  );
}

// Deno.serve is the entry point for Edge Functions
Deno.serve(asyncHandler(handleRequest));

