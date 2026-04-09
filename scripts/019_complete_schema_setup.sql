-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP VIEW IF EXISTS student_progress_summary CASCADE;
DROP VIEW IF EXISTS parent_dashboard_stats CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS practice_attempts CASCADE;
DROP TABLE IF EXISTS practice_sessions CASCADE;
DROP TABLE IF EXISTS mastery_tracking CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS parents CASCADE;

-- Create parents table
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_parents_email ON parents(email);
CREATE INDEX idx_parents_created_at ON parents(created_at);

-- Create students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  grade INTEGER NOT NULL CHECK (grade >= 1 AND grade <= 12),
  avatar VARCHAR(50),
  total_coins INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_practice_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_students_grade ON students(grade);
CREATE INDEX idx_students_created_at ON students(created_at);

-- Create skills table
CREATE TABLE skills (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  grade INTEGER NOT NULL,
  domain VARCHAR(100),
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  prerequisites VARCHAR(100)[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_skills_grade ON skills(grade);
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_domain ON skills(domain);

-- Create mastery_tracking table
CREATE TABLE mastery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  skill_id VARCHAR(100) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
  attempts_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  last_practiced TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, skill_id)
);

CREATE INDEX idx_mastery_student_id ON mastery_tracking(student_id);
CREATE INDEX idx_mastery_skill_id ON mastery_tracking(skill_id);
CREATE INDEX idx_mastery_level ON mastery_tracking(mastery_level);

-- Create practice_sessions table
CREATE TABLE practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_type VARCHAR(50) NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER DEFAULT 0,
  coins_earned INTEGER DEFAULT 0,
  time_spent_seconds INTEGER,
  topics_covered VARCHAR(100)[],
  difficulty_level INTEGER
);

CREATE INDEX idx_sessions_student_id ON practice_sessions(student_id);
CREATE INDEX idx_sessions_started_at ON practice_sessions(started_at);
CREATE INDEX idx_sessions_type ON practice_sessions(session_type);

-- Create practice_attempts table
CREATE TABLE practice_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  skill_id VARCHAR(100) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  student_answer TEXT,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER,
  hint_used BOOLEAN DEFAULT false,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attempts_session_id ON practice_attempts(session_id);
CREATE INDEX idx_attempts_student_id ON practice_attempts(student_id);
CREATE INDEX idx_attempts_skill_id ON practice_attempts(skill_id);
CREATE INDEX idx_attempts_attempted_at ON practice_attempts(attempted_at);

-- Create achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  achievement_type VARCHAR(100) NOT NULL,
  achievement_name VARCHAR(255) NOT NULL,
  description TEXT,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX idx_achievements_student_id ON achievements(student_id);
CREATE INDEX idx_achievements_type ON achievements(achievement_type);
CREATE INDEX idx_achievements_earned_at ON achievements(earned_at);

-- Create analytics views
CREATE VIEW student_progress_summary AS
SELECT 
  s.id as student_id,
  s.name as student_name,
  s.grade,
  s.total_coins,
  s.current_streak,
  COUNT(DISTINCT mt.skill_id) as total_skills_practiced,
  AVG(mt.mastery_level) as average_mastery,
  COUNT(DISTINCT ps.id) as total_sessions,
  SUM(ps.correct_answers)::FLOAT / NULLIF(SUM(ps.total_questions), 0) as overall_accuracy
FROM students s
LEFT JOIN mastery_tracking mt ON s.id = mt.student_id
LEFT JOIN practice_sessions ps ON s.id = ps.student_id
GROUP BY s.id, s.name, s.grade, s.total_coins, s.current_streak;

CREATE VIEW parent_dashboard_stats AS
SELECT 
  p.id as parent_id,
  p.name as parent_name,
  COUNT(DISTINCT s.id) as total_students,
  SUM(s.total_coins) as total_family_coins,
  MAX(s.current_streak) as best_streak,
  COUNT(DISTINCT ps.id) as total_family_sessions
FROM parents p
LEFT JOIN students s ON p.id = s.parent_id
LEFT JOIN practice_sessions ps ON s.id = ps.student_id
GROUP BY p.id, p.name;

-- Insert initial skills data (Grade 1 sample)
INSERT INTO skills (id, name, description, category, grade, domain) VALUES
('add-within-10', 'Addition within 10', 'Add numbers with sums up to 10', 'addition', 1, 'Operations & Algebraic Thinking'),
('subtract-within-10', 'Subtraction within 10', 'Subtract numbers within 10', 'subtraction', 1, 'Operations & Algebraic Thinking'),
('count-to-20', 'Count to 20', 'Count and write numbers up to 20', 'counting', 1, 'Number & Place Value'),
('compare-numbers', 'Compare Numbers', 'Use <, >, = to compare numbers', 'comparison', 1, 'Number & Place Value')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE parents IS 'Parent/guardian accounts';
COMMENT ON TABLE students IS 'Student profiles linked to parents';
COMMENT ON TABLE skills IS 'Math skills and learning objectives';
COMMENT ON TABLE mastery_tracking IS 'Tracks student mastery level per skill';
COMMENT ON TABLE practice_sessions IS 'Individual practice session records';
COMMENT ON TABLE practice_attempts IS 'Individual question attempts within sessions';
COMMENT ON TABLE achievements IS 'Student achievements and milestones';
