/**
 * Train Voice Edge Function
 * 
 * Trains a voice clone using ElevenLabs API from an uploaded voice sample.
 * Updates the speaker record with the voice_clone_id and training status.
 */

import { createCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, getAuthUser } from '../_shared/supabase.ts';
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
import { ValidationError, UnauthorizedError, ApiError } from '../_shared/types.ts';

interface TrainVoiceRequest {
  speaker_id: string;
}

/**
 * Validates the train voice request
 */
function validateTrainVoiceRequest(data: unknown): TrainVoiceRequest {
  if (typeof data !== 'object' || data === null) {
    throw new ValidationError('Request body must be an object');
  }

  const body = data as Record<string, unknown>;
  validateRequired(body, ['speaker_id']);
  validateUUID(body.speaker_id, 'speaker_id');

  return {
    speaker_id: body.speaker_id as string,
  };
}

/**
 * Downloads a file from Supabase Storage
 */
async function downloadFileFromStorage(
  supabase: ReturnType<typeof createSupabaseClient>,
  filePath: string
): Promise<ArrayBuffer> {
  const { data, error } = await supabase.storage
    .from('voice-samples')
    .download(filePath);

  if (error || !data) {
    throw new ApiError(`Failed to download voice sample: ${error?.message || 'Unknown error'}`);
  }

  return await data.arrayBuffer();
}

/**
 * Creates a voice clone using ElevenLabs API
 */
async function createVoiceClone(audioFile: ArrayBuffer, fileName: string): Promise<string> {
  const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
  if (!elevenLabsApiKey) {
    throw new ApiError('ElevenLabs API key not configured');
  }

  // Create FormData for multipart/form-data request
  // ElevenLabs API expects the file in a 'files' field and optionally 'name' and 'description'
  const formData = new FormData();
  const blob = new Blob([audioFile]);
  formData.append('files', blob, fileName);
  // Use filename without extension as voice name
  formData.append('name', fileName.replace(/\.[^/.]+$/, ''));

  const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
    method: 'POST',
    headers: {
      'xi-api-key': elevenLabsApiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ElevenLabs API error:', response.status, errorText);
    throw new ApiError(`ElevenLabs API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  
  // ElevenLabs returns voice_id in the response
  if (!result.voice_id) {
    throw new ApiError('ElevenLabs API did not return a voice_id');
  }

  return result.voice_id;
}

/**
 * Main handler for train-voice function
 */
async function trainVoiceHandler(request: Request): Promise<Response> {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  // Verify authentication
  const authToken = getAuthUser(request);
  if (!authToken) {
    return errorResponse(new UnauthorizedError('Authentication required'), 401);
  }

  try {
    // Parse and validate request body
    const body = await parseJsonBody(request);
    const { speaker_id } = validateTrainVoiceRequest(body);

    // Create Supabase client with service role for admin operations
    const supabase = createSupabaseClient();

    // Verify user token and get user ID using service role client
    const { data: { user }, error: userError } = await supabase.auth.getUser(authToken);
    if (userError || !user) {
      return errorResponse(new UnauthorizedError('Invalid authentication token'), 401);
    }

    // Fetch speaker record and verify user has access
    const { data: speaker, error: speakerError } = await supabase
      .from('speakers')
      .select('*')
      .eq('id', speaker_id)
      .single();

    if (speakerError || !speaker) {
      return errorResponse(new ValidationError('Speaker not found'), 404);
    }

    // Verify user is a member of the speaker's organization
    const orgId = speaker.organization_id;
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return errorResponse(new UnauthorizedError('You do not have access to this speaker'), 403);
    }

    // Only owners and admins can train voices
    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return errorResponse(new UnauthorizedError('Only owners and admins can train voices'), 403);
    }

    // Check if speaker already has a voice clone
    if (speaker.voice_clone_id) {
      return errorResponse(new ValidationError('Speaker already has a trained voice'), 400);
    }

    // Fetch voice sample record
    const { data: voiceSample, error: sampleError } = await supabase
      .from('voice_samples')
      .select('*')
      .eq('speaker_id', speaker_id)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single();

    if (sampleError || !voiceSample) {
      return errorResponse(new ValidationError('Voice sample not found'), 404);
    }

    // Update speaker status to training
    await supabase
      .from('speakers')
      .update({ training_status: 'training' })
      .eq('id', speaker_id);

    try {
      // Download voice sample from storage
      const audioFile = await downloadFileFromStorage(supabase, voiceSample.file_path);

      // Create voice clone using ElevenLabs
      const voiceCloneId = await createVoiceClone(audioFile, voiceSample.file_name);

      // Update speaker with voice_clone_id and set status to ready
      const { error: updateError } = await supabase
        .from('speakers')
        .update({
          voice_clone_id: voiceCloneId,
          training_status: 'ready',
        })
        .eq('id', speaker_id);

      if (updateError) {
        throw updateError;
      }

      return successResponse({
        speaker_id,
        voice_clone_id: voiceCloneId,
        status: 'ready',
      });
    } catch (error) {
      // Update speaker status to failed
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await supabase
        .from('speakers')
        .update({
          training_status: 'failed',
        })
        .eq('id', speaker_id);

      console.error('Voice training failed:', error);
      return errorResponse(
        new ApiError(`Voice training failed: ${errorMessage}`),
        500
      );
    }
  } catch (error) {
    return handleError(error);
  }
}

// Deno.serve is the main entry point for Edge Functions
Deno.serve(asyncHandler(trainVoiceHandler));

