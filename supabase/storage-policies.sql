-- Supabase Storage Setup for Training Videos
-- Run this in the Supabase SQL Editor AFTER creating the bucket in the Dashboard

-- Note: Buckets are created in the Supabase Dashboard under Storage
-- Create a bucket called "training-media" with the following settings:
--   - Public bucket: ON (for video streaming)
--   - File size limit: 500MB
--   - Allowed MIME types: video/*, image/*

-- Storage policies for the training-media bucket
-- These allow the service role to upload and the public to view

-- Policy: Allow public read access to all files
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'training-media');

-- Policy: Allow authenticated uploads (via service role)
CREATE POLICY "Service role upload access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'training-media');

-- Policy: Allow service role to update files
CREATE POLICY "Service role update access"
ON storage.objects FOR UPDATE
USING (bucket_id = 'training-media');

-- Policy: Allow service role to delete files
CREATE POLICY "Service role delete access"
ON storage.objects FOR DELETE
USING (bucket_id = 'training-media');
