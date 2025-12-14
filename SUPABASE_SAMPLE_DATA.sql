-- EduHub Suite - Sample Data
-- Run this SQL in your Supabase SQL Editor to populate tables with sample data

-- ============================================================================
-- SAMPLE TEACHERS
-- ============================================================================
INSERT INTO teachers (employee_id, first_name, last_name, email, phone, subject, qualification, employment_date, status)
VALUES 
  ('EMP001', 'Mrs.', 'Johnson', 'johnson@school.edu', '555-0101', 'Mathematics', 'BSc Mathematics', '2020-01-15', 'active'),
  ('EMP002', 'Mr.', 'Williams', 'williams@school.edu', '555-0102', 'English', 'BA English Literature', '2021-01-20', 'active'),
  ('EMP003', 'Ms.', 'Garcia', 'garcia@school.edu', '555-0103', 'Science', 'BSc Chemistry', '2019-08-10', 'active'),
  ('EMP004', 'Mr.', 'Brown', 'brown@school.edu', '555-0104', 'History', 'BA History', '2022-02-15', 'active'),
  ('EMP005', 'Miss', 'Davis', 'davis@school.edu', '555-0105', 'Physical Education', 'Diploma in Sports Science', '2020-06-01', 'active'),
  ('EMP006', 'Mr.', 'Wilson', 'wilson@school.edu', '555-0106', 'Computer Science', 'BSc Information Technology', '2021-09-01', 'active');

-- ============================================================================
-- SAMPLE CLASSES
-- ============================================================================
INSERT INTO classes (class_name, class_code, form_number, teacher_id, capacity)
VALUES 
  ('Grade 8A', 'GR8A', 8, (SELECT id FROM teachers WHERE employee_id = 'EMP001'), 35),
  ('Grade 8B', 'GR8B', 8, (SELECT id FROM teachers WHERE employee_id = 'EMP002'), 32),
  ('Grade 9A', 'GR9A', 9, (SELECT id FROM teachers WHERE employee_id = 'EMP003'), 38),
  ('Grade 9B', 'GR9B', 9, (SELECT id FROM teachers WHERE employee_id = 'EMP004'), 36),
  ('Grade 10A', 'GR10A', 10, (SELECT id FROM teachers WHERE employee_id = 'EMP001'), 30),
  ('Grade 10B', 'GR10B', 10, (SELECT id FROM teachers WHERE employee_id = 'EMP005'), 34),
  ('Grade 11A', 'GR11A', 11, (SELECT id FROM teachers WHERE employee_id = 'EMP006'), 28),
  ('Grade 12A', 'GR12A', 12, (SELECT id FROM teachers WHERE employee_id = 'EMP002'), 25);

