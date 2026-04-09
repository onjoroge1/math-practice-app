-- Seed initial skills data for Grade 1 and Grade 4
-- This matches the content we have in the app

-- Grade 1 Skills
INSERT INTO skills (id, name, description, category, grade, difficulty_level) VALUES
('add-subtract-10', 'Addition & Subtraction (within 10)', 'Basic addition and subtraction with numbers up to 10', 'operations', 1, 1),
('add-subtract-20', 'Addition & Subtraction (within 20)', 'Addition and subtraction with numbers up to 20', 'operations', 1, 2),
('number-sense', 'Number Sense & Place Value', 'Understanding numbers up to 120 and place value', 'number-sense', 1, 2),
('measurement', 'Measurement', 'Length, weight, and capacity comparisons', 'measurement', 1, 1),
('time', 'Time', 'Telling time to the hour and half hour', 'time', 1, 2),
('money', 'Money', 'Identifying and counting US coins', 'money', 1, 2),
('geometry', 'Geometry', '2D and 3D shapes recognition', 'geometry', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- Grade 4 Skills
INSERT INTO skills (id, name, description, category, grade, difficulty_level) VALUES
('multi-digit-ops', 'Multi-digit Operations', 'Advanced multiplication and division strategies', 'operations', 4, 3),
('multiplication', 'Multiplication Mastery', 'Times tables and multiplication strategies', 'operations', 4, 3),
('division', 'Division Mastery', 'Division facts and strategies', 'operations', 4, 3),
('fractions-decimals', 'Fractions & Decimals', 'Working with fractions and decimal numbers', 'number-sense', 4, 4),
('place-value-millions', 'Place Value to Millions', 'Understanding large numbers up to millions', 'number-sense', 4, 3),
('measurement-conversion', 'Measurement & Conversion', 'Converting between units of measurement', 'measurement', 4, 3),
('geometry-angles', 'Geometry & Angles', 'Understanding angles, area, and perimeter', 'geometry', 4, 4)
ON CONFLICT (id) DO NOTHING;
