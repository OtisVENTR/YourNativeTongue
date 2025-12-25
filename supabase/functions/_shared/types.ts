/**
 * Shared TypeScript Types
 * 
 * Common types used across Edge Functions
 */

// ============================================================================
// Job Types
// ============================================================================

export type JobType = 'audio' | 'video';

export type JobStatus =
  | 'queued'
  | 'processing_asr'
  | 'processing_translation'
  | 'processing_tts'
  | 'processing_finalize'
  | 'completed'
  | 'failed';

export interface Job {
  id: string;
  user_id: string;
  speaker_id: string;
  job_type: JobType;
  status: JobStatus;
  source_language: string;
  target_languages: string[];
  input_file_path: string;
  input_duration_seconds?: number;
  output_files?: Record<string, {
    audio_path?: string;
    caption_path?: string;
  }>;
  transcript_text?: string;
  translations?: Record<string, string>;
  cost_usd?: number;
  created_at: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  error_message?: string;
  retry_count: number;
}

// ============================================================================
// Speaker Types
// ============================================================================

export type VoiceQuality = 'instant' | 'professional';

export type TrainingStatus = 'pending' | 'training' | 'ready' | 'failed';

export interface Speaker {
  id: string;
  user_id: string;
  speaker_name: string;
  voice_clone_id?: string;
  voice_quality?: VoiceQuality;
  training_status: TrainingStatus;
  sample_duration_seconds?: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// User Types
// ============================================================================

export type PlanType = 'free' | 'basic' | 'pro' | 'church';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  organization?: string;
  plan_type: PlanType;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  minutes_used_current_period: number;
  minutes_included: number;
  billing_period_start?: string;
  billing_period_end?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Glossary Types
// ============================================================================

export interface GlossaryTerm {
  id: string;
  source_term: string;
  source_language: string;
  target_term: string;
  target_language: string;
  category?: string;
  is_active: boolean;
  created_at: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

// ============================================================================
// Edge Function Request/Response Types
// ============================================================================

export interface EdgeFunctionRequest {
  body?: unknown;
  headers: Headers;
  method: string;
  url: string;
}

export interface EdgeFunctionResponse {
  status?: number;
  headers?: Headers;
  body?: unknown;
}

// ============================================================================
// Error Types
// ============================================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

