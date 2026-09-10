-- Authoritative reset schema for math-practice-app.
-- DESTRUCTIVE: this drops all application data. Use only through `pnpm db:reset`
-- with ALLOW_DB_RESET=1. Normal database changes belong in scripts/migrations.

-- Drop everything in dependency order
DROP TABLE IF EXISTS schema_migrations CASCADE;
DROP VIEW IF EXISTS parent_dashboard_stats CASCADE;
DROP VIEW IF EXISTS student_progress_summary CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS iowa_attempts CASCADE;
DROP TABLE IF EXISTS practice_attempts CASCADE;
DROP TABLE IF EXISTS practice_sessions CASCADE;
DROP TABLE IF EXISTS mastery_tracking CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS parents CASCADE;

-- ─── Parents ──────────────────────────────────────────────────────────────────

CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subscription_tier VARCHAR(50) DEFAULT 'free',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMPTZ
);

CREATE INDEX idx_parents_email ON parents(email);

-- ─── Students ─────────────────────────────────────────────────────────────────

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  grade INTEGER NOT NULL CHECK (grade >= 1 AND grade <= 12),
  avatar VARCHAR(50),
  total_coins INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_practice_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_students_grade ON students(grade);

-- ─── Skills ───────────────────────────────────────────────────────────────────

CREATE TABLE skills (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  grade INTEGER NOT NULL,
  domain VARCHAR(100),
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  is_active BOOLEAN DEFAULT true,
  prerequisites VARCHAR(100)[],
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_skills_grade ON skills(grade);
CREATE INDEX idx_skills_category ON skills(category);

-- ─── Mastery Tracking ─────────────────────────────────────────────────────────

CREATE TABLE mastery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  skill_id VARCHAR(100) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
  attempts_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, skill_id)
);

CREATE INDEX idx_mastery_student_id ON mastery_tracking(student_id);
CREATE INDEX idx_mastery_skill_id ON mastery_tracking(skill_id);

-- ─── Practice Sessions ────────────────────────────────────────────────────────

CREATE TABLE practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_type VARCHAR(50) NOT NULL,
  grade INTEGER NOT NULL,
  started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  coins_earned INTEGER DEFAULT 0,
  accuracy_percentage NUMERIC(5,2) DEFAULT 0,
  topics_covered TEXT[],
  skills_practiced TEXT[],
  is_completed BOOLEAN DEFAULT false
);

CREATE INDEX idx_sessions_student_id ON practice_sessions(student_id);
CREATE INDEX idx_sessions_started_at ON practice_sessions(started_at);
CREATE INDEX idx_sessions_completed ON practice_sessions(is_completed);

-- ─── Practice Attempts ────────────────────────────────────────────────────────

CREATE TABLE practice_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  skill_id VARCHAR(100) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  student_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  difficulty_level INTEGER DEFAULT 1,
  time_spent_seconds INTEGER,
  hint_used BOOLEAN DEFAULT false,
  vedic_trick_shown TEXT,
  attempted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attempts_session_id ON practice_attempts(session_id);
CREATE INDEX idx_attempts_student_id ON practice_attempts(student_id);
CREATE INDEX idx_attempts_skill_id ON practice_attempts(skill_id);

-- ─── Achievements ─────────────────────────────────────────────────────────────

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  achievement_type VARCHAR(100) NOT NULL,
  achievement_name VARCHAR(255) NOT NULL,
  description TEXT,
  earned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX idx_achievements_student_id ON achievements(student_id);

-- ─── Analytics Views ──────────────────────────────────────────────────────────

CREATE VIEW student_progress_summary AS
SELECT
  s.id AS student_id,
  s.parent_id,
  s.name,
  s.grade,
  s.total_coins,
  s.current_streak,
  s.longest_streak,
  s.avatar,
  COUNT(DISTINCT mt.skill_id) AS total_skills_practiced,
  COALESCE(AVG(mt.mastery_level), 0) AS average_mastery,
  COUNT(DISTINCT ps.id) AS total_sessions,
  COALESCE(
    SUM(ps.correct_answers)::FLOAT / NULLIF(SUM(ps.total_questions), 0),
    0
  ) AS overall_accuracy
FROM students s
LEFT JOIN mastery_tracking mt ON s.id = mt.student_id
LEFT JOIN practice_sessions ps ON s.id = ps.student_id AND ps.is_completed = true
WHERE s.is_active = true
GROUP BY s.id, s.parent_id, s.name, s.grade, s.total_coins, s.current_streak, s.longest_streak, s.avatar;

-- ─── Seed Skills ──────────────────────────────────────────────────────────────
-- Minimal seed; the full skill list lives in lib/mock-data.ts (client-side).
-- These entries exist so practice_attempts can reference them via FK.

