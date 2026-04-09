-- Create useful views for analytics and reporting

-- View: Student progress summary
CREATE OR REPLACE VIEW student_progress_summary AS
SELECT 
  s.id as student_id,
  s.name,
  s.grade,
  s.parent_id,
  s.total_coins,
  s.current_streak,
  s.longest_streak,
  s.total_practice_sessions,
  s.total_questions_answered,
  s.total_correct_answers,
  CASE 
    WHEN s.total_questions_answered > 0 
    THEN ROUND((s.total_correct_answers::DECIMAL / s.total_questions_answered * 100), 2)
    ELSE 0 
  END as overall_accuracy,
  COUNT(DISTINCT mt.skill_id) as skills_practiced,
  COUNT(DISTINCT CASE WHEN mt.mastery_level >= 4 THEN mt.skill_id END) as skills_mastered,
  s.last_practice_date,
  s.created_at
FROM students s
LEFT JOIN mastery_tracking mt ON s.id = mt.student_id
GROUP BY s.id;

-- View: Recent practice activity
CREATE OR REPLACE VIEW recent_practice_activity AS
SELECT 
  ps.id as session_id,
  ps.student_id,
  st.name as student_name,
  st.grade,
  ps.session_type,
  ps.total_questions,
  ps.correct_answers,
  ps.accuracy_percentage,
  ps.coins_earned,
  ps.started_at,
  ps.completed_at,
  ps.duration_seconds
FROM practice_sessions ps
JOIN students st ON ps.student_id = st.id
WHERE ps.is_completed = true
ORDER BY ps.completed_at DESC;

-- View: Skill mastery overview
CREATE OR REPLACE VIEW skill_mastery_overview AS
SELECT 
  sk.id as skill_id,
  sk.name as skill_name,
  sk.category,
  sk.grade,
  COUNT(mt.student_id) as students_practicing,
  AVG(mt.mastery_level) as avg_mastery_level,
  COUNT(CASE WHEN mt.mastery_level >= 4 THEN 1 END) as students_mastered
FROM skills sk
LEFT JOIN mastery_tracking mt ON sk.id = mt.skill_id
GROUP BY sk.id, sk.name, sk.category, sk.grade;
