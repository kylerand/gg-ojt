-- Migration: Add profile fields to progress table
-- Run this in Supabase Dashboard > SQL Editor

-- Add profile fields to progress table
ALTER TABLE progress ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE progress ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE progress ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE progress ADD COLUMN IF NOT EXISTS supervisor VARCHAR(255);
ALTER TABLE progress ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE progress ADD COLUMN IF NOT EXISTS job_role VARCHAR(100);
ALTER TABLE progress ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}';
ALTER TABLE progress ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(255);
ALTER TABLE progress ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index on job_role for filtering
CREATE INDEX IF NOT EXISTS idx_progress_job_role ON progress(job_role);
