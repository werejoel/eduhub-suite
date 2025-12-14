-- EduHub Suite - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to create all necessary tables

-- ============================================================================
-- STUDENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_number VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
  class_id UUID,
  enrollment_date DATE NOT NULL,
  status VARCHAR(50) CHECK (status IN ('active', 'inactive', 'graduated')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_status ON students(status);

-- ============================================================================
-- TEACHERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  subject VARCHAR(255),
  qualification VARCHAR(255),
  employment_date DATE NOT NULL,
  status VARCHAR(50) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teachers_status ON teachers(status);
CREATE INDEX idx_teachers_subject ON teachers(subject);

-- ============================================================================
-- CLASSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name VARCHAR(255) NOT NULL,
  class_code VARCHAR(100) UNIQUE NOT NULL,
  form_number INTEGER,
  teacher_id UUID REFERENCES teachers(id),
  capacity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);

-- ============================================================================
-- FEES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  term VARCHAR(100),
  academic_year VARCHAR(50),
  payment_status VARCHAR(50) CHECK (payment_status IN ('paid', 'pending', 'overdue')) DEFAULT 'pending',
  due_date DATE,
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fees_student_id ON fees(student_id);
CREATE INDEX idx_fees_payment_status ON fees(payment_status);
CREATE INDEX idx_fees_due_date ON fees(due_date);

-- ============================================================================
-- ATTENDANCE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status VARCHAR(50) CHECK (status IN ('present', 'absent', 'late')) DEFAULT 'present',
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_class_id ON attendance(class_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);

-- ============================================================================
-- MARKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject VARCHAR(255),
  exam_type VARCHAR(100),
  marks_obtained DECIMAL(5, 2),
  total_marks DECIMAL(5, 2),
  term VARCHAR(100),
  academic_year VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_marks_student_id ON marks(student_id);
CREATE INDEX idx_marks_class_id ON marks(class_id);
CREATE INDEX idx_marks_academic_year ON marks(academic_year);

-- ============================================================================
-- DORMITORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS dormitories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dormitory_name VARCHAR(255) NOT NULL,
  dormitory_type VARCHAR(50) CHECK (dormitory_type IN ('boys', 'girls')) DEFAULT 'boys',
  capacity INTEGER NOT NULL,
  current_occupancy INTEGER DEFAULT 0,
  location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dormitories_type ON dormitories(dormitory_type);

-- ============================================================================
-- STORE_ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name VARCHAR(255) NOT NULL,
  item_code VARCHAR(100) UNIQUE NOT NULL,
  quantity_in_stock INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 10,
  unit_price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  supplier VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_store_items_category ON store_items(category);
CREATE INDEX idx_store_items_quantity ON store_items(quantity_in_stock);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (OPTIONAL - for production use)
-- ============================================================================
-- Uncomment these if you want to enable RLS for security

-- ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE dormitories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================
-- Uncomment to add sample data for testing

-- INSERT INTO students (admission_number, first_name, last_name, email, phone, date_of_birth, gender, enrollment_date, status)
-- VALUES 
--   ('ADM001', 'John', 'Doe', 'john@example.com', '123456789', '2008-05-15', 'male', '2023-01-20', 'active'),
--   ('ADM002', 'Jane', 'Smith', 'jane@example.com', '987654321', '2008-07-22', 'female', '2023-01-20', 'active');

-- INSERT INTO teachers (employee_id, first_name, last_name, email, phone, subject, qualification, employment_date, status)
-- VALUES 
--   ('EMP001', 'Mrs.', 'Johnson', 'johnson@example.com', '555-0001', 'Mathematics', 'BSc Mathematics', '2020-01-15', 'active'),
--   ('EMP002', 'Mr.', 'Williams', 'williams@example.com', '555-0002', 'English', 'BA English', '2021-01-15', 'active');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
