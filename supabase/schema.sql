-- Supabase SQL Schema for GG OJT Training System
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  role VARCHAR(20) DEFAULT 'trainee' CHECK (role IN ('trainee', 'supervisor', 'admin')),
  job_role VARCHAR(100) DEFAULT '',
  department VARCHAR(100) DEFAULT '',
  hire_date DATE,
  certifications JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster login lookups
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);

-- ============================================
-- PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainee_id VARCHAR(50) NOT NULL,
  trainee_name VARCHAR(255) DEFAULT '',
  cart_type VARCHAR(50) DEFAULT 'electric-standard',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trainee_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_trainee_id ON progress(trainee_id);

-- ============================================
-- MODULE PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS module_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainee_id VARCHAR(50) NOT NULL,
  module_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'not-started' CHECK (status IN ('not-started', 'in-progress', 'completed')),
  current_step INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trainee_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_module_progress_trainee ON module_progress(trainee_id);

-- ============================================
-- STEP PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS step_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainee_id VARCHAR(50) NOT NULL,
  module_id VARCHAR(50) NOT NULL,
  step_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'not-started' CHECK (status IN ('not-started', 'in-progress', 'completed')),
  video_watched BOOLEAN DEFAULT FALSE,
  video_progress DECIMAL(5,2) DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trainee_id, module_id, step_id)
);

CREATE INDEX IF NOT EXISTS idx_step_progress_trainee ON step_progress(trainee_id);
CREATE INDEX IF NOT EXISTS idx_step_progress_module ON step_progress(trainee_id, module_id);

-- ============================================
-- QUIZ ATTEMPTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainee_id VARCHAR(50) NOT NULL,
  module_id VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB DEFAULT '[]',
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_trainee ON quiz_attempts(trainee_id);

-- ============================================
-- NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainee_id VARCHAR(50) NOT NULL,
  module_id VARCHAR(50) NOT NULL,
  step_id VARCHAR(50),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_trainee ON notes(trainee_id);

-- ============================================
-- BOOKMARKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainee_id VARCHAR(50) NOT NULL,
  module_id VARCHAR(50) NOT NULL,
  step_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trainee_id, module_id, step_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_trainee ON bookmarks(trainee_id);

-- ============================================
-- Q&A TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainee_id VARCHAR(50) NOT NULL,
  trainee_name VARCHAR(255) DEFAULT '',
  module_id VARCHAR(50) NOT NULL,
  step_id VARCHAR(50),
  question TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'answered')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  admin_id VARCHAR(50) NOT NULL,
  admin_name VARCHAR(255) DEFAULT '',
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_module ON questions(module_id);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);

-- ============================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_progress_updated_at BEFORE UPDATE ON module_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_step_progress_updated_at BEFORE UPDATE ON step_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (for server-side operations)
-- These policies allow the service role full access
CREATE POLICY "Service role full access" ON users FOR ALL USING (true);
CREATE POLICY "Service role full access" ON progress FOR ALL USING (true);
CREATE POLICY "Service role full access" ON module_progress FOR ALL USING (true);
CREATE POLICY "Service role full access" ON step_progress FOR ALL USING (true);
CREATE POLICY "Service role full access" ON quiz_attempts FOR ALL USING (true);
CREATE POLICY "Service role full access" ON notes FOR ALL USING (true);
CREATE POLICY "Service role full access" ON bookmarks FOR ALL USING (true);
CREATE POLICY "Service role full access" ON questions FOR ALL USING (true);
CREATE POLICY "Service role full access" ON answers FOR ALL USING (true);
