/**
 * CORS Headers Utility
 * 
 * Provides standardized CORS headers for Supabase Edge Functions
 */

export interface CorsOptions {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const DEFAULT_OPTIONS: Required<Omit<CorsOptions, 'origin'>> = {
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Creates CORS headers for a response
 */
export function createCorsHeaders(options: CorsOptions = {}): Headers {
  const headers = new Headers();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Handle origin
  if (opts.origin) {
    if (Array.isArray(opts.origin)) {
      headers.set('Access-Control-Allow-Origin', opts.origin.join(', '));
    } else {
      headers.set('Access-Control-Allow-Origin', opts.origin);
    }
  } else {
    headers.set('Access-Control-Allow-Origin', '*');
  }

  // Set other CORS headers
  headers.set('Access-Control-Allow-Methods', opts.methods.join(', '));
  headers.set('Access-Control-Allow-Headers', opts.allowedHeaders.join(', '));
  headers.set('Access-Control-Max-Age', opts.maxAge.toString());

  if (opts.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return headers;
}

/**
 * Creates a CORS response for preflight OPTIONS requests
 */
export function createCorsResponse(options: CorsOptions = {}): Response {
  return new Response(null, {
    status: 204,
    headers: createCorsHeaders(options),
  });
}

/**
 * Adds CORS headers to an existing response
 */
export function addCorsHeaders(
  response: Response,
  options: CorsOptions = {}
): Response {
  const corsHeaders = createCorsHeaders(options);
  
  // Copy existing headers
  corsHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

/**
 * Handles CORS for a request, returning a response if it's a preflight request
 */
export function handleCors(
  request: Request,
  options: CorsOptions = {}
): Response | null {
  if (request.method === 'OPTIONS') {
    return createCorsResponse(options);
  }
  return null;
}

