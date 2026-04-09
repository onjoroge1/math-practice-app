-- Track student achievements and milestones
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  achievement_type VARCHAR(100) NOT NULL, -- first-session, 10-streak, mastery-level-5, etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  points_awarded INTEGER DEFAULT 0,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Metadata
  metadata JSONB -- Flexible field for achievement-specific data
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_achievements_student_id ON achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_achievements_earned_at ON achievements(earned_at);
