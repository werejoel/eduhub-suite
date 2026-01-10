import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
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
  useItemRequests,
} from "@/hooks/useDatabase";
import { useLowStockItems } from "@/hooks/useDatabase";
import { subscribeToPush } from "@/lib/services";
import { toast } from "sonner";
import { formatUGX } from "@/lib/utils";
import { useMemo } from "react";

function AdminDashboard() {
  const navigate = useNavigate();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  const { data: fees = [], isLoading: feesLoading } = useFees();
  const { data: dormitories = [], isLoading: dormitoriesLoading } =
    useDormitories();
  const { data: classes = [] } = useClasses();
  const { data: pendingRequests = [] } = useItemRequests('pending');

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

      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            try {
              await subscribeToPush();
              toast.success("Push notifications enabled");
            } catch (err) {
              console.error("Push subscribe error", err);
              toast.error(
                "Failed to enable push: " + (err as any).message || ""
              );
            }
          }}
        >
          Enable push notifications
        </Button>
      </div>

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
              {
                label: "Add New Student",
                icon: Users,
                color: "bg-primary",
                route: "/admin/students",
              },
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
              {
                label: "Item Requests",
                icon: ShoppingCart,
                color: "bg-accent",
                route: "/admin/item-requests",
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Pending Requests</h3>
            {pendingRequests.length > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </div>
          {pendingRequests.length === 0 ? (
            <div className="text-muted-foreground text-sm">No pending requests</div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.slice(0, 4).map((req: any) => (
                <div key={req._id} className="flex items-start justify-between gap-2 pb-2 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{req.item_name}</div>
                    <div className="text-xs text-muted-foreground">
                      Qty: {req.quantity_requested} • {req.requested_by}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/admin/item-requests")}
                    className="text-primary text-xs"
                  >
                    Review
                  </Button>
                </div>
              ))}
              {pendingRequests.length > 4 && (
                <button
                  onClick={() => navigate("/admin/item-requests")}
                  className="w-full text-sm text-primary hover:underline"
                >
                  View all {pendingRequests.length} requests
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* Low Stock Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-md"
        >
          <h3 className="text-lg font-semibold mb-4">Low Stock Items</h3>
          {lowStock.length === 0 ? (
            <div className="text-muted-foreground">All items healthy</div>
          ) : (
            <div className="space-y-2">
              {lowStock.slice(0, 6).map((it: any) => (
                <div
                  key={(it as any).id ?? (it as any)._id}
                  className="flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-medium">{it.item_name}</div>
                    <div className="text-xs text-muted-foreground">
                      Qty: {it.quantity_in_stock} • Reorder: {it.reorder_level}
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => navigate("/admin/store")}
                      className="text-sm text-primary underline"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
              {lowStock.length > 6 && (
                <div className="text-xs text-muted-foreground">
                  +{lowStock.length - 6} more
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Pending Fees Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-card rounded-2xl p-6 border border-border shadow-md"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Outstanding Fees</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/fees")}
          >
            View All
          </Button>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        ) : (
          (() => {
            const outstandingFees = fees
              .filter((f) => f.payment_status !== "paid")
              .slice(0, 8)
              .map((fee) => {
                const student = students.find((s) => s.id === fee.student_id);
                const studentClass = student
                  ? classes.find((c) => c.id === student.class_id)
                  : undefined;
                return {
                  name: student
                    ? `${student.first_name} ${student.last_name}`
                    : "Unknown",
                  class: studentClass?.class_name || "Unassigned",
                  amount: fee.amount || 0,
                  dueDate: fee.due_date
                    ? new Date(fee.due_date).toLocaleDateString()
                    : "N/A",
                  status: fee.payment_status,
                };
              });

            return outstandingFees.length > 0 ? (
              <div className="space-y-3">
                {outstandingFees.map((fee, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{fee.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Class: {fee.class} • Due: {fee.dueDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        {formatUGX(fee.amount)}
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          fee.status === "pending"
                            ? "bg-warning/10 text-warning"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {fee.status}
                      </span>
                    </div>
                  </div>
                ))}
                {fees.filter((f) => f.payment_status !== "paid").length > 8 && (
                  <button
                    onClick={() => navigate("/admin/fees")}
                    className="w-full text-sm text-primary hover:underline py-2"
                  >
                    View all outstanding fees
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-6">
                All fees collected!
              </div>
            );
          })()
        )}
      </motion.div>
    </DashboardLayout>
  );
}
export default AdminDashboard;
