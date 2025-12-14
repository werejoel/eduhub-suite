# Supabase Integration Guide for EduhubSuite

## Setup Instructions

### 1. Create Supabase Project
1. Go to [Supabase](https://supabase.com)
2. Sign up/Login and create a new project
3. Copy your project URL and Anon Key

### 2. Environment Variables
Create a `.env.local` file in the project root:
```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database Schema

Run the following SQL in your Supabase SQL Editor:

```sql
-- Students Table
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admission_number VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
  class_id UUID REFERENCES classes(id),
  enrollment_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Teachers Table
CREATE TABLE teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  subject VARCHAR(100) NOT NULL,
  qualification VARCHAR(255),
  employment_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Classes Table
CREATE TABLE classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_name VARCHAR(100) NOT NULL,
  class_code VARCHAR(50) UNIQUE NOT NULL,
  form_number INTEGER,
  teacher_id UUID REFERENCES teachers(id),
  capacity INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Fees Table
CREATE TABLE fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  term VARCHAR(50),
  academic_year VARCHAR(10),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'overdue')),
  due_date DATE NOT NULL,
  paid_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Attendance Table
CREATE TABLE attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id),
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, class_id, attendance_date)
);

-- Marks Table
CREATE TABLE marks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id),
  subject VARCHAR(100),
  exam_type VARCHAR(50),
  marks_obtained DECIMAL(5, 2),
  total_marks DECIMAL(5, 2),
  term VARCHAR(50),
  academic_year VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Dormitories Table
CREATE TABLE dormitories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dormitory_name VARCHAR(100) NOT NULL,
  dormitory_type VARCHAR(20) CHECK (dormitory_type IN ('boys', 'girls')),
  capacity INTEGER,
  current_occupancy INTEGER DEFAULT 0,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Store Items Table
CREATE TABLE store_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name VARCHAR(255) NOT NULL,
  item_code VARCHAR(50) UNIQUE NOT NULL,
  quantity_in_stock INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 10,
  unit_price DECIMAL(10, 2),
  category VARCHAR(100),
  supplier VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dormitories ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
```

### 4. RLS Policies (optional, for production)
For public access (development), create policies:

```sql
-- Allow public read/write (development only)
CREATE POLICY "Allow all" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON teachers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON fees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON marks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON dormitories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON store_items FOR ALL USING (true) WITH CHECK (true);
```

## Project Structure

```
src/
├── lib/
│   ├── supabase.ts          # Supabase client setup
│   ├── types.ts             # Database type definitions
│   └── services.ts          # Database service functions (CRUD)
├── hooks/
│   ├── useDatabase.ts       # React Query hooks for data fetching
│   └── use-toast.ts         # Toast notification hook
└── pages/
    ├── admin/
    │   ├── StudentsPage.tsx # Integrated with Supabase
    │   ├── TeachersPage.tsx # Integrated with Supabase
    │   └── ...
    └── ...
```

## Available Services and Hooks

### Student Operations
- `useStudents()` - Get all students
- `useStudent(id)` - Get student by ID
- `useCreateStudent()` - Create new student
- `useUpdateStudent()` - Update student
- `useDeleteStudent()` - Delete student

### Teacher Operations
- `useTeachers()` - Get all teachers
- `useTeacher(id)` - Get teacher by ID
- `useCreateTeacher()` - Create new teacher
- `useUpdateTeacher()` - Update teacher
- `useDeleteTeacher()` - Delete teacher

### Class Operations
- `useClasses()` - Get all classes
- `useClass(id)` - Get class by ID
- `useCreateClass()` - Create new class
- `useUpdateClass()` - Update class
- `useDeleteClass()` - Delete class

### Fee Operations
- `useFees()` - Get all fees
- `useFeesByStudent(studentId)` - Get fees for specific student
- `useCreateFee()` - Create fee record
- `useUpdateFee()` - Update fee record

### Attendance Operations
- `useAttendance()` - Get all attendance records
- `useAttendanceByStudent(studentId)` - Get student attendance
- `useAttendanceByClass(classId)` - Get class attendance
- `useCreateAttendance()` - Create attendance record
- `useBulkCreateAttendance()` - Create multiple records

### Marks Operations
- `useMarks()` - Get all marks
- `useMarksByStudent(studentId)` - Get student marks
- `useMarksByClass(classId)` - Get class marks
- `useCreateMark()` - Create mark record
- `useBulkCreateMarks()` - Create multiple mark records

### Dormitory Operations
- `useDormitories()` - Get all dormitories
- `useDormitory(id)` - Get dormitory by ID
- `useCreateDormitory()` - Create dormitory
- `useUpdateDormitory()` - Update dormitory

### Store Operations
- `useStoreItems()` - Get all store items
- `useStoreItem(id)` - Get item by ID
- `useLowStockItems(threshold)` - Get low stock items
- `useCreateStoreItem()` - Create store item
- `useUpdateStoreItem()` - Update store item
- `useDeleteStoreItem()` - Delete store item

## Usage Example

```tsx
import { useStudents, useCreateStudent } from '@/hooks/useDatabase';

function MyComponent() {
  const { data: students, isLoading } = useStudents();
  const createMutation = useCreateStudent();

  const handleAddStudent = async () => {
    await createMutation.mutateAsync({
      first_name: "John",
      last_name: "Doe",
      email: "john@school.edu",
      // ... other fields
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {students?.map(student => (
        <div key={student.id}>{student.first_name} {student.last_name}</div>
      ))}
    </div>
  );
}
```

## Features

- ✅ Full CRUD operations for all modules
- ✅ React Query integration for efficient data fetching
- ✅ Automatic caching and synchronization
- ✅ Error handling and toast notifications
- ✅ Type-safe database operations
- ✅ Bulk operations support
- ✅ Advanced filtering and search

## Next Steps

1. Set up environment variables
2. Create Supabase tables using SQL
3. Enable Row Level Security for production
4. Integrate remaining pages (Fees, Attendance, Marks)
5. Add authentication layer
6. Deploy to production

## Support

For issues or questions, refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Project GitHub](https://github.com/werejoel/eduhub-suite)
