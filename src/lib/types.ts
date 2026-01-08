// Database types
export interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: "male" | "female";
  class_id: string;
  enrollment_date: string;
  status: "active" | "inactive" | "graduated";
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "teacher" | "headteacher";
  email_confirmed: boolean;
  phone?: string;
  subject?: string;
  qualification?: string;
  employment_date?: string;
  employee_id?: string;
  status?: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: string;
  class_name: string;
  class_code: string;
  form_number: number;
  teacher_id: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Fee {
  id: string;
  student_id: string;
  amount: number;
  term: string;
  academic_year: string;
  payment_status: "paid" | "pending" | "overdue";
  due_date: string;
  paid_date?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  attendance_date: string;
  status: "present" | "absent" | "late";
  remarks?: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Dormitory {
  id: string;
  dormitory_name: string;
  dormitory_type: "boys" | "girls";
  capacity: number;
  current_occupancy: number;
  location: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface TeacherDuty {
  id: string;
  teacher_id: string;
  duty_name: string;
  description: string;
  assigned_date: string;
  start_date: string;
  end_date: string;
  status: "assigned" | "in_progress" | "completed" | "cancelled";
  assigned_by: string;
  createdAt: string;
  updatedAt: string;
}

export interface DutyRating {
  id: string;
  duty_id: string;
  teacher_id: string;
  week_number: number;
  academic_year: string;
  term: string;
  rating: number; // 1-5
  comments: string;
  rated_by: string;
  rating_date: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRequest {
  id: string;
  teacher_id: string;
  amount: number;
  reason: string;
  request_date: string;
  status: "pending" | "approved" | "rejected" | "processed";
  approved_by?: string;
  approval_date?: string;
  rejection_reason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole =
  | "admin"
  | "teacher"
  | "headteacher"
  | "burser"
  | "store"
  | "dormitory";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  email_confirmed: boolean;
  createdAt: string;
  updatedAt: string;
}
