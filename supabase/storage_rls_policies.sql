-- Storage RLS Policies
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- This sets up Row Level Security policies for the storage buckets

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR input-files BUCKET (PRIVATE)
-- ============================================

-- Allow authenticated users to upload files to input-files
CREATE POLICY "Allow authenticated uploads to input-files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'input-files'
);

-- Allow users to read their own files in input-files (files in their user folder)
CREATE POLICY "Allow users to read own files in input-files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'input-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own files in input-files
CREATE POLICY "Allow users to update own files in input-files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'input-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'input-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files in input-files
CREATE POLICY "Allow users to delete own files in input-files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'input-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- RLS POLICIES FOR output-files BUCKET (PUBLIC)
-- ============================================

-- Public bucket: Allow anyone to read files
CREATE POLICY "Allow public reads from output-files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'output-files');

-- Allow authenticated users to upload files to output-files
CREATE POLICY "Allow authenticated uploads to output-files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'output-files'
);

-- Allow users to update their own files in output-files
CREATE POLICY "Allow users to update own files in output-files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'output-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'output-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files in output-files
CREATE POLICY "Allow users to delete own files in output-files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'output-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- RLS POLICIES FOR voice-samples BUCKET (PRIVATE)
-- ============================================

-- Allow authenticated users to upload voice samples
CREATE POLICY "Allow authenticated uploads to voice-samples"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-samples'
);

-- Allow users to read their own voice samples
CREATE POLICY "Allow users to read own voice samples"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice-samples' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own voice samples
CREATE POLICY "Allow users to update own voice samples"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'voice-samples' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'voice-samples' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own voice samples
CREATE POLICY "Allow users to delete own voice samples"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'voice-samples' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

