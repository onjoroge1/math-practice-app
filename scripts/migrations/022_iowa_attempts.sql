-- Completed Iowa attempts are independent of the browser cache.
-- An immutable ID makes retries safe without counting the same test twice.
CREATE TABLE IF NOT EXISTS iowa_attempts (
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  id UUID NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, id)
);
