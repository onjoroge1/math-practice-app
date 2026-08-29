-- Correct the fixed child identities without replacing their rows or progress.
ALTER TABLE students ALTER COLUMN parent_id DROP NOT NULL;

UPDATE students
SET grade = 2, avatar = 'rocket', updated_at = CURRENT_TIMESTAMP
WHERE LOWER(name) = 'amir' AND is_active = true;

UPDATE students
SET grade = 5, avatar = 'dragon', updated_at = CURRENT_TIMESTAMP
WHERE LOWER(name) = 'aden' AND is_active = true;

INSERT INTO students (name, grade, avatar)
SELECT 'Amir', 2, 'rocket'
WHERE NOT EXISTS (
  SELECT 1 FROM students WHERE LOWER(name) = 'amir' AND is_active = true
);

INSERT INTO students (name, grade, avatar)
SELECT 'Aden', 5, 'dragon'
WHERE NOT EXISTS (
  SELECT 1 FROM students WHERE LOWER(name) = 'aden' AND is_active = true
);
