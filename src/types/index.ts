export type UserRole = 'owner' | 'admin' | 'member'

export interface Organization {
  id: string
  name: string
  invite_code: string
  minutes_included: number
  minutes_used: number
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  phone?: string | null
  website?: string | null
  email?: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: UserRole
  created_at: string
}

export interface UserWithOrg {
  user: any // Supabase user
  organization: Organization | null
  role: UserRole | null
}

export interface Speaker {
  id: string
  organization_id: string
  name: string
  role: 'pastor' | 'worship_leader' | 'guest_speaker'
  voice_clone_id: string | null
  training_status: 'pending' | 'training' | 'ready' | 'failed'
  sample_duration_seconds: number | null
  created_at: string
}

export interface Job {
  id: string
  organization_id: string
  user_id: string
  speaker_id: string
  status: string
  source_language: string
  target_language: string
  input_file_path: string
  input_duration_seconds: number | null
  output_audio_path: string | null
  output_caption_path: string | null
  transcript_text: string | null
  translated_text: string | null
  cost_usd: number | null
  created_at: string
  error_message: string | null
}

