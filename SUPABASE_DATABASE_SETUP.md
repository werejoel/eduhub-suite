# Supabase Database Setup Guide

## Quick Start

Follow these steps to set up your Supabase database for the EduHub Suite project.

### Step 1: Access Supabase SQL Editor

1. Go to [supabase.com](https://supabase.com) and log into your project
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query** to create a new SQL query

### Step 2: Create Database Tables

1. Copy the entire SQL schema from [SUPABASE_SCHEMA.sql](SUPABASE_SCHEMA.sql)
2. Paste it into the Supabase SQL Editor
3. Click **Run** (or press Ctrl+Enter)

The script will create all 8 tables with proper indexes and constraints:
- ✅ students
- ✅ teachers
- ✅ classes
- ✅ fees
- ✅ attendance
- ✅ marks
- ✅ dormitories
- ✅ store_items

### Step 3: Verify Table Creation

1. Go to **Table Editor** in Supabase
2. You should see all tables listed in the left sidebar
3. Click each table to verify the schema matches

## Table Details

### Students Table
- Stores student information
- Key fields: `admission_number`, `first_name`, `last_name`, `email`, `phone`, `class_id`, `status`
- Status: `active`, `inactive`, `graduated`

### Teachers Table
- Stores teacher information
- Key fields: `employee_id`, `first_name`, `last_name`, `email`, `subject`, `qualification`
- Status: `active`, `inactive`

### Classes Table
- Stores class information
- Key fields: `class_name`, `class_code`, `form_number`, `teacher_id`, `capacity`
- Links to Teachers table via `teacher_id`

### Fees Table
- Tracks student fee payments
- Key fields: `student_id`, `amount`, `term`, `academic_year`, `payment_status`
- Status: `paid`, `pending`, `overdue`
- Links to Students table via `student_id`

### Attendance Table
- Records daily attendance
- Key fields: `student_id`, `class_id`, `attendance_date`, `status`
- Status: `present`, `absent`, `late`

### Marks Table
- Stores exam results
- Key fields: `student_id`, `class_id`, `subject`, `exam_type`, `marks_obtained`, `total_marks`
- Supports terms and academic years

### Dormitories Table
- Manages student accommodations
- Key fields: `dormitory_name`, `dormitory_type`, `capacity`, `current_occupancy`, `location`
- Type: `boys`, `girls`

### Store Items Table
- Inventory management
- Key fields: `item_name`, `item_code`, `quantity_in_stock`, `reorder_level`, `unit_price`, `category`

## Optional: Row Level Security (RLS)

For production use, enable RLS to restrict data access:

```sql
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dormitories ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
```

Then create policies for each table as needed.

## Troubleshooting

### Tables not appearing?
- Refresh the Supabase page
- Check the SQL execution for errors
- Ensure your anon key has proper permissions

### Connection errors in the app?
- Verify `.env.local` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check Supabase project settings for API keys
- Restart the dev server: `npm run dev`

### Foreign key constraint errors?
- Make sure parent tables (teachers, students, classes) exist before referencing them
- Run the schema script in order

## Next Steps

1. ✅ Run the SQL schema script
2. ✅ Verify all tables are created
3. ✅ Optionally add sample data for testing
4. ✅ Start the dev server: `npm run dev`
5. ✅ Navigate to any admin page to test database operations

Your EduHub Suite is now ready to store data in Supabase!
