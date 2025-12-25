/**
 * Helper Functions
 * 
 * Utility functions used across Edge Functions
 */

import { ApiError, ValidationError } from './types.ts';

// ============================================================================
// Request Parsing
// ============================================================================

/**
 * Parses JSON from a request body
 */
export async function parseJsonBody<T = unknown>(request: Request): Promise<T> {
  try {
    const text = await request.text();
    if (!text) {
      throw new ValidationError('Request body is empty');
    }
    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Invalid JSON in request body');
  }
}

/**
 * Gets a query parameter from the request URL
 */
export function getQueryParam(request: Request, key: string): string | null {
  const url = new URL(request.url);
  return url.searchParams.get(key);
}

/**
 * Gets all query parameters as an object
 */
export function getQueryParams(request: Request): Record<string, string> {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Creates a JSON response with CORS headers
 */
export function jsonResponse<T>(
  data: T,
  status: number = 200,
  corsHeaders?: Headers
): Response {
  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  if (corsHeaders) {
    corsHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}

/**
 * Creates an error response
 */
export function errorResponse(
  error: Error | string,
  status: number = 500,
  corsHeaders?: Headers
): Response {
  const message = typeof error === 'string' ? error : error.message;
  const code = error instanceof ApiError ? error.code : undefined;

  return jsonResponse(
    {
      success: false,
      error: message,
      code,
    },
    status,
    corsHeaders
  );
}

/**
 * Creates a success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  corsHeaders?: Headers
): Response {
  return jsonResponse(
    {
      success: true,
      data,
      message,
    },
    200,
    corsHeaders
  );
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validates that required fields are present
 */
export function validateRequired(
  data: Record<string, unknown>,
  fields: string[]
): void {
  const missing: string[] = [];

  for (const field of fields) {
    if (!data[field] && data[field] !== 0 && data[field] !== false) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      { missing: missing.join(', ') }
    );
  }
}

/**
 * Validates that a value is a valid language code
 */
export function validateLanguageCode(code: string): boolean {
  // Basic validation - ISO 639-1 language codes are 2 characters
  return /^[a-z]{2}(-[A-Z]{2})?$/.test(code);
}

/**
 * Validates that a value is a valid UUID
 */
export function validateUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    uuid
  );
}

// ============================================================================
// File Helpers
// ============================================================================

/**
 * Gets file extension from a filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Gets MIME type from file extension
 */
export function getMimeType(filename: string): string {
  const ext = getFileExtension(filename);
  const mimeTypes: Record<string, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    mp4: 'video/mp4',
    srt: 'text/srt',
    vtt: 'text/vtt',
    json: 'application/json',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Formats file size in bytes to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ============================================================================
// Time Helpers
// ============================================================================

/**
 * Formats duration in seconds to MM:SS format
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculates duration between two timestamps in seconds
 */
export function calculateDuration(
  start: string,
  end: string
): number {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  return (endTime - startTime) / 1000;
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Handles errors and returns appropriate response
 */
export function handleError(
  error: unknown,
  corsHeaders?: Headers
): Response {
  console.error('Error:', error);

  if (error instanceof ApiError) {
    return errorResponse(error, error.statusCode, corsHeaders);
  }

  if (error instanceof Error) {
    return errorResponse(error.message, 500, corsHeaders);
  }

  return errorResponse('Internal server error', 500, corsHeaders);
}

// ============================================================================
// Async Helpers
// ============================================================================

/**
 * Wraps an async function to catch errors and return appropriate responses
 */
export function asyncHandler(
  handler: (request: Request) => Promise<Response>,
  corsHeaders?: Headers
) {
  return async (request: Request): Promise<Response> => {
    try {
      return await handler(request);
    } catch (error) {
      return handleError(error, corsHeaders);
    }
  };
}

