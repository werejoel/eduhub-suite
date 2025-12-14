import { supabase } from './supabase';
import { Student, Teacher, Class, Fee, Attendance, Mark, Dormitory, StoreItem } from './types';

// STUDENT OPERATIONS
export const studentService = {
  async getAll() {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('last_name', { ascending: true });
    if (error) throw error;
    return data as Student[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Student;
  },

  async create(student: Omit<Student, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('students')
      .insert([student])
      .select()
      .single();
    if (error) throw error;
    return data as Student;
  },

  async update(id: string, updates: Partial<Student>) {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Student;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async searchByName(query: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`);
    if (error) throw error;
    return data as Student[];
  },
};

// TEACHER OPERATIONS
export const teacherService = {
  async getAll() {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('last_name', { ascending: true });
    if (error) throw error;
    return data as Teacher[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Teacher;
  },

  async create(teacher: Omit<Teacher, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('teachers')
      .insert([teacher])
      .select()
      .single();
    if (error) throw error;
    return data as Teacher;
  },

  async update(id: string, updates: Partial<Teacher>) {
    const { data, error } = await supabase
      .from('teachers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Teacher;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// CLASS OPERATIONS
export const classService = {
  async getAll() {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('form_number', { ascending: true });
    if (error) throw error;
    return data as Class[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Class;
  },

  async create(classData: Omit<Class, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('classes')
      .insert([classData])
      .select()
      .single();
    if (error) throw error;
    return data as Class;
  },

  async update(id: string, updates: Partial<Class>) {
    const { data, error } = await supabase
      .from('classes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Class;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// FEE OPERATIONS
export const feeService = {
  async getAll() {
    const { data, error } = await supabase
      .from('fees')
      .select('*')
      .order('due_date', { ascending: true });
    if (error) throw error;
    return data as Fee[];
  },

  async getByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('fees')
      .select('*')
      .eq('student_id', studentId)
      .order('due_date', { ascending: true });
    if (error) throw error;
    return data as Fee[];
  },

  async create(fee: Omit<Fee, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('fees')
      .insert([fee])
      .select()
      .single();
    if (error) throw error;
    return data as Fee;
  },

  async update(id: string, updates: Partial<Fee>) {
    const { data, error } = await supabase
      .from('fees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Fee;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('fees')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getByStatus(status: 'paid' | 'pending' | 'overdue') {
    const { data, error } = await supabase
      .from('fees')
      .select('*')
      .eq('payment_status', status);
    if (error) throw error;
    return data as Fee[];
  },
};

// ATTENDANCE OPERATIONS
export const attendanceService = {
  async getAll() {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .order('attendance_date', { ascending: false });
    if (error) throw error;
    return data as Attendance[];
  },

  async getByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .order('attendance_date', { ascending: false });
    if (error) throw error;
    return data as Attendance[];
  },

  async getByClass(classId: string) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('class_id', classId)
      .order('attendance_date', { ascending: false });
    if (error) throw error;
    return data as Attendance[];
  },

  async create(attendance: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('attendance')
      .insert([attendance])
      .select()
      .single();
    if (error) throw error;
    return data as Attendance;
  },

  async bulkCreate(records: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>[]) {
    const { data, error } = await supabase
      .from('attendance')
      .insert(records)
      .select();
    if (error) throw error;
    return data as Attendance[];
  },

  async update(id: string, updates: Partial<Attendance>) {
    const { data, error } = await supabase
      .from('attendance')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Attendance;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// MARK OPERATIONS
export const markService = {
  async getAll() {
    const { data, error } = await supabase
      .from('marks')
      .select('*');
    if (error) throw error;
    return data as Mark[];
  },

  async getByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('marks')
      .select('*')
      .eq('student_id', studentId);
    if (error) throw error;
    return data as Mark[];
  },

  async getByClass(classId: string) {
    const { data, error } = await supabase
      .from('marks')
      .select('*')
      .eq('class_id', classId);
    if (error) throw error;
    return data as Mark[];
  },

  async create(mark: Omit<Mark, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('marks')
      .insert([mark])
      .select()
      .single();
    if (error) throw error;
    return data as Mark;
  },

  async bulkCreate(records: Omit<Mark, 'id' | 'created_at' | 'updated_at'>[]) {
    const { data, error } = await supabase
      .from('marks')
      .insert(records)
      .select();
    if (error) throw error;
    return data as Mark[];
  },

  async update(id: string, updates: Partial<Mark>) {
    const { data, error } = await supabase
      .from('marks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Mark;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('marks')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// DORMITORY OPERATIONS
export const dormitoryService = {
  async getAll() {
    const { data, error } = await supabase
      .from('dormitories')
      .select('*');
    if (error) throw error;
    return data as Dormitory[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('dormitories')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Dormitory;
  },

  async create(dormitory: Omit<Dormitory, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('dormitories')
      .insert([dormitory])
      .select()
      .single();
    if (error) throw error;
    return data as Dormitory;
  },

  async update(id: string, updates: Partial<Dormitory>) {
    const { data, error } = await supabase
      .from('dormitories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Dormitory;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('dormitories')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// STORE ITEM OPERATIONS
export const storeService = {
  async getAll() {
    const { data, error } = await supabase
      .from('store_items')
      .select('*')
      .order('item_name', { ascending: true });
    if (error) throw error;
    return data as StoreItem[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('store_items')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as StoreItem;
  },

  async create(item: Omit<StoreItem, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('store_items')
      .insert([item])
      .select()
      .single();
    if (error) throw error;
    return data as StoreItem;
  },

  async update(id: string, updates: Partial<StoreItem>) {
    const { data, error } = await supabase
      .from('store_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as StoreItem;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('store_items')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getLowStock(threshold: number = 10) {
    const { data, error } = await supabase
      .from('store_items')
      .select('*')
      .lte('quantity_in_stock', threshold);
    if (error) throw error;
    return data as StoreItem[];
  },
};
