import { Student, Teacher, Class, Fee, Attendance, Mark, Dormitory, StoreItem } from './types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000';

const normalizeBase = (base: string) => base.replace(/\/$/, '');
const apiUrl = (path: string) => `${normalizeBase(API_BASE)}${path}`;

async function handleResponse(res: Response) {
  if (res.status === 204) return null;
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error || res.statusText);
  // Normalize MongoDB `_id` to `id` for frontend consistency
  const normalize = (obj: any) => {
    if (obj && obj._id && !obj.id) {
      try {
        obj.id = String(obj._id);
      } catch (e) {
        obj.id = obj._id;
      }
    }
    return obj;
  };

  if (Array.isArray(json)) return json.map(normalize);
  return normalize(json);
}

async function getAll<T>(collection: string, params?: Record<string, any>): Promise<T[]> {
  const url = new URL(apiUrl(`/api/${collection}`), typeof window !== 'undefined' ? window.location.origin : '');
  if (params) Object.keys(params).forEach(k => url.searchParams.set(k, String(params[k])));
  const res = await fetch(url.toString());
  return handleResponse(res) as Promise<T[]>;
}

async function getById<T>(collection: string, id: string): Promise<T> {
  const res = await fetch(apiUrl(`/api/${collection}/${id}`));
  return handleResponse(res) as Promise<T>;
}

