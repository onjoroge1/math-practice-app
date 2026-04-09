-- Track individual question attempts within sessions
CREATE TABLE IF NOT EXISTS practice_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  skill_id VARCHAR(100) NOT NULL REFERENCES skills(id),
  
  -- Question details
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  student_answer TEXT,
  
  -- Attempt metadata
  is_correct BOOLEAN NOT NULL,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  time_spent_seconds INTEGER,
  hint_used BOOLEAN DEFAULT false,
  attempt_number INTEGER DEFAULT 1, -- Track multiple attempts on same question
  
  -- Vedic math trick shown
  vedic_trick_shown TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attempts_session_id ON practice_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student_id ON practice_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_skill_id ON practice_attempts(skill_id);
CREATE INDEX IF NOT EXISTS idx_attempts_created_at ON practice_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_attempts_student_skill ON practice_attempts(student_id, skill_id);