-- ============================================================================
-- SAMPLE STUDENTS
-- ============================================================================
INSERT INTO students (admission_number, first_name, last_name, email, phone, date_of_birth, gender, class_id, enrollment_date, status)
VALUES 
  ('ADM001', 'John', 'Smith', 'john.smith@student.edu', '555-1001', '2008-05-15', 'male', (SELECT id FROM classes WHERE class_code = 'GR8A'), '2023-01-20', 'active'),
  ('ADM002', 'Emma', 'Johnson', 'emma.johnson@student.edu', '555-1002', '2008-07-22', 'female', (SELECT id FROM classes WHERE class_code = 'GR8A'), '2023-01-20', 'active'),
  ('ADM003', 'Michael', 'Williams', 'michael.w@student.edu', '555-1003', '2008-03-10', 'male', (SELECT id FROM classes WHERE class_code = 'GR8B'), '2023-01-20', 'active'),
  ('ADM004', 'Sarah', 'Brown', 'sarah.brown@student.edu', '555-1004', '2008-11-30', 'female', (SELECT id FROM classes WHERE class_code = 'GR8B'), '2023-01-20', 'active'),
  ('ADM005', 'James', 'Davis', 'james.davis@student.edu', '555-1005', '2007-09-18', 'male', (SELECT id FROM classes WHERE class_code = 'GR9A'), '2023-01-20', 'active'),
  ('ADM006', 'Lisa', 'Miller', 'lisa.miller@student.edu', '555-1006', '2007-12-05', 'female', (SELECT id FROM classes WHERE class_code = 'GR9A'), '2023-01-20', 'active'),
  ('ADM007', 'David', 'Wilson', 'david.wilson@student.edu', '555-1007', '2007-06-14', 'male', (SELECT id FROM classes WHERE class_code = 'GR9B'), '2023-01-20', 'active'),
  ('ADM008', 'Jessica', 'Moore', 'jessica.moore@student.edu', '555-1008', '2007-08-25', 'female', (SELECT id FROM classes WHERE class_code = 'GR9B'), '2023-01-20', 'active'),
  ('ADM009', 'Robert', 'Taylor', 'robert.t@student.edu', '555-1009', '2006-04-20', 'male', (SELECT id FROM classes WHERE class_code = 'GR10A'), '2023-01-20', 'active'),
  ('ADM010', 'Amanda', 'Anderson', 'amanda.a@student.edu', '555-1010', '2006-10-12', 'female', (SELECT id FROM classes WHERE class_code = 'GR10A'), '2023-01-20', 'active'),
  ('ADM011', 'Christopher', 'Thomas', 'chris.t@student.edu', '555-1011', '2006-07-08', 'male', (SELECT id FROM classes WHERE class_code = 'GR10B'), '2023-01-20', 'active'),
  ('ADM012', 'Victoria', 'Jackson', 'victoria.j@student.edu', '555-1012', '2006-02-28', 'female', (SELECT id FROM classes WHERE class_code = 'GR10B'), '2023-01-20', 'active'),
  ('ADM013', 'Daniel', 'White', 'daniel.white@student.edu', '555-1013', '2005-11-19', 'male', (SELECT id FROM classes WHERE class_code = 'GR11A'), '2023-01-20', 'active'),
  ('ADM014', 'Olivia', 'Harris', 'olivia.h@student.edu', '555-1014', '2005-05-31', 'female', (SELECT id FROM classes WHERE class_code = 'GR11A'), '2023-01-20', 'active'),
  ('ADM015', 'Matthew', 'Martin', 'matthew.m@student.edu', '555-1015', '2004-09-22', 'male', (SELECT id FROM classes WHERE class_code = 'GR12A'), '2023-01-20', 'active'),
  ('ADM016', 'Sophie', 'Thompson', 'sophie.t@student.edu', '555-1016', '2004-03-15', 'female', (SELECT id FROM classes WHERE class_code = 'GR12A'), '2023-01-20', 'active');

-- ============================================================================
-- SAMPLE FEES
-- ============================================================================
INSERT INTO fees (student_id, amount, term, academic_year, payment_status, due_date, paid_date)
VALUES 
  ((SELECT id FROM students WHERE admission_number = 'ADM001'), 5000.00, 'Term 1', '2024', 'paid', '2024-02-01', '2024-01-28'),
  ((SELECT id FROM students WHERE admission_number = 'ADM001'), 5000.00, 'Term 2', '2024', 'pending', '2024-05-01', NULL),
  ((SELECT id FROM students WHERE admission_number = 'ADM002'), 5000.00, 'Term 1', '2024', 'paid', '2024-02-01', '2024-02-05'),
  ((SELECT id FROM students WHERE admission_number = 'ADM002'), 5000.00, 'Term 2', '2024', 'overdue', '2024-05-01', NULL),
  ((SELECT id FROM students WHERE admission_number = 'ADM003'), 5000.00, 'Term 1', '2024', 'paid', '2024-02-01', '2024-01-30'),
  ((SELECT id FROM students WHERE admission_number = 'ADM004'), 5000.00, 'Term 1', '2024', 'pending', '2024-02-01', NULL),
  ((SELECT id FROM students WHERE admission_number = 'ADM005'), 6000.00, 'Term 1', '2024', 'paid', '2024-02-01', '2024-01-25'),
  ((SELECT id FROM students WHERE admission_number = 'ADM006'), 6000.00, 'Term 1', '2024', 'paid', '2024-02-01', '2024-02-08'),
  ((SELECT id FROM students WHERE admission_number = 'ADM007'), 6000.00, 'Term 1', '2024', 'overdue', '2024-02-01', NULL),
  ((SELECT id FROM students WHERE admission_number = 'ADM008'), 6000.00, 'Term 1', '2024', 'pending', '2024-02-01', NULL),
  ((SELECT id FROM students WHERE admission_number = 'ADM009'), 7000.00, 'Term 1', '2024', 'paid', '2024-02-01', '2024-01-27'),
  ((SELECT id FROM students WHERE admission_number = 'ADM010'), 7000.00, 'Term 1', '2024', 'paid', '2024-02-01', '2024-02-02'),
  ((SELECT id FROM students WHERE admission_number = 'ADM011'), 7000.00, 'Term 1', '2024', 'pending', '2024-02-01', NULL),
  ((SELECT id FROM students WHERE admission_number = 'ADM012'), 7000.00, 'Term 1', '2024', 'paid', '2024-02-01', '2024-01-29');

