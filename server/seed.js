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
    // create seven primary classes named P1 through P7
    const classes = await Class.insertMany([
      { class_name: 'P1', class_code: 'P1', form_number: 1, teacher_id: teachers[0]._id.toString(), capacity: 50 },
      { class_name: 'P2', class_code: 'P2', form_number: 2, teacher_id: teachers[1]._id.toString(), capacity: 50 },
      { class_name: 'P3', class_code: 'P3', form_number: 3, teacher_id: teachers[2]._id.toString(), capacity: 50 },
      { class_name: 'P4', class_code: 'P4', form_number: 4, teacher_id: teachers[3]._id.toString(), capacity: 50 },
      { class_name: 'P5', class_code: 'P5', form_number: 5, teacher_id: teachers[0]._id.toString(), capacity: 50 },
      { class_name: 'P6', class_code: 'P6', form_number: 6, teacher_id: teachers[1]._id.toString(), capacity: 50 },
      { class_name: 'P7', class_code: 'P7', form_number: 7, teacher_id: teachers[2]._id.toString(), capacity: 50 },
    ]);
    console.log(`✓ Created ${classes.length} classes`);

    // Seed Dormitories (before students so we can assign them)
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

    // Seed Students
    console.log('Seeding students...');
    // generate 50 students with some randomised data
    const studentsData = [];
    const firstNames = ['Peter','Amina','David','Grace','Charles','Stella','Robert','Rachel','Samuel','Esther','Brian','Janet','Luke','Faith','Brian','Joy','Victor','Susan','Kevin','Maria'];
    const lastNames = ['Mwesigwa','Nakimuli','Kyaliwajja','Ssemwanga','Okello','Bwebwa','Nabwire','Kabugho','Kato','Nankya','Wamala','Mutebi','Kajubi','Nabirye','Ssekandi','Tumusiime','Byaruhanga','Kaggwa','Lubega','Nabaggala'];
    const genders = ['male','female'];
    const dormStatuses = ['present','absent','sick','not-around'];
    for (let i = 1; i <= 50; i++) {
      const idx = Math.floor(Math.random() * firstNames.length);
      const gender = genders[Math.floor(Math.random() * genders.length)];
      const dorm = dormitories[Math.floor(Math.random() * dormitories.length)];
      const cls = classes[Math.floor(Math.random() * classes.length)];
      const bed = `B${100 + i}`;
      const admission = `SMS${String(i).padStart(3,'0')}`;
      const dob = new Date(2003 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const dobStr = dob.toISOString().split('T')[0];
      studentsData.push({
        admission_number: admission,
        first_name: firstNames[idx],
        last_name: lastNames[idx],
        email: `${firstNames[idx].toLowerCase()}.${lastNames[idx].toLowerCase()}@student.sms.com`,
        phone: `+2567${Math.floor(10000000 + Math.random() * 90000000)}`,
        date_of_birth: dobStr,
        gender,
        class_id: cls._id.toString(),
        enrollment_date: '2023-01-10',
        status: 'active',
        dormitory_id: dorm._id.toString(),
        bed_number: bed,
        dormitory_status: dormStatuses[Math.floor(Math.random() * dormStatuses.length)],
      });
    }
    const students = await Student.insertMany(studentsData);
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
