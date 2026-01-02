import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BookOpen, Users, FileText, Clock, CheckCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useClasses, useStudents, useMarks, useAttendance } from "@/hooks/useDatabase";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

const stats = [
  { title: "My Classes", value: "4", change: "Active classes", changeType: "neutral" as const, icon: BookOpen, iconColor: "bg-primary" },
  { title: "Total Students", value: "128", change: "Across all classes", changeType: "neutral" as const, icon: Users, iconColor: "bg-success" },
  { title: "Pending Grades", value: "15", change: "Awaiting entry", changeType: "negative" as const, icon: FileText, iconColor: "bg-warning" },
  { title: "Attendance Today", value: "96%", change: "5 absent", changeType: "positive" as const, icon: CheckCircle, iconColor: "bg-secondary" },
];

const myClasses = [
  { id: "1", name: "Grade 10A", subject: "Mathematics", students: 32, nextClass: "Today 9:00 AM", room: "Room 301" },
  { id: "2", name: "Grade 11B", subject: "Mathematics", students: 30, nextClass: "Today 11:00 AM", room: "Room 302" },
  { id: "3", name: "Grade 9A", subject: "Mathematics", students: 35, nextClass: "Tomorrow 8:00 AM", room: "Room 201" },
  { id: "4", name: "Grade 12A", subject: "Advanced Math", students: 25, nextClass: "Tomorrow 10:00 AM", room: "Room 401" },
];

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

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: classes = [] } = useClasses();
  const { data: students = [] } = useStudents();
  const { data: marks = [] } = useMarks();
  const { data: attendance = [] } = useAttendance();

  // Filter classes for this teacher
  const myClasses = useMemo(() => {
    if (!user) return [];
    return classes.filter(c => c.teacher_id === user.id);
  }, [classes, user]);

  // Calculate stats from real data
  const stats = useMemo(() => {
    const myClassIds = myClasses.map(c => c.id);
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
        value: myClasses.length.toString(), 
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
  }, [myClasses, students, attendance]);

  // Format classes for display
  const formattedClasses = useMemo(() => {
    return myClasses.map(cls => {
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
  }, [myClasses, students]);

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

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Add Marks", icon: FileText, color: "bg-primary", route: "/teacher/marks" },
          { label: "Take Attendance", icon: CheckCircle, color: "bg-success", route: "/teacher/attendance" },
          { label: "View Schedule", icon: Clock, color: "bg-secondary", route: "/teacher/schedule" },
          { label: "Student List", icon: Users, color: "bg-warning", route: "/teacher/students" },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.route)}
            className="flex flex-col items-center gap-3 p-6 bg-card rounded-2xl border border-border hover:shadow-lg transition-all"
          >
            <div className={`${action.color} p-3 rounded-xl`}>
              <action.icon className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-medium text-sm">{action.label}</span>
          </button>
        ))}
      </motion.div>
    </DashboardLayout>
  );
}
