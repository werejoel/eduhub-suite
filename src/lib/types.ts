// Database types
export interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: 'male' | 'female';
  class_id: string;
  enrollment_date: string;
  status: 'active' | 'inactive' | 'graduated';
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  subject: string;
  qualification: string;
  employment_date: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  class_name: string;
  class_code: string;
  form_number: number;
  teacher_id: string;
  capacity: number;
  created_at: string;
  updated_at: string;
}

export interface Fee {
  id: string;
  student_id: string;
  amount: number;
  term: string;
  academic_year: string;
  payment_status: 'paid' | 'pending' | 'overdue';
  due_date: string;
  paid_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  attendance_date: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface Mark {
  id: string;
  student_id: string;
  class_id: string;
  subject: string;
  exam_type: string;
  marks_obtained: number;
  total_marks: number;
  term: string;
  academic_year: string;
  created_at: string;
  updated_at: string;
}

export interface Dormitory {
  id: string;
  dormitory_name: string;
  dormitory_type: 'boys' | 'girls';
  capacity: number;
  current_occupancy: number;
  location: string;
  created_at: string;
  updated_at: string;
}

export interface StoreItem {
  id: string;
  item_name: string;
  item_code: string;
  quantity_in_stock: number;
  reorder_level: number;
  unit_price: number;
  category: string;
  supplier: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'admin' | 'teacher' | 'headteacher' | 'burser' | 'store' | 'dormitory';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  email_confirmed: boolean;
  created_at: string;
  updated_at: string;
}