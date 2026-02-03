-- Migration: Create modules table for storing training modules
-- Run this in Supabase Dashboard > SQL Editor

-- Create the modules table
CREATE TABLE IF NOT EXISTS modules (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  estimated_time VARCHAR(50),
  thumbnail_url TEXT,
  prerequisites TEXT[] DEFAULT '{}',
  requires_supervisor_signoff BOOLEAN DEFAULT false,
  job_roles TEXT[] DEFAULT '{}',
  steps JSONB DEFAULT '[]',
  knowledge_checks JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_modules_active ON modules(is_active);
CREATE INDEX IF NOT EXISTS idx_modules_sort ON modules(sort_order);
CREATE INDEX IF NOT EXISTS idx_modules_job_roles ON modules USING GIN(job_roles);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_modules_updated_at ON modules;
CREATE TRIGGER update_modules_updated_at
    BEFORE UPDATE ON modules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active modules
CREATE POLICY "Anyone can read active modules" ON modules
  FOR SELECT
  USING (is_active = true);

-- Policy: Allow all operations for authenticated users (admin backend)
CREATE POLICY "Allow insert for authenticated" ON modules
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated" ON modules
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated" ON modules
  FOR DELETE
  TO authenticated
  USING (true);

-- IMPORTANT: Grant full access to service_role (backend uses this)
-- Service role should bypass RLS, but explicitly grant just in case
GRANT ALL ON modules TO service_role;
GRANT ALL ON modules TO anon;
GRANT ALL ON modules TO authenticated;

-- Policy: Service role can do everything (for backend)
-- Note: Service role bypasses RLS by default
