import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import PageHeader from "@/components/dashboard/PageHeader";
import { motion } from "framer-motion";
import { Users, GraduationCap, TrendingUp, DollarSign, FileText, BookOpen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const stats = [
  { title: "Total Students", value: "1,234", change: "+5% vs last year", changeType: "positive" as const, icon: Users, iconColor: "bg-primary" },
  { title: "Total Staff", value: "98", change: "12 teachers, 86 support", changeType: "neutral" as const, icon: GraduationCap, iconColor: "bg-success" },
  { title: "Pass Rate", value: "94%", change: "+2% improvement", changeType: "positive" as const, icon: TrendingUp, iconColor: "bg-secondary" },
  { title: "Revenue", value: "$125K", change: "This quarter", changeType: "neutral" as const, icon: DollarSign, iconColor: "bg-warning" },
];

const performanceData = [
  { subject: "Math", score: 78 },
  { subject: "Science", score: 82 },
  { subject: "English", score: 75 },
  { subject: "History", score: 70 },
  { subject: "Arts", score: 88 },
];

export default function HeadteacherDashboard() {
  return (
    <DashboardLayout role="headteacher" userName="Principal Smith">
      <PageHeader
        title="Head Teacher Dashboard"
        description="School performance overview and management"
        icon={GraduationCap}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <StatCard key={stat.title} {...stat} delay={idx * 0.1} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-md"
        >
          <h3 className="text-lg font-semibold mb-4">Subject Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                <XAxis dataKey="subject" stroke="hsl(215, 16%, 47%)" fontSize={12} />
                <YAxis stroke="hsl(215, 16%, 47%)" fontSize={12} />
                <Tooltip />
                <Bar dataKey="score" fill="hsl(217, 91%, 22%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-md"
        >
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "View Reports", icon: FileText, color: "bg-primary" },
              { label: "Staff Management", icon: GraduationCap, color: "bg-success" },
              { label: "Academic Calendar", icon: BookOpen, color: "bg-secondary" },
              { label: "Financial Overview", icon: DollarSign, color: "bg-warning" },
            ].map((action) => (
              <button
                key={action.label}
                className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
              >
                <div className={`${action.color} p-2 rounded-lg`}>
                  <action.icon className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-medium text-sm">{action.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
