import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

const classes = [
  { id: "1", name: "Grade 8A", students: 32, teacher: "Ms. Emily Davis", room: "Room 101" },
  { id: "2", name: "Grade 8B", students: 30, teacher: "Mr. John Smith", room: "Room 102" },
  { id: "3", name: "Grade 9A", students: 35, teacher: "Mrs. Jennifer Taylor", room: "Room 201" },
  { id: "4", name: "Grade 9B", students: 28, teacher: "Mr. James Brown", room: "Room 202" },
  { id: "5", name: "Grade 10A", students: 30, teacher: "Dr. Sarah Wilson", room: "Room 301" },
  { id: "6", name: "Grade 10B", students: 32, teacher: "Mr. Robert Miller", room: "Room 302" },
  { id: "7", name: "Grade 11A", students: 25, teacher: "Ms. Lisa Anderson", room: "Room 401" },
  { id: "8", name: "Grade 12A", students: 22, teacher: "Dr. Michael Thompson", room: "Room 501" },
];

export default function ClassesPage() {
  return (
    <DashboardLayout role="admin" userName="Admin User">
      <PageHeader
        title="Classes Management"
        description="View and manage all classes"
        icon={BookOpen}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {classes.map((cls, idx) => (
          <motion.div
            key={cls.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-card rounded-2xl p-6 border border-border shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-3xl font-bold text-foreground">{cls.students}</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{cls.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">{cls.teacher}</p>
            <p className="text-xs text-muted-foreground">{cls.room}</p>
          </motion.div>
        ))}
      </div>
    </DashboardLayout>
  );
}