-- ============================================================================
-- SAMPLE ATTENDANCE
-- ============================================================================
INSERT INTO attendance (student_id, class_id, attendance_date, status, remarks)
VALUES 
  ((SELECT id FROM students WHERE admission_number = 'ADM001'), (SELECT id FROM classes WHERE class_code = 'GR8A'), '2024-12-10', 'present', NULL),
  ((SELECT id FROM students WHERE admission_number = 'ADM001'), (SELECT id FROM classes WHERE class_code = 'GR8A'), '2024-12-09', 'present', NULL),
  ((SELECT id FROM students WHERE admission_number = 'ADM002'), (SELECT id FROM classes WHERE class_code = 'GR8A'), '2024-12-10', 'present', NULL),
  ((SELECT id FROM students WHERE admission_number = 'ADM002'), (SELECT id FROM classes WHERE class_code = 'GR8A'), '2024-12-09', 'late', 'Arrived 10 minutes late'),
  ((SELECT id FROM students WHERE admission_number = 'ADM003'), (SELECT id FROM classes WHERE class_code = 'GR8B'), '2024-12-10', 'absent', NULL),
  ((SELECT id FROM students WHERE admission_number = 'ADM003'), (SELECT id FROM classes WHERE class_code = 'GR8B'), '2024-12-09', 'present', NULL),
  ((SELECT id FROM students WHERE admission_number = 'ADM004'), (SELECT id FROM classes WHERE class_code = 'GR8B'), '2024-12-10', 'present', NULL),
  ((SELECT id FROM students WHERE admission_number = 'ADM004'), (SELECT id FROM classes WHERE class_code = 'GR8B'), '2024-12-09', 'present', NULL),
  ((SELECT id FROM students WHERE admission_number = 'ADM005'), (SELECT id FROM classes WHERE class_code = 'GR9A'), '2024-12-10', 'present', NULL),
  ((SELECT id FROM students WHERE admission_number = 'ADM005'), (SELECT id FROM classes WHERE class_code = 'GR9A'), '2024-12-09', 'present', NULL),
  ((SELECT id FROM students WHERE admission_number = 'ADM006'), (SELECT id FROM classes WHERE class_code = 'GR9A'), '2024-12-10', 'late', 'Medical appointment'),
  ((SELECT id FROM students WHERE admission_number = 'ADM006'), (SELECT id FROM classes WHERE class_code = 'GR9A'), '2024-12-09', 'present', NULL);

-- ============================================================================
-- SAMPLE MARKS
-- ============================================================================
INSERT INTO marks (student_id, class_id, subject, exam_type, marks_obtained, total_marks, term, academic_year)
VALUES 
  ((SELECT id FROM students WHERE admission_number = 'ADM001'), (SELECT id FROM classes WHERE class_code = 'GR8A'), 'Mathematics', 'Mid-Term', 75, 100, 'Term 1', '2024'),
  ((SELECT id FROM students WHERE admission_number = 'ADM001'), (SELECT id FROM classes WHERE class_code = 'GR8A'), 'English', 'Mid-Term', 82, 100, 'Term 1', '2024'),
  ((SELECT id FROM students WHERE admission_number = 'ADM001'), (SELECT id FROM classes WHERE class_code = 'GR8A'), 'Science', 'Mid-Term', 78, 100, 'Term 1', '2024'),
  ((SELECT id FROM students WHERE admission_number = 'ADM002'), (SELECT id FROM classes WHERE class_code = 'GR8A'), 'Mathematics', 'Mid-Term', 88, 100, 'Term 1', '2024'),
  ((SELECT id FROM students WHERE admission_number = 'ADM002'), (SELECT id FROM classes WHERE class_code = 'GR8A'), 'English', 'Mid-Term', 90, 100, 'Term 1', '2024'),
  ((SELECT id FROM students WHERE admission_number = 'ADM002'), (SELECT id FROM classes WHERE class_code = 'GR8A'), 'Science', 'Mid-Term', 85, 100, 'Term 1', '2024'),
  ((SELECT id FROM students WHERE admission_number = 'ADM003'), (SELECT id FROM classes WHERE class_code = 'GR8B'), 'Mathematics', 'Mid-Term', 65, 100, 'Term 1', '2024'),
  ((SELECT id FROM students WHERE admission_number = 'ADM003'), (SELECT id FROM classes WHERE class_code = 'GR8B'), 'English', 'Mid-Term', 70, 100, 'Term 1', '2024'),
  ((SELECT id FROM students WHERE admission_number = 'ADM003'), (SELECT id FROM classes WHERE class_code = 'GR8B'), 'Science', 'Mid-Term', 68, 100, 'Term 1', '2024'),
  ((SELECT id FROM students WHERE admission_number = 'ADM004'), (SELECT id FROM classes WHERE class_code = 'GR8B'), 'Mathematics', 'Mid-Term', 92, 100, 'Term 1', '2024'),
  ((SELECT id FROM students WHERE admission_number = 'ADM004'), (SELECT id FROM classes WHERE class_code = 'GR8B'), 'English', 'Mid-Term', 87, 100, 'Term 1', '2024'),
  ((SELECT id FROM students WHERE admission_number = 'ADM004'), (SELECT id FROM classes WHERE class_code = 'GR8B'), 'Science', 'Mid-Term', 91, 100, 'Term 1', '2024'),
  ((SELECT id FROM students WHERE admission_number = 'ADM005'), (SELECT id FROM classes WHERE class_code = 'GR9A'), 'Mathematics', 'Mid-Term', 80, 100, 'Term 1', '2024'),
  ((SELECT id FROM students WHERE admission_number = 'ADM006'), (SELECT id FROM classes WHERE class_code = 'GR9A'), 'Mathematics', 'Mid-Term', 85, 100, 'Term 1', '2024');