async function createItem<T>(collection: string, body: any): Promise<T> {
  const res = await fetch(apiUrl(`/api/${collection}`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return handleResponse(res) as Promise<T>;
}

async function updateItem<T>(collection: string, id: string, body: any): Promise<T> {
  const res = await fetch(apiUrl(`/api/${collection}/${id}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return handleResponse(res) as Promise<T>;
}

async function deleteItem(collection: string, id: string): Promise<void> {
  await fetch(apiUrl(`/api/${collection}/${id}`), { method: 'DELETE' });
}

// STUDENT OPERATIONS
export const studentService = {
  async getAll() {
    return getAll<Student>('students', { _sort: 'last_name' });
  },
  async getById(id: string) { return getById<Student>('students', id); },
  async create(student: Omit<Student, 'id' | 'created_at' | 'updated_at'>) { return createItem<Student>('students', student); },
  async update(id: string, updates: Partial<Student>) { return updateItem<Student>('students', id, updates); },
  async delete(id: string) { return deleteItem('students', id); },
  async searchByName(name: string) {
    const res = await fetch(apiUrl(`/api/students/search?name=${encodeURIComponent(name)}`));
    return handleResponse(res) as Promise<Student[]>;
  },
};


// TEACHER OPERATIONS
export const teacherService = {
  async getAll() { return getAll<Teacher>('teachers', { _sort: 'last_name' }); },
  async getById(id: string) { return getById<Teacher>('teachers', id); },
  async create(teacher: Omit<Teacher, 'id' | 'created_at' | 'updated_at'>) { return createItem<Teacher>('teachers', teacher); },
  async update(id: string, updates: Partial<Teacher>) { return updateItem<Teacher>('teachers', id, updates); },
  async delete(id: string) { return deleteItem('teachers', id); },
};

// CLASS OPERATIONS
export const classService = {
  async getAll() { return getAll<Class>('classes', { _sort: 'form_number' }); },
  async getById(id: string) { return getById<Class>('classes', id); },
  async create(classData: Omit<Class, 'id' | 'created_at' | 'updated_at'>) { return createItem<Class>('classes', classData); },
  async update(id: string, updates: Partial<Class>) { return updateItem<Class>('classes', id, updates); },
  async delete(id: string) { return deleteItem('classes', id); },
};

// FEE OPERATIONS
export const feeService = {
  async getAll() { return getAll<Fee>('fees', { _sort: 'due_date' }); },
  async getByStudent(studentId: string) { const res = await fetch(apiUrl(`/api/fees/student/${studentId}`)); return handleResponse(res) as Promise<Fee[]>; },
  async create(fee: Omit<Fee, 'id' | 'created_at' | 'updated_at'>) { return createItem<Fee>('fees', fee); },
  async update(id: string, updates: Partial<Fee>) { return updateItem<Fee>('fees', id, updates); },
  async delete(id: string) { return deleteItem('fees', id); },
  async getByStatus(status: 'paid' | 'pending' | 'overdue') { const res = await fetch(apiUrl(`/api/fees/status/${status}`)); return handleResponse(res) as Promise<Fee[]>; },
  async getById(id: string) { return getById<Fee>('fees', id); },
};

// ATTENDANCE OPERATIONS
export const attendanceService = {
  async getAll() { return getAll<Attendance>('attendance', { _sort: '-attendance_date' }); },
  async getByStudent(studentId: string) { const res = await fetch(apiUrl(`/api/attendance/student/${studentId}`)); return handleResponse(res) as Promise<Attendance[]>; },
  async getByClass(classId: string) { const res = await fetch(apiUrl(`/api/attendance/class/${classId}`)); return handleResponse(res) as Promise<Attendance[]>; },
  async create(attendance: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>) { return createItem<Attendance>('attendance', attendance); },
  async bulkCreate(records: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>[]) { const res = await fetch(apiUrl('/api/attendance/bulk'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(records) }); return handleResponse(res) as Promise<Attendance[]>; },
  async update(id: string, updates: Partial<Attendance>) { return updateItem<Attendance>('attendance', id, updates); },
  async delete(id: string) { return deleteItem('attendance', id); },
  async getById(id: string) { return getById<Attendance>('attendance', id); },
};

// MARK OPERATIONS
export const markService = {
  async getAll() { return getAll<Mark>('marks'); },
  async getByStudent(studentId: string) { const res = await fetch(apiUrl(`/api/marks/student/${studentId}`)); return handleResponse(res) as Promise<Mark[]>; },
  async getByClass(classId: string) { const res = await fetch(apiUrl(`/api/marks/class/${classId}`)); return handleResponse(res) as Promise<Mark[]>; },
  async create(mark: Omit<Mark, 'id' | 'created_at' | 'updated_at'>) { return createItem<Mark>('marks', mark); },
  async bulkCreate(records: Omit<Mark, 'id' | 'created_at' | 'updated_at'>[]) { const res = await fetch(apiUrl('/api/marks/bulk'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(records) }); return handleResponse(res) as Promise<Mark[]>; },
  async update(id: string, updates: Partial<Mark>) { return updateItem<Mark>('marks', id, updates); },
  async delete(id: string) { return deleteItem('marks', id); },
  async getById(id: string) { return getById<Mark>('marks', id); },
};

// DORMITORY OPERATIONS
export const dormitoryService = {
  async getAll() { return getAll<Dormitory>('dormitories'); },
  async getById(id: string) { return getById<Dormitory>('dormitories', id); },
  async create(dormitory: Omit<Dormitory, 'id' | 'created_at' | 'updated_at'>) { return createItem<Dormitory>('dormitories', dormitory); },
  async update(id: string, updates: Partial<Dormitory>) { return updateItem<Dormitory>('dormitories', id, updates); },
  async delete(id: string) { return deleteItem('dormitories', id); },
};

// STORE ITEM OPERATIONS
export const storeService = {
  async getAll() { return getAll<StoreItem>('store_items', { _sort: 'item_name' }); },
  async getById(id: string) { return getById<StoreItem>('store_items', id); },
  async create(item: Omit<StoreItem, 'id' | 'created_at' | 'updated_at'>) { return createItem<StoreItem>('store_items', item); },
  async update(id: string, updates: Partial<StoreItem>) { return updateItem<StoreItem>('store_items', id, updates); },
  async delete(id: string) { return deleteItem('store_items', id); },
  async getLowStock(threshold: number = 10) { const res = await fetch(apiUrl(`/api/store_items/low-stock/${threshold}`)); return handleResponse(res) as Promise<StoreItem[]>; },
};

// AUTH
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('eduhub_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const authService = {
  async register(payload: { email: string; password: string; role?: string; first_name?: string; last_name?: string }) {
    const res = await fetch(apiUrl('/api/auth/register'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return handleResponse(res);
  },
  async login(email: string, password: string) {
    const res = await fetch(apiUrl('/api/auth/login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    return handleResponse(res);
  },
  async me() {
    const res = await fetch(apiUrl('/api/auth/me'), { headers: { ...getAuthHeaders() } });
    return handleResponse(res);
  }
};
