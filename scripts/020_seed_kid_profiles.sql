-- Fixed kid profiles.
--
-- The onboarding wizard was removed: this app serves two named kids, and their
-- progress accumulates under those names. Earlier migrations declared
-- students.parent_id NOT NULL, which blocks creating a student before a parent
-- account exists, so relax it first.

ALTER TABLE students ALTER COLUMN parent_id DROP NOT NULL;

-- One active row per name, so repeated profile lookups can never fork progress
-- across duplicate students.
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_unique_active_name
  ON students (LOWER(name))
  WHERE is_active = true;

INSERT INTO students (name, grade, avatar)
SELECT 'Amir', 5, 'rocket'
WHERE NOT EXISTS (
  SELECT 1 FROM students WHERE LOWER(name) = 'amir' AND is_active = true
);

INSERT INTO students (name, grade, avatar)
SELECT 'Aden', 2, 'dragon'
WHERE NOT EXISTS (
  SELECT 1 FROM students WHERE LOWER(name) = 'aden' AND is_active = true
);