INSERT INTO skills (id, name, description, category, grade, domain) VALUES
  -- Grade 1
  ('add-sub-within-10', 'Addition & Subtraction within 10', 'Add and subtract numbers within 10', 'operations-algebraic', 1, 'Operations & Algebraic Thinking'),
  ('add-sub-within-20', 'Addition & Subtraction within 20', 'Add and subtract numbers within 20', 'operations-algebraic', 1, 'Operations & Algebraic Thinking'),
  ('word-problems', 'Word Problems', 'Solve addition and subtraction word problems', 'operations-algebraic', 1, 'Operations & Algebraic Thinking'),
  ('number-sense-120', 'Number Sense to 120', 'Understand place value and counting to 120', 'number-place-value', 1, 'Number & Place Value'),
  ('compare-order', 'Compare & Order Numbers', 'Compare and order numbers using <, >, =', 'number-place-value', 1, 'Number & Place Value'),
  ('measurement-length', 'Measurement & Length', 'Compare and measure lengths', 'measurement', 1, 'Measurement'),
  ('time-telling', 'Telling Time', 'Tell time to the hour and half hour', 'time', 1, 'Time'),
  ('money-coins', 'Money & Coins', 'Identify and count US coins', 'money', 1, 'Money'),
  ('geometry-shapes', '2D & 3D Shapes', 'Identify and describe shapes', 'geometry', 1, 'Geometry'),
  ('make-10', 'Magic of 10', 'Find number pairs that add to 10', 'operations-algebraic', 1, 'Operations & Algebraic Thinking'),
  ('doubles', 'Doubles', 'Add a number to itself (doubles facts)', 'operations-algebraic', 1, 'Operations & Algebraic Thinking'),
  ('add-9', 'Adding 9', 'Add 9 using the add-10-subtract-1 strategy', 'operations-algebraic', 1, 'Operations & Algebraic Thinking'),
  ('halves', 'Halves', 'Find half of even numbers', 'operations-algebraic', 1, 'Operations & Algebraic Thinking'),
  -- Grade 2
  ('add-near-10', 'Near 10 Addition', 'Add numbers near 10 using compensation', 'addition', 2, 'Operations & Algebraic Thinking'),
  ('multiply-by-10', 'Multiply by 10', 'Multiply any number by 10', 'multiplication', 2, 'Operations & Algebraic Thinking'),
  ('multiply-by-5', 'Multiply by 5', 'Multiply by 5 using halving and multiplying by 10', 'multiplication', 2, 'Operations & Algebraic Thinking'),
  ('skip-count', 'Skip Counting', 'Count by 2s, 5s, and 10s', 'multiplication', 2, 'Operations & Algebraic Thinking'),
  -- Grade 3
  ('multiply-by-11', 'Multiply by 11', 'Multiply 2-digit numbers by 11', 'multiplication', 3, 'Operations & Algebraic Thinking'),
  ('divide-by-5', 'Divide by 5', 'Divide by 5 using doubling and dividing by 10', 'division', 3, 'Operations & Algebraic Thinking'),
  ('square-ends-5', 'Square Numbers Ending in 5', 'Square any number ending in 5', 'multiplication', 3, 'Operations & Algebraic Thinking'),
  ('same-tens-add-10', 'Same Tens Add to 10', 'Multiply numbers with same tens digit and ones adding to 10', 'multiplication', 3, 'Operations & Algebraic Thinking'),
  -- Grade 4
  ('multiply-multi-digit', 'Multiply Multi-Digit Numbers', 'Multiply numbers up to 4 digits by 1-digit numbers', 'multiplication', 4, 'Operations & Algebraic Thinking'),
  ('divide-multi-digit', 'Divide Multi-Digit Numbers', 'Divide numbers up to 4 digits by 1-digit divisors', 'division', 4, 'Operations & Algebraic Thinking'),
  ('equivalent-fractions', 'Equivalent Fractions', 'Recognize and generate equivalent fractions', 'fractions', 4, 'Fractions'),
  ('compare-fractions', 'Compare Fractions', 'Compare two fractions with different numerators and denominators', 'fractions', 4, 'Fractions'),
  ('fractions-decimals', 'Fractions & Decimals', 'Convert between fractions and decimals', 'fractions', 4, 'Fractions'),
  ('near-100-below', 'Numbers Near 100 (Below)', 'Multiply numbers just below 100', 'multiplication', 4, 'Operations & Algebraic Thinking'),
  ('near-100-above', 'Numbers Near 100 (Above)', 'Multiply numbers just above 100', 'multiplication', 4, 'Operations & Algebraic Thinking'),
  ('cross-multiply', 'Cross Multiplication', 'Multiply two 2-digit numbers using cross multiplication', 'multiplication', 4, 'Operations & Algebraic Thinking'),
  ('divide-large-by-5', 'Divide Large Numbers by 5', 'Divide any number by 5 quickly', 'division', 4, 'Operations & Algebraic Thinking'),
  ('place-value', 'Place Value to Millions', 'Understand large numbers and rounding', 'place-value', 4, 'Number & Place Value'),
  ('measurement', 'Measurement & Conversion', 'Convert units and solve measurement problems', 'measurement', 4, 'Measurement'),
  ('geometry', 'Geometry & Angles', 'Classify shapes, measure angles', 'geometry', 4, 'Geometry')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE parents IS 'Parent/guardian accounts';
COMMENT ON TABLE students IS 'Student profiles, optionally linked to parents';
COMMENT ON TABLE skills IS 'Math skills and learning objectives';
COMMENT ON TABLE mastery_tracking IS 'Tracks student mastery level per skill';
COMMENT ON TABLE practice_sessions IS 'Individual practice session records';
COMMENT ON TABLE practice_attempts IS 'Individual question attempts within sessions';
COMMENT ON TABLE achievements IS 'Student achievements and milestones';

-- ─── Fixed kid profiles ───────────────────────────────────────────────────────
-- This app has no sign-up flow: two named kids own all progress. One active row
-- per name keeps repeated profile lookups from forking progress across dupes.

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_unique_active_name
  ON students (LOWER(name))
  WHERE is_active = true;

INSERT INTO students (name, grade, avatar) VALUES
  ('Amir', 2, 'rocket'),
  ('Aden', 5, 'dragon')
ON CONFLICT DO NOTHING;