-- ============================================================================
-- SAMPLE DORMITORIES
-- ============================================================================
INSERT INTO dormitories (dormitory_name, dormitory_type, capacity, current_occupancy, location)
VALUES 
  ('Boys Hostel A', 'boys', 50, 42, 'North Campus'),
  ('Boys Hostel B', 'boys', 45, 38, 'East Campus'),
  ('Girls Hostel A', 'girls', 60, 56, 'West Campus'),
  ('Girls Hostel B', 'girls', 55, 48, 'South Campus');

-- ============================================================================
-- SAMPLE STORE ITEMS
-- ============================================================================
INSERT INTO store_items (item_name, item_code, quantity_in_stock, reorder_level, unit_price, category, supplier)
VALUES 
  ('Exercise Books (Pack of 10)', 'STN001', 150, 30, 8.50, 'Stationery', 'ABC Supplies Ltd'),
  ('Ballpoint Pens (Box of 50)', 'STN002', 250, 50, 12.00, 'Stationery', 'ABC Supplies Ltd'),
  ('Pencils (Pack of 12)', 'STN003', 180, 40, 5.50, 'Stationery', 'ABC Supplies Ltd'),
  ('Rulers (Pack of 10)', 'STN004', 120, 25, 6.00, 'Stationery', 'ABC Supplies Ltd'),
  ('Mathematics Textbook Gr.10', 'BK001', 35, 10, 45.00, 'Books', 'EduBooks Publishers'),
  ('English Literature Guide', 'BK002', 28, 8, 38.50, 'Books', 'EduBooks Publishers'),
  ('Science Lab Coat', 'UNI001', 60, 15, 35.00, 'Uniforms', 'Uniform House Ltd'),
  ('School Tie', 'UNI002', 100, 20, 8.00, 'Uniforms', 'Uniform House Ltd'),
  ('School Badge', 'ACC001', 300, 50, 2.50, 'Accessories', 'Badge Makers Co'),
  ('School Bag', 'ACC002', 45, 10, 50.00, 'Accessories', 'BagMart Ltd'),
  ('Geometry Set', 'STN005', 80, 15, 12.50, 'Stationery', 'ABC Supplies Ltd'),
  ('Scientific Calculator', 'ACC003', 25, 5, 25.00, 'Accessories', 'Tech Supplies Ltd');

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify data insertion)
-- ============================================================================
-- SELECT COUNT(*) as student_count FROM students;
-- SELECT COUNT(*) as teacher_count FROM teachers;
-- SELECT COUNT(*) as class_count FROM classes;
-- SELECT COUNT(*) as fee_count FROM fees;
-- SELECT COUNT(*) as attendance_count FROM attendance;
-- SELECT COUNT(*) as marks_count FROM marks;
-- SELECT COUNT(*) as dormitory_count FROM dormitories;
-- SELECT COUNT(*) as store_item_count FROM store_items;

-- ============================================================================
-- END OF SAMPLE DATA
-- ============================================================================
