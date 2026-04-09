-- Track student mastery level for each skill
CREATE TABLE IF NOT EXISTS mastery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  skill_id VARCHAR(100) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 5),
  attempts_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint: one mastery record per student per skill
  UNIQUE(student_id, skill_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_mastery_student_id ON mastery_tracking(student_id);
CREATE INDEX IF NOT EXISTS idx_mastery_skill_id ON mastery_tracking(skill_id);
CREATE INDEX IF NOT EXISTS idx_mastery_student_skill ON mastery_tracking(student_id, skill_id);
CREATE INDEX IF NOT EXISTS idx_mastery_level ON mastery_tracking(mastery_level);
