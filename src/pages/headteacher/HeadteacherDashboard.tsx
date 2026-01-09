import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import PageHeader from "@/components/dashboard/PageHeader";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Users,
  GraduationCap,
  TrendingUp,
  DollarSign,
  FileText,
  BookOpen,
  School,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  useStudents,
  useTeachers,
  useMarks,
  useFees,
} from "@/hooks/useDatabase";
import { formatUGX } from "@/lib/utils";
import { useMemo } from "react";
const HeadteacherDashboard = () => {
  const navigate = useNavigate();
  const { data: students = [] } = useStudents();
  const { data: teachers = [] } = useTeachers();
  const { data: marks = [] } = useMarks();
  const { data: fees = [] } = useFees();

  // Calculate stats from real data
  const stats = useMemo(() => {
    const totalStudents = students.length;
    const totalTeachers = teachers.length;
    const activeTeachers = teachers.filter((t) => t.status === "active").length;

    // Calculate pass rate (assuming 50% is passing)
    const totalMarks = marks.length;
    const passingMarks = marks.filter((m) => {
      const percentage = (m.marks_obtained / m.total_marks) * 100;
      return percentage >= 50;
    }).length;
    const passRate =
      totalMarks > 0 ? Math.round((passingMarks / totalMarks) * 100) : 0;

    // Calculate revenue (fees collected)
    const totalRevenue = fees
      .filter((f) => f.payment_status === "paid")
      .reduce((sum, f) => sum + (f.amount || 0), 0);

    // Student growth (this month vs last month)
    const thisMonth = new Date().getMonth();
    const thisMonthStudents = students.filter((s) => {
      const enrollDate = new Date(s.enrollment_date);
      return enrollDate.getMonth() === thisMonth;
    }).length;
    const lastMonthStudents = students.filter((s) => {
      const enrollDate = new Date(s.enrollment_date);
      return enrollDate.getMonth() === (thisMonth - 1 + 12) % 12;
    }).length;
    const growth =
      lastMonthStudents > 0
        ? `+${Math.round(
            ((thisMonthStudents - lastMonthStudents) / lastMonthStudents) * 100
          )}% vs last month`
        : `${thisMonthStudents} new this month`;

    return [
      {
        title: "Total Students",
        value: totalStudents.toLocaleString(),
        change: growth,
        changeType: "positive" as const,
        icon: Users,
        iconColor: "bg-primary",
      },
      {
        title: "Total Staff",
        value: totalTeachers.toString(),
        change: `${activeTeachers} active teachers`,
        changeType: "neutral" as const,
        icon: GraduationCap,
        iconColor: "bg-success",
      },
      {
        title: "Pass Rate",
        value: `${passRate}%`,
        change: "Based on all marks",
        changeType: "positive" as const,
        icon: TrendingUp,
        iconColor: "bg-secondary",
      },
      {
        title: "Revenue",
        value: formatUGX(totalRevenue, { decimals: 0 }),
        change: "This quarter",
        changeType: "neutral" as const,
        icon: DollarSign,
        iconColor: "bg-warning",
      },
    ];
  }, [students, teachers, marks, fees]);

  // Calculate subject performance
  const performanceData = useMemo(() => {
    const subjectScores: Record<string, { total: number; count: number }> = {};

    marks.forEach((mark) => {
      if (mark.subject) {
        if (!subjectScores[mark.subject]) {
          subjectScores[mark.subject] = { total: 0, count: 0 };
        }
        const percentage = (mark.marks_obtained / mark.total_marks) * 100;
        subjectScores[mark.subject].total += percentage;
        subjectScores[mark.subject].count += 1;
      }
    });

    return Object.entries(subjectScores)
      .map(([subject, data]) => ({
        subject,
        score: Math.round(data.total / data.count),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [marks]);

  return (
    <DashboardLayout>
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
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(214, 32%, 91%)"
                  />
                  <XAxis
                    dataKey="subject"
                    stroke="hsl(215, 16%, 47%)"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(215, 16%, 47%)" fontSize={12} />
                  <Tooltip />
                  <Bar
                    dataKey="score"
                    fill="hsl(217, 91%, 22%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No performance data available
              </div>
            )}
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
              {
                label: "View Reports",
                icon: FileText,
                color: "bg-primary",
                route: "/headteacher/reports",
              },
              {
                label: "Staff Management",
                icon: GraduationCap,
                color: "bg-success",
                route: "/headteacher/staff",
              },
              {
                label: "Manage Classes",
                icon: School,
                color: "bg-blue-600",
                route: "/headteacher/classes",
              },
              {
                label: "Academic Calendar",
                icon: BookOpen,
                color: "bg-secondary",
                route: "/headteacher/academic",
              },
              {
                label: "Assign Duties",
                icon: FileText,
                color: "bg-blue-500",
                route: "/headteacher/duties",
              },
              {
                label: "Duty Ratings",
                icon: TrendingUp,
                color: "bg-yellow-500",
                route: "/headteacher/ratings",
              },
              {
                label: "Payment Requests",
                icon: DollarSign,
                color: "bg-green-500",
                route: "/headteacher/payment-requests",
              },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.route)}
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
};
export default HeadteacherDashboard;
