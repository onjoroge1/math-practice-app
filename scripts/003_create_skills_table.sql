-- Create skills/topics catalog
CREATE TABLE IF NOT EXISTS skills (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- operations, number-sense, measurement, etc.
  grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 12),
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  prerequisites TEXT[], -- Array of skill IDs that should be mastered first
  learning_objectives TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_skills_grade ON skills(grade);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_grade_category ON skills(grade, category);
