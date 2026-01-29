-- Migration: Add auth_id column to users table
-- This links our user profiles to Supabase Auth users

-- Add the auth_id column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

-- Create an index on auth_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Make password_hash nullable since Supabase Auth handles passwords now
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add password_reset_at column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_at TIMESTAMPTZ;

-- Update RLS policies to work with Supabase Auth
-- Note: Run these in Supabase Dashboard SQL Editor

-- Allow authenticated users to read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT
  USING (auth.uid() = auth_id OR auth.jwt() ->> 'role' IN ('admin', 'supervisor'));

-- Allow authenticated users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = auth_id OR auth.jwt() ->> 'role' IN ('admin', 'supervisor'));

-- Allow admins to manage all users
DROP POLICY IF EXISTS "Admins can manage users" ON users;
CREATE POLICY "Admins can manage users" ON users
  FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'supervisor'));

-- Service role can do anything (for backend operations)
-- Note: Service role bypasses RLS by default
