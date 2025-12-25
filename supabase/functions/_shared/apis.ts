/**
 * External API Helpers
 * 
 * Helper functions for interacting with external APIs:
 * - AssemblyAI (Speech-to-Text)
 * - Google Cloud Translation API
 * - ElevenLabs (Text-to-Speech)
 */

// ============================================================================
// AssemblyAI API
// ============================================================================

const ASSEMBLYAI_API_KEY = Deno.env.get('ASSEMBLYAI_API_KEY');
const ASSEMBLYAI_BASE_URL = 'https://api.assemblyai.com/v2';

export interface AssemblyAITranscript {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  text?: string;
  error?: string;
}

/**
 * Uploads an audio file to AssemblyAI and starts transcription
 */
export async function startAssemblyAITranscription(
  audioUrl: string
): Promise<string> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error('ASSEMBLYAI_API_KEY environment variable not set');
  }

  const response = await fetch(`${ASSEMBLYAI_BASE_URL}/transcript`, {
    method: 'POST',
    headers: {
      'authorization': ASSEMBLYAI_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: audioUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AssemblyAI API error: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Gets the transcription result from AssemblyAI
 */
export async function getAssemblyAITranscription(
  transcriptId: string
): Promise<AssemblyAITranscript> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error('ASSEMBLYAI_API_KEY environment variable not set');
  }

  const response = await fetch(`${ASSEMBLYAI_BASE_URL}/transcript/${transcriptId}`, {
    headers: {
      'authorization': ASSEMBLYAI_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AssemblyAI API error: ${error}`);
  }

  return await response.json();
}

// ============================================================================
// Google Cloud Translation API
// ============================================================================

const GOOGLE_TRANSLATION_API_KEY = Deno.env.get('GOOGLE_TRANSLATION_API_KEY');
const GOOGLE_GLOSSARY_ID = Deno.env.get('GOOGLE_GLOSSARY_ID');
const GOOGLE_TRANSLATE_BASE_URL = 'https://translation.googleapis.com/v3';

export interface GoogleTranslationResponse {
  translations: Array<{
    translatedText: string;
    detectedSourceLanguage?: string;
  }>;
}

/**
 * Translates text using Google Cloud Translation API
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<string> {
  if (!GOOGLE_TRANSLATION_API_KEY) {
    throw new Error('GOOGLE_TRANSLATION_API_KEY environment variable not set');
  }

  const projectId = Deno.env.get('GOOGLE_PROJECT_ID') || 'your-native-tongue';
  const url = `${GOOGLE_TRANSLATE_BASE_URL}/projects/${projectId}/locations/us-central1:translateText`;

  const body: any = {
    contents: [text],
    targetLanguageCode: targetLanguage,
    sourceLanguageCode: sourceLanguage,
  };

  // Add glossary if available
  if (GOOGLE_GLOSSARY_ID) {
    body.glossaryConfig = {
      glossary: GOOGLE_GLOSSARY_ID,
      ignoreCase: true,
    };
  }

  const response = await fetch(`${url}?key=${GOOGLE_TRANSLATION_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Translation API error: ${error}`);
  }

  const data: GoogleTranslationResponse = await response.json();
  return data.translations[0]?.translatedText || text;
}

// ============================================================================
// ElevenLabs API
// ============================================================================

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
}

/**
 * Generates speech from text using ElevenLabs TTS
 */
export async function generateSpeech(
  text: string,
  voiceId: string,
  modelId: string = 'eleven_multilingual_v2'
): Promise<ArrayBuffer> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY environment variable not set');
  }

  const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${error}`);
  }

  return await response.arrayBuffer();
}

/**
 * Gets a list of available voices from ElevenLabs
 */
export async function getElevenLabsVoices(): Promise<ElevenLabsVoice[]> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY environment variable not set');
  }

  const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${error}`);
  }

  const data = await response.json();
  return data.voices || [];
}

