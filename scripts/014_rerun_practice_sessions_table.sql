-- Track each practice session
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_type VARCHAR(50) NOT NULL, -- adaptive, speed-drill, diagnostic
  grade INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  
  -- Session stats
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,
  skipped_questions INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2),
  
  -- Coins and rewards
  coins_earned INTEGER DEFAULT 0,
  
  -- Topics covered in this session
  topics_covered TEXT[],
  skills_practiced TEXT[],
  
  -- Session metadata
  device_type VARCHAR(50), -- mobile, tablet, desktop
  is_completed BOOLEAN DEFAULT false
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sessions_student_id ON practice_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON practice_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_type ON practice_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_sessions_student_date ON practice_sessions(student_id, started_at);
