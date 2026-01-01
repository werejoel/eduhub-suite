require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eduhub';

// Generic schema: allow flexible fields
const createFlexibleModel = (name) => {
  const schema = new mongoose.Schema({}, { strict: false, timestamps: true });
  try {
    return mongoose.model(name);
  } catch (e) {
    return mongoose.model(name, schema, name);
  }
};

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get models
    const Student = createFlexibleModel('students');
    const Teacher = createFlexibleModel('teachers');
    const Class = createFlexibleModel('classes');
    const Fee = createFlexibleModel('fees');
    const Attendance = createFlexibleModel('attendance');
    const Mark = createFlexibleModel('marks');
    const Dormitory = createFlexibleModel('dormitories');
    const StoreItem = createFlexibleModel('store_items');
    const User = createFlexibleModel('users');

    // Clear existing data
    console.log('Clearing existing collections...');
    await Promise.all([
      Student.deleteMany({}),
      Teacher.deleteMany({}),
      Class.deleteMany({}),
      Fee.deleteMany({}),
      Attendance.deleteMany({}),
      Mark.deleteMany({}),
      Dormitory.deleteMany({}),
      StoreItem.deleteMany({}),
    ]);

    // Seed Teachers
    console.log('Seeding teachers...');
    const teachers = await Teacher.insertMany([
      {
        employee_id: 'T001',
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@example.com',
        phone: '+256700123456',
        subject: 'Mathematics',
        qualification: 'Bachelor in Mathematics',
        employment_date: '2021-01-15',
        status: 'active',
      },
      {
        employee_id: 'T002',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane.doe@example.com',
        phone: '+256700234567',
        subject: 'English',
        qualification: 'Bachelor in English Literature',
        employment_date: '2020-06-10',
        status: 'active',
      },
      {
        employee_id: 'T003',
        first_name: 'Michael',
        last_name: 'Johnson',
        email: 'michael.johnson@example.com',
        phone: '+256700345678',
        subject: 'Science',
        qualification: 'Bachelor in Science',
        employment_date: '2019-08-20',
        status: 'active',
      },
      {
        employee_id: 'T004',
        first_name: 'Sarah',
        last_name: 'Williams',
        email: 'sarah.williams@example.com',
        phone: '+256700456789',
        subject: 'History',
        qualification: 'Bachelor in History',
        employment_date: '2022-02-01',
        status: 'active',
      },
    ]);
    console.log(`✓ Created ${teachers.length} teachers`);

    // Seed Classes
    console.log('Seeding classes...');
    const classes = await Class.insertMany([
      {
        class_name: 'Form 1A',
        class_code: 'F1A',
        form_number: 1,
        teacher_id: teachers[0]._id.toString(),
        capacity: 50,
      },
      {
        class_name: 'Form 1B',
        class_code: 'F1B',
        form_number: 1,
        teacher_id: teachers[1]._id.toString(),
        capacity: 48,
      },
      {
        class_name: 'Form 2A',
        class_code: 'F2A',
        form_number: 2,
        teacher_id: teachers[2]._id.toString(),
        capacity: 50,
      },
      {
        class_name: 'Form 3A',
        class_code: 'F3A',
        form_number: 3,
        teacher_id: teachers[3]._id.toString(),
        capacity: 45,
      },
      {
        class_name: 'Form 4A',
        class_code: 'F4A',
        form_number: 4,
        teacher_id: teachers[0]._id.toString(),
        capacity: 42,
      },
    ]);
    console.log(`✓ Created ${classes.length} classes`);

    // Seed Students
    console.log('Seeding students...');
    const students = await Student.insertMany([
      {
        admission_number: 'SMS001',
        first_name: 'Peter',
        last_name: 'Mwesigwa',
        email: 'peter.mwesigwa@student.sms.com',
        phone: '+256701234567',
        date_of_birth: '2007-03-15',
        gender: 'male',
        class_id: classes[0]._id.toString(),
        enrollment_date: '2023-01-10',
        status: 'active',
      },
      {
        admission_number: 'SMS002',
        first_name: 'Amina',
        last_name: 'Nakimuli',
        email: 'amina.nakimuli@student.sms.com',
        phone: '+256702234567',
        date_of_birth: '2007-05-22',
        gender: 'female',
        class_id: classes[0]._id.toString(),
        enrollment_date: '2023-01-10',
        status: 'active',
      },
      {
        admission_number: 'SMS003',
        first_name: 'David',
        last_name: 'Kyaliwajja',
        email: 'david.kyaliwajja@student.sms.com',
        phone: '+256703234567',
        date_of_birth: '2006-11-08',
        gender: 'male',
        class_id: classes[1]._id.toString(),
        enrollment_date: '2023-01-10',
        status: 'active',
      },
      {
        admission_number: 'SMS004',
        first_name: 'Grace',
        last_name: 'Ssemwanga',
        email: 'grace.ssemwanga@student.sms.com',
        phone: '+256704234567',
        date_of_birth: '2006-07-14',
        gender: 'female',
        class_id: classes[1]._id.toString(),
        enrollment_date: '2023-01-10',
        status: 'active',
      },
      {
        admission_number: 'SMS005',
        first_name: 'Charles',
        last_name: 'Okello',
        email: 'charles.okello@student.sms.com',
        phone: '+256705234567',
        date_of_birth: '2005-09-20',
        gender: 'male',
        class_id: classes[2]._id.toString(),
        enrollment_date: '2022-01-10',
        status: 'active',
      },
      {
        admission_number: 'SMS006',
        first_name: 'Stella',
        last_name: 'Bwebwa',
        email: 'stella.bwebwa@student.sms.com',
        phone: '+256706234567',
        date_of_birth: '2005-12-05',
        gender: 'female',
        class_id: classes[2]._id.toString(),
        enrollment_date: '2022-01-10',
        status: 'active',
      },
      {
        admission_number: 'SMS007',
        first_name: 'Robert',
        last_name: 'Nabwire',
        email: 'robert.nabwire@student.sms.com',
        phone: '+256707234567',
        date_of_birth: '2004-04-10',
        gender: 'male',
        class_id: classes[3]._id.toString(),
        enrollment_date: '2021-01-10',
        status: 'active',
      },
      {
        admission_number: 'SMS008',
        first_name: 'Rachel',
        last_name: 'Kabugho',
        email: 'rachel.kabugho@student.sms.com',
        phone: '+256708234567',
        date_of_birth: '2004-06-18',
        gender: 'female',
        class_id: classes[3]._id.toString(),
        enrollment_date: '2021-01-10',
        status: 'active',
      },
    ]);
    console.log(`✓ Created ${students.length} students`);

    // Seed Fees
    console.log('Seeding fees...');
    const fees = await Fee.insertMany([
      {
        student_id: students[0]._id.toString(),
        amount: 1500000,
        term: 'Term 1',
        academic_year: '2024',
        payment_status: 'paid',
        due_date: '2024-02-15',
        paid_date: '2024-02-10',
      },
      {
        student_id: students[0]._id.toString(),
        amount: 1500000,
        term: 'Term 2',
        academic_year: '2024',
        payment_status: 'pending',
        due_date: '2024-05-15',
      },
      {
        student_id: students[1]._id.toString(),
        amount: 1500000,
        term: 'Term 1',
        academic_year: '2024',
        payment_status: 'paid',
        due_date: '2024-02-15',
        paid_date: '2024-02-12',
      },
      {
        student_id: students[1]._id.toString(),
        amount: 1500000,
        term: 'Term 2',
        academic_year: '2024',
        payment_status: 'overdue',
        due_date: '2024-05-15',
      },
      {
        student_id: students[2]._id.toString(),
        amount: 1500000,
        term: 'Term 1',
        academic_year: '2024',
        payment_status: 'paid',
        due_date: '2024-02-15',
        paid_date: '2024-02-14',
      },
    ]);
    console.log(`✓ Created ${fees.length} fees`);

    // Seed Attendance
    console.log('Seeding attendance...');
    const today = new Date();
    const attendanceData = [];
    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      students.forEach((student, idx) => {
        attendanceData.push({
          student_id: student._id.toString(),
          class_id: student.class_id,
          attendance_date: date.toISOString().split('T')[0],
          status: Math.random() > 0.1 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'late'),
        });
      });
    }
    const attendance = await Attendance.insertMany(attendanceData);
    console.log(`✓ Created ${attendance.length} attendance records`);

    // Seed Marks
    console.log('Seeding marks...');
    const subjects = ['Mathematics', 'English', 'Science', 'History', 'Geography'];
    const marksData = [];
    students.forEach((student) => {
      subjects.forEach((subject) => {
        marksData.push({
          student_id: student._id.toString(),
          class_id: student.class_id,
          subject: subject,
          exam_type: 'Mid Term',
          marks_obtained: Math.floor(Math.random() * 100),
          total_marks: 100,
          term: 'Term 1',
          academic_year: '2024',
        });
        marksData.push({
          student_id: student._id.toString(),
          class_id: student.class_id,
          subject: subject,
          exam_type: 'End Term',
          marks_obtained: Math.floor(Math.random() * 100),
          total_marks: 100,
          term: 'Term 1',
          academic_year: '2024',
        });
      });
    });
    const marks = await Mark.insertMany(marksData);
    console.log(`✓ Created ${marks.length} marks records`);

    // Seed Dormitories
    console.log('Seeding dormitories...');
    const dormitories = await Dormitory.insertMany([
      {
        dormitory_name: 'Boys Hostel A',
        dormitory_type: 'boys',
        capacity: 100,
        current_occupancy: 87,
        location: 'East Wing',
      },
      {
        dormitory_name: 'Boys Hostel B',
        dormitory_type: 'boys',
        capacity: 80,
        current_occupancy: 65,
        location: 'West Wing',
      },
      {
        dormitory_name: 'Girls Hostel A',
        dormitory_type: 'girls',
        capacity: 90,
        current_occupancy: 78,
        location: 'South Wing',
      },
      {
        dormitory_name: 'Girls Hostel B',
        dormitory_type: 'girls',
        capacity: 70,
        current_occupancy: 62,
        location: 'North Wing',
      },
    ]);
    console.log(`✓ Created ${dormitories.length} dormitories`);

    // Seed Store Items
    console.log('Seeding store items...');
    const storeItems = await StoreItem.insertMany([
      {
        item_name: 'Exercise Books',
        item_code: 'EB001',
        quantity_in_stock: 500,
        reorder_level: 100,
        unit_price: 5000,
        category: 'Stationery',
        supplier: 'Kampala Supplies Ltd',
      },
      {
        item_name: 'Pens (Box of 50)',
        item_code: 'PEN001',
        quantity_in_stock: 25,
        reorder_level: 50,
        unit_price: 25000,
        category: 'Stationery',
        supplier: 'Kampala Supplies Ltd',
      },
      {
        item_name: 'Whiteboard Markers',
        item_code: 'WBM001',
        quantity_in_stock: 120,
        reorder_level: 50,
        unit_price: 8000,
        category: 'Teaching Materials',
        supplier: 'Office Depot Uganda',
      },
      {
        item_name: 'Chalk (Box of 100)',
        item_code: 'CHALK001',
        quantity_in_stock: 8,
        reorder_level: 20,
        unit_price: 15000,
        category: 'Teaching Materials',
        supplier: 'Office Depot Uganda',
      },
      {
        item_name: 'Computer Paper (Ream)',
        item_code: 'PAPER001',
        quantity_in_stock: 45,
        reorder_level: 30,
        unit_price: 35000,
        category: 'Stationery',
        supplier: 'Tech Solutions',
      },
      {
        item_name: 'Cleaning Supplies Bundle',
        item_code: 'CLEAN001',
        quantity_in_stock: 12,
        reorder_level: 10,
        unit_price: 50000,
        category: 'Maintenance',
        supplier: 'Facility Management Co',
      },
    ]);
    console.log(`✓ Created ${storeItems.length} store items`);

    // Seed Users (with hashed password for bcrypt)
    console.log('Seeding users...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = await User.insertMany([
      {
        email: 'admin@sms.com',
        password: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        email_confirmed: true,
      },
      {
        email: 'teacher@sms.com',
        password: hashedPassword,
        first_name: 'Teacher',
        last_name: 'Account',
        role: 'teacher',
        email_confirmed: true,
      },
      {
        email: 'headteacher@sms.com',
        password: hashedPassword,
        first_name: 'Head',
        last_name: 'Teacher',
        role: 'headteacher',
        email_confirmed: true,
      },
      {
        email: 'burser@sms.com',
        password: hashedPassword,
        first_name: 'Burser',
        last_name: 'Account',
        role: 'burser',
        email_confirmed: true,
      },
    ]);
    console.log(`✓ Created ${users.length} users`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nTest Credentials:');
    console.log('- Admin: admin@sms.com / password123');
    console.log('- Teacher: teacher@sms.com / password123');
    console.log('- Head Teacher: headteacher@sms.com / password123');
    console.log('- Burser: burser@sms.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
