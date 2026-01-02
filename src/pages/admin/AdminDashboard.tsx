import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Users,
  GraduationCap,
  DollarSign,
  Building2,
  TrendingUp,
  Calendar,
  BookOpen,
  ShoppingCart,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  useStudents,
  useTeachers,
  useFees,
  useDormitories,
  useClasses,
} from "@/hooks/useDatabase";
import { useLowStockItems } from "@/hooks/useDatabase";
import { formatUGX } from "@/lib/utils";
import { useMemo } from "react";

const columns = [
  { key: "name", label: "Student Name" },
  { key: "class", label: "Class" },
  { key: "admissionDate", label: "Admission Date" },
  {
    key: "status",
    label: "Status",
    render: (value: string) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          value === "Active"
            ? "bg-success/10 text-success"
            : "bg-warning/10 text-warning"
        }`}
      >
        {value}
      </span>
    ),
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  const { data: fees = [], isLoading: feesLoading } = useFees();
  const { data: dormitories = [], isLoading: dormitoriesLoading } =
    useDormitories();
  const { data: classes = [] } = useClasses();

  // Calculate stats from real data
  const stats = useMemo(() => {
    const totalStudents = students.length;
    const totalTeachers = teachers.length;
    const totalFeesCollected = fees
      .filter((f) => f.payment_status === "paid")
      .reduce((sum, f) => sum + (f.amount || 0), 0);
    const totalDormitoryOccupancy = dormitories.reduce(
      (sum, d) => sum + (d.current_occupancy || 0),
      0
    );
    const totalDormitoryCapacity = dormitories.reduce(
      (sum, d) => sum + (d.capacity || 0),
      0
    );
    const occupancyRate =
      totalDormitoryCapacity > 0
        ? Math.round((totalDormitoryOccupancy / totalDormitoryCapacity) * 100)
        : 0;

    // Calculate student growth (comparing last month vs this month)
    const thisMonth = new Date().getMonth();
    const thisMonthStudents = students.filter((s) => {
      const enrollDate = new Date(s.enrollment_date);
      return enrollDate.getMonth() === thisMonth;
    }).length;
    const lastMonthStudents = students.filter((s) => {
      const enrollDate = new Date(s.enrollment_date);
      return enrollDate.getMonth() === (thisMonth - 1 + 12) % 12;
    }).length;
    const studentGrowth =
      lastMonthStudents > 0
        ? `+${Math.round(
            (thisMonthStudents / lastMonthStudents) * 100
          )}% this month`
        : `${thisMonthStudents} new this month`;

    // Calculate teacher growth
    const thisMonthTeachers = teachers.filter((t) => {
      const employDate = new Date(t.employment_date);
      return employDate.getMonth() === thisMonth;
    }).length;
    const teacherGrowth =
      thisMonthTeachers > 0
        ? `+${thisMonthTeachers} new hires`
        : `${teachers.filter((t) => t.status === "active").length} active`;

    return [
      {
        title: "Total Students",
        value: totalStudents.toLocaleString(),
        change: studentGrowth,
        changeType: "positive" as const,
        icon: Users,
        iconColor: "bg-primary",
      },
      {
        title: "Total Teachers",
        value: totalTeachers.toString(),
        change: teacherGrowth,
        changeType: "positive" as const,
        icon: GraduationCap,
        iconColor: "bg-success",
      },
      {
        title: "Fees Collected",
        value: formatUGX(totalFeesCollected),
        change: `${
          fees.filter((f) => f.payment_status === "paid").length
        } paid`,
        changeType: "neutral" as const,
        icon: DollarSign,
        iconColor: "bg-secondary",
      },
      {
        title: "Dormitory",
        value: totalDormitoryOccupancy.toString(),
        change: `${occupancyRate}% occupancy`,
        changeType: "neutral" as const,
        icon: Building2,
        iconColor: "bg-warning",
      },
    ];
  }, [students, teachers, fees, dormitories]);

  // Get recent students
  const recentStudents = useMemo(() => {
    return students
      .sort(
        (a, b) =>
          new Date(b.enrollment_date).getTime() -
          new Date(a.enrollment_date).getTime()
      )
      .slice(0, 5)
      .map((student) => ({
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        class:
          classes.find((c) => c.id === student.class_id)?.class_name ||
          "Unassigned",
        admissionDate: new Date(student.enrollment_date).toLocaleDateString(),
        status:
          student.status === "active"
            ? "Active"
            : student.status === "inactive"
            ? "Inactive"
            : "Graduated",
      }));
  }, [students, classes]);

  // Calculate fee collection by month
  const feeData = useMemo(() => {
    const monthlyData: Record<string, number> = {};

    fees
      .filter((f) => f.payment_status === "paid" && f.paid_date)
      .forEach((fee) => {
        const date = new Date(fee.paid_date!);
        const monthKey = date.toLocaleDateString("en-US", { month: "short" });
        monthlyData[monthKey] =
          (monthlyData[monthKey] || 0) + (fee.amount || 0);
      });

    // Get last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString("en-US", { month: "short" });
      months.push({ month: monthKey, collected: monthlyData[monthKey] || 0 });
    }

    return months;
  }, [fees]);

  const isLoading =
    studentsLoading || teachersLoading || feesLoading || dormitoriesLoading;

  const { data: lowStock = [] } = useLowStockItems(10);

  return (
    <DashboardLayout>
      <PageHeader
        title="Admin Dashboard"
        description="Welcome back! Here's what's happening at your school."
        icon={TrendingUp}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isLoading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-card rounded-2xl p-6 border border-border animate-pulse"
              >
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            ))
          : stats.map((stat, idx) => (
              <StatCard key={stat.title} {...stat} delay={idx * 0.1} />
            ))}
      </div>

      {/* Charts & Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Fee Collection Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border shadow-md"
        >
          <h3 className="text-lg font-semibold mb-4">
            Fee Collection Overview
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={feeData}>
                <defs>
                  <linearGradient id="colorFee" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(217, 91%, 22%)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(217, 91%, 22%)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(214, 32%, 91%)"
                />
                <XAxis
                  dataKey="month"
                  stroke="hsl(215, 16%, 47%)"
                  fontSize={12}
                />
                <YAxis stroke="hsl(215, 16%, 47%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(214, 32%, 91%)",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="collected"
                  stroke="hsl(217, 91%, 22%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorFee)"
                />
                <Tooltip formatter={(value: number) => formatUGX(value)} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-md"
        >
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { label: "Add New Student", icon: Users, color: "bg-primary", route: "/admin/students" },
              {
                label: "Record Payment",
                icon: DollarSign,
                color: "bg-success",
                route: "/admin/fees",
              },
              {
                label: "View Timetable",
                icon: Calendar,
                color: "bg-secondary",
                route: "/admin/classes",
              },
              {
                label: "Manage Store",
                icon: ShoppingCart,
                color: "bg-warning",
                route: "/admin/store",
              },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.route)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
              >
                <div className={`${action.color} p-2 rounded-lg`}>
                  <action.icon className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-medium text-sm">{action.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Low Stock Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-md"
        >
          <h3 className="text-lg font-semibold mb-4">Low Stock Items</h3>
          {lowStock.length === 0 ? (
            <div className="text-muted-foreground">All items healthy</div>
          ) : (
            <div className="space-y-2">
              {lowStock.slice(0, 6).map((it: any) => (
                <div key={(it as any).id ?? (it as any)._id} className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{it.item_name}</div>
                    <div className="text-xs text-muted-foreground">Qty: {it.quantity_in_stock} • Reorder: {it.reorder_level}</div>
                  </div>
                  <div className="text-right">
                    <button onClick={() => navigate('/admin/store')} className="text-sm text-primary underline">Manage</button>
                  </div>
                </div>
              ))}
              {lowStock.length > 6 && <div className="text-xs text-muted-foreground">+{lowStock.length - 6} more</div>}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Students Table */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Recent Admissions</h3>
        {isLoading ? (
          <div className="bg-card rounded-2xl p-6 border border-border animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        ) : recentStudents.length > 0 ? (
          <DataTable
            columns={columns}
            data={recentStudents}
            onEdit={(row) => console.log("Edit", row)}
            onView={(row) => console.log("View", row)}
          />
        ) : (
          <div className="bg-card rounded-2xl p-6 border border-border text-center text-muted-foreground">
            No recent admissions
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
