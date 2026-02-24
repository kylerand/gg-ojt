-- Supabase SQL Schema for GG OJT Training System
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- AUTO-UPDATE TIMESTAMPS FUNCTION
-- (defined first so triggers can reference it)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  auth_id UUID,                        -- Supabase Auth user ID
  name VARCHAR(255) DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  role VARCHAR(20) DEFAULT 'trainee' CHECK (role IN ('trainee', 'supervisor', 'admin')),
  job_role VARCHAR(100) DEFAULT '',
  department VARCHAR(100) DEFAULT '',
  hire_date DATE,
  certifications JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  password_reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON users FOR ALL USING (true);

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MODULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS modules (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  estimated_time VARCHAR(50) DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  prerequisites JSONB DEFAULT '[]',
  requires_supervisor_signoff BOOLEAN DEFAULT FALSE,
  job_roles JSONB DEFAULT '[]',
  steps JSONB DEFAULT '[]',
  knowledge_checks JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modules_active ON modules(is_active);
CREATE INDEX IF NOT EXISTS idx_modules_sort ON modules(sort_order);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON modules FOR ALL USING (true);

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- LEARNING PATHS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS learning_paths (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  estimated_time VARCHAR(50) DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  module_ids JSONB DEFAULT '[]',
  knowledge_checks JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_paths_active ON learning_paths(is_active);
CREATE INDEX IF NOT EXISTS idx_learning_paths_sort ON learning_paths(sort_order);

ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON learning_paths FOR ALL USING (true);

CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON learning_paths
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainee_id VARCHAR(50) NOT NULL UNIQUE,
  trainee_name VARCHAR(255) DEFAULT '',
  cart_type VARCHAR(50) DEFAULT 'electric-standard',
  email VARCHAR(255) DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  department VARCHAR(100) DEFAULT '',
  supervisor VARCHAR(255) DEFAULT '',
  hire_date DATE,
  job_role VARCHAR(100) DEFAULT '',
  certifications JSONB DEFAULT '[]',
  emergency_contact TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_trainee_id ON progress(trainee_id);

ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON progress FOR ALL USING (true);

CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MODULE PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS module_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainee_id VARCHAR(50) NOT NULL,
  module_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'not-started' CHECK (status IN ('not-started', 'in-progress', 'completed')),
  current_step INTEGER DEFAULT 0,
  supervisor_signoff BOOLEAN DEFAULT FALSE,
  supervisor_name VARCHAR(255),
  signoff_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trainee_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_module_progress_trainee ON module_progress(trainee_id);

ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON module_progress FOR ALL USING (true);

CREATE TRIGGER update_module_progress_updated_at BEFORE UPDATE ON module_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

ALTER TABLE step_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON step_progress FOR ALL USING (true);

CREATE TRIGGER update_step_progress_updated_at BEFORE UPDATE ON step_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON quiz_attempts FOR ALL USING (true);

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

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON notes FOR ALL USING (true);

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON bookmarks FOR ALL USING (true);

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

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON questions FOR ALL USING (true);
CREATE POLICY "Service role full access" ON answers FOR ALL USING (true);
