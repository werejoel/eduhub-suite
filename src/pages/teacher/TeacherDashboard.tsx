import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BookOpen, Users, FileText, Clock, CheckCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useClasses, useStudents, useMarks, useAttendance, useDutiesByTeacher, useUpdateDuty } from "@/hooks/useDatabase";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";


const gradeDistribution = [
  { name: "A", value: 25, color: "hsl(142, 76%, 36%)" },
  { name: "B", value: 40, color: "hsl(217, 91%, 35%)" },
  { name: "C", value: 28, color: "hsl(45, 93%, 47%)" },
  { name: "D", value: 5, color: "hsl(38, 92%, 50%)" },
  { name: "F", value: 2, color: "hsl(0, 84%, 60%)" },
];

const columns = [
  { key: "name", label: "Class" },
  { key: "subject", label: "Subject" },
  { key: "students", label: "Students" },
  { key: "nextClass", label: "Next Class" },
  { key: "room", label: "Room" },
];
function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: classes = [] } = useClasses();
  const { data: students = [] } = useStudents();
  const { data: marks = [] } = useMarks();
  const { data: attendance = [] } = useAttendance();
  const { data: duties = [] } = useDutiesByTeacher(user?.id || "");
  const updateDutyMutation = useUpdateDuty();

  // Filter classes for this teacher
  const teacherClasses = useMemo(() => {
    if (!user) return [];
    return classes.filter(c => c.teacher_id === user.id);
  }, [classes, user]);

  // Calculate stats from real data
  const stats = useMemo(() => {
    const myClassIds = teacherClasses.map(c => c.id);
    const myStudents = students.filter(s => myClassIds.includes(s.class_id));
    const totalStudents = myStudents.length;
    
    // Get today's attendance
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a => 
      a.attendance_date === today && myClassIds.includes(a.class_id)
    );
    const presentToday = todayAttendance.filter(a => a.status === 'present').length;
    const totalToday = todayAttendance.length;
    const attendanceRate = totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0;
    const absentToday = totalToday - presentToday;

    // Pending grades (marks not yet entered for recent exams)
    const pendingGrades = 0; // This would need more complex logic

    return [
      { 
        title: "My Classes", 
        value: teacherClasses.length.toString(), 
        change: "Active classes", 
        changeType: "neutral" as const, 
        icon: BookOpen, 
        iconColor: "bg-primary" 
      },
      { 
        title: "Total Students", 
        value: totalStudents.toString(), 
        change: "Across all classes", 
        changeType: "neutral" as const, 
        icon: Users, 
        iconColor: "bg-success" 
      },
      { 
        title: "Pending Grades", 
        value: pendingGrades.toString(), 
        change: "Awaiting entry", 
        changeType: "negative" as const, 
        icon: FileText, 
        iconColor: "bg-warning" 
      },
      { 
        title: "Attendance Today", 
        value: `${attendanceRate}%`, 
        change: `${absentToday} absent`, 
        changeType: "positive" as const, 
        icon: CheckCircle, 
        iconColor: "bg-secondary" 
      },
    ];
  }, [teacherClasses, students, attendance]);

  // Format classes for display
  const formattedClasses = useMemo(() => {
    return teacherClasses.map(cls => {
      const classStudents = students.filter(s => s.class_id === cls.id);
      return {
        id: cls.id,
        name: cls.class_name,
        subject: cls.class_name, // You might want to add subject to classes table
        students: classStudents.length,
        nextClass: "Today 9:00 AM", // This would come from a timetable table
        room: "Room 301", // This would come from classes table
      };
    });
  }, [teacherClasses, students]);

  const startDuty = async (dutyId: string) => {
    try {
      await updateDutyMutation.mutateAsync({ id: dutyId, updates: { status: "in_progress", start_date: new Date().toISOString() } });
    } catch (err) {
      console.error(err);
    }
  };

  const completeDuty = async (dutyId: string) => {
    try {
      await updateDutyMutation.mutateAsync({ id: dutyId, updates: { status: "completed", end_date: new Date().toISOString() } });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Teacher Dashboard"
        description="Welcome back! Manage your classes and students."
        icon={BookOpen}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <StatCard key={stat.title} {...stat} delay={idx * 0.1} />
        ))}
      </div>

      {/* Duties Assigned */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-card rounded-2xl p-6 border border-border shadow-md mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">My Duties</h3>
          <span className="text-sm text-muted-foreground">{duties?.length || 0} assigned</span>
        </div>
        <div className="space-y-3">
          {duties && duties.length > 0 ? (
            duties.map((d: any) => (
              <div key={d.id} className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border bg-muted/30">
                <div>
                  <h4 className="font-semibold">{d.duty_name}</h4>
                  <p className="text-sm text-muted-foreground">{d.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Due: {d.end_date ? new Date(d.end_date).toLocaleDateString() : "-"}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${d.status === 'completed' ? 'bg-green-100 text-green-800' : d.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                    {d.status}
                  </span>
                  <div className="flex gap-2">
                    {d.status === 'assigned' && (
                      <button onClick={() => startDuty(d.id)} className="px-3 py-1 bg-blue-600 text-white rounded">Start</button>
                    )}
                    {d.status === 'in_progress' && (
                      <button onClick={() => completeDuty(d.id)} className="px-3 py-1 bg-green-600 text-white rounded">Complete</button>
                    )}
                    <button onClick={() => navigate(`/teacher/duties/${d.id}`)} className="px-3 py-1 border rounded">Details</button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-6">No duties assigned</div>
          )}
        </div>
      </motion.div>

      {/* Charts & Classes */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* My Classes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border shadow-md"
        >
          <h3 className="text-lg font-semibold mb-4">My Classes</h3>
          <div className="space-y-4">
            {formattedClasses.length > 0 ? formattedClasses.map((cls) => (
              <div
                key={cls.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{cls.name}</h4>
                    <p className="text-sm text-muted-foreground">{cls.subject} • {cls.students} students</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{cls.nextClass}</p>
                  <p className="text-xs text-muted-foreground">{cls.room}</p>
                </div>
              </div>
            )) : (
              <div className="text-center text-muted-foreground py-8">
                No classes assigned
              </div>
            )}
          </div>
        </motion.div>

        {/* Grade Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-md"
        >
          <h3 className="text-lg font-semibold mb-4">Grade Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-6"
      >
        <div>
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Register Students", description: "Add and manage students", icon: Users, color: "bg-blue-500", route: "/teacher/students" },
              { label: "Enter Marks", description: "Record student grades", icon: FileText, color: "bg-purple-500", route: "/teacher/marks" },
              { label: "Mark Attendance", description: "Record daily attendance", icon: CheckCircle, color: "bg-green-500", route: "/teacher/attendance" },
              { label: "My Classes", description: "View all classes", icon: BookOpen, color: "bg-orange-500", route: "/teacher/classes" },
            ].map((action) => {
              const firstClassId = teacherClasses && teacherClasses.length > 0 ? teacherClasses[0].id : null;
              const to = firstClassId ? `${action.route}?classId=${firstClassId}` : action.route;
              return (
                <motion.button
                  key={action.label}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(to)}
                  className="flex flex-col items-center gap-3 p-6 bg-card rounded-2xl border border-border hover:shadow-lg transition-all"
                >
                  <div className={`${action.color} p-3 rounded-xl`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Action Cards with more details */}
        <div className="grid md:grid-cols-2 gap-4 mt-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="bg-blue-500 p-3 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Register & Manage Students</h4>
                <p className="text-sm text-gray-700 mb-3">Register new students to your classes, assign them to different classes, and manage student information.</p>
                <button
                  onClick={() => navigate("/teacher/students")}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
                >
                  Go to Student Management →
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="bg-purple-500 p-3 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Record Marks</h4>
                <p className="text-sm text-gray-700 mb-3">Enter and track student marks for different exams and assignments. View grades and performance analytics.</p>
                <button
                  onClick={() => {
                    const firstClassId = teacherClasses && teacherClasses.length > 0 ? teacherClasses[0].id : null;
                    navigate(firstClassId ? `/teacher/marks?classId=${firstClassId}` : "/teacher/marks");
                  }}
                  className="text-sm font-medium text-purple-600 hover:text-purple-700 underline"
                >
                  Go to Marks Entry →
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200 shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="bg-green-500 p-3 rounded-xl">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Mark Attendance</h4>
                <p className="text-sm text-gray-700 mb-3">Take daily attendance for your classes. Track presence, absence, and generate attendance reports.</p>
                <button
                  onClick={() => {
                    const firstClassId = teacherClasses && teacherClasses.length > 0 ? teacherClasses[0].id : null;
                    navigate(firstClassId ? `/teacher/attendance?classId=${firstClassId}` : "/teacher/attendance");
                  }}
                  className="text-sm font-medium text-green-600 hover:text-green-700 underline"
                >
                  Go to Attendance →
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200 shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="bg-orange-500 p-3 rounded-xl">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Manage Classes</h4>
                <p className="text-sm text-gray-700 mb-3">View all your assigned classes, student lists, and class-specific information.</p>
                <button
                  onClick={() => navigate("/teacher/classes")}
                  className="text-sm font-medium text-orange-600 hover:text-orange-700 underline"
                >
                  View My Classes →
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
export default TeacherDashboard;