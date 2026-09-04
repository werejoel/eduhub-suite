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
  Sun,
  Moon,
  ClipboardList,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
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
import { toast } from "sonner";
import { formatUGX } from "@/lib/utils";
import { useMemo } from "react";
import { DEFAULT_STUDENT_REQUIREMENTS } from "@/lib/types";
import {
  exportStudents,
  exportFees,
  exportOutstandingFees,
} from "@/lib/adminExports";

function AdminDashboard() {
  const navigate = useNavigate();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  const { data: fees = [], isLoading: feesLoading } = useFees();
  const { data: dormitories = [], isLoading: dormitoriesLoading } =
    useDormitories();
  const { data: classes = [] } = useClasses();
  const { data: pendingRequests = [] } = useItemRequests("pending");

  // Calculate stats from real data
  const stats = useMemo(() => {
    const totalStudents = students.length;
    const totalTeachers = teachers.length;
    const totalFeesCollected = fees
      .filter((f) => f.payment_status === "paid")
      .reduce((sum, f) => sum + (f.amount || 0), 0);
    const totalDormitoryOccupancy = dormitories.reduce(
      (sum, d) => sum + (d.current_occupancy || 0),
      0,
    );
    const totalDormitoryCapacity = dormitories.reduce(
      (sum, d) => sum + (d.capacity || 0),
      0,
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
            (thisMonthStudents / lastMonthStudents) * 100,
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
        iconColor: "bg-sky-600",
        accentColor: "border-sky-600",
      },
      {
        title: "Day Students",
        value: students
          .filter((s) => (s.boarding_status || "day") === "day")
          .length.toString(),
        change: `${Math.round((students.filter((s) => (s.boarding_status || "day") === "day").length / Math.max(totalStudents, 1)) * 100)}% of total`,
        changeType: "neutral" as const,
        icon: Sun,
        iconColor: "bg-amber-500",
        accentColor: "border-amber-500",
      },
      {
        title: "Boarding Students",
        value: students
          .filter((s) => s.boarding_status === "boarding")
          .length.toString(),
        change: `${Math.round((students.filter((s) => s.boarding_status === "boarding").length / Math.max(totalStudents, 1)) * 100)}% of total`,
        changeType: "neutral" as const,
        icon: Moon,
        iconColor: "bg-blue-600",
        accentColor: "border-blue-600",
      },
      {
        title: "Total Teachers",
        value: totalTeachers.toString(),
        change: teacherGrowth,
        changeType: "positive" as const,
        icon: GraduationCap,
        iconColor: "bg-emerald-600",
        accentColor: "border-emerald-600",
      },
      {
        title: "Fees Collected",
        value: formatUGX(totalFeesCollected),
        change: `${
          fees.filter((f) => f.payment_status === "paid").length
        } paid`,
        changeType: "neutral" as const,
        icon: DollarSign,
        iconColor: "bg-indigo-600",
        accentColor: "border-indigo-600",
      },
      {
        title: "Dormitory",
        value: totalDormitoryOccupancy.toString(),
        change: `${occupancyRate}% occupancy`,
        changeType: "neutral" as const,
        icon: Building2,
        iconColor: "bg-orange-500",
        accentColor: "border-orange-500",
      },
    ];
  }, [students, teachers, fees, dormitories]);

  const requirementStats = useMemo(() => {
    const activeStudents = students.filter((s) => s.status === "active");
    const fullyComplete = activeStudents.filter((s) => {
      const checklist =
        s.requirements_checklist || DEFAULT_STUDENT_REQUIREMENTS;
      return checklist.length > 0 && checklist.every((r) => r.completed);
    }).length;
    const incomplete = activeStudents.length - fullyComplete;
    const byItem = DEFAULT_STUDENT_REQUIREMENTS.map((req) => ({
      id: req.id,
      name: req.name,
      pending: activeStudents.filter((s) => {
        const checklist =
          s.requirements_checklist || DEFAULT_STUDENT_REQUIREMENTS;
        const item = checklist.find((r) => r.id === req.id);
        return !item?.completed;
      }).length,
    }));
    const incompleteStudents = activeStudents
      .filter((s) => {
        const checklist =
          s.requirements_checklist || DEFAULT_STUDENT_REQUIREMENTS;
        return !checklist.every((r) => r.completed);
      })
      .slice(0, 6)
      .map((s) => {
        const checklist =
          s.requirements_checklist || DEFAULT_STUDENT_REQUIREMENTS;
        const completed = checklist.filter((r) => r.completed).length;
        return {
          id: s.id,
          name: `${s.first_name} ${s.last_name}`,
          class:
            classes.find((c) => c.id === s.class_id)?.class_name ||
            "Unassigned",
          section: s.boarding_status === "boarding" ? "Boarding" : "Day",
          progress: `${completed}/${checklist.length}`,
        };
      });
    return {
      fullyComplete,
      incomplete,
      byItem,
      incompleteStudents,
      totalActive: activeStudents.length,
    };
  }, [students, classes]);

  // Get recent students
  const recentStudents = useMemo(() => {
    return students
      .sort(
        (a, b) =>
          new Date(b.enrollment_date).getTime() -
          new Date(a.enrollment_date).getTime(),
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

  const feeBreakdown = useMemo(() => {
    const entries = [
      { name: "Paid", status: "paid", color: "#059669" },
      { name: "Pending", status: "pending", color: "#d97706" },
      { name: "Overdue", status: "overdue", color: "#e11d48" },
    ].map((entry) => ({
      ...entry,
      value: fees
        .filter((fee) => fee.payment_status === entry.status)
        .reduce((sum, fee) => sum + Number(fee.amount || 0), 0),
    }));
    return entries.filter((entry) => entry.value > 0);
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

      {/* Data Export Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-6 border border-border shadow-md mb-8"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-sky-100 p-2 text-sky-700">
            <Download className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold">Download Reports</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Export school data as Excel (.xlsx) or CSV (.csv) files
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              label: "Students List",
              accent: "border-sky-200 bg-sky-50/70",
              labelColor: "text-sky-800",
              onExcel: () => {
                exportStudents(students, classes, "excel");
                toast.success("Students exported to Excel");
              },
              onCsv: () => {
                exportStudents(students, classes, "csv");
                toast.success("Students exported to CSV");
              },
            },
            {
              label: "Fee Records",
              accent: "border-emerald-200 bg-emerald-50/70",
              labelColor: "text-emerald-800",
              onExcel: () => {
                exportFees(fees, students, "excel");
                toast.success("Fees exported to Excel");
              },
              onCsv: () => {
                exportFees(fees, students, "csv");
                toast.success("Fees exported to CSV");
              },
            },
            {
              label: "Outstanding Fees",
              accent: "border-rose-200 bg-rose-50/70",
              labelColor: "text-rose-800",
              onExcel: () => {
                exportOutstandingFees(students, fees, classes, "excel");
                toast.success("Outstanding fees exported to Excel");
              },
              onCsv: () => {
                exportOutstandingFees(students, fees, classes, "csv");
                toast.success("Outstanding fees exported to CSV");
              },
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md ${item.accent}`}
            >
              <p className={`mb-3 text-sm font-semibold ${item.labelColor}`}>
                {item.label}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 gap-1 border-emerald-600 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                  onClick={item.onExcel}
                  disabled={isLoading}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Excel
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-1 border-sky-600 bg-sky-600 text-xs text-white hover:bg-sky-700"
                  onClick={item.onCsv}
                  disabled={isLoading}
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </Button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, idx) => (
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

      {/* Requirements & Section Overview */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-md"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Student Requirements</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/students")}
            >
              Manage
            </Button>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-success/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-success">
                    {requirementStats.fullyComplete}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fully Complete
                  </p>
                </div>
                <div className="bg-warning/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-warning">
                    {requirementStats.incomplete}
                  </p>
                  <p className="text-xs text-muted-foreground">Incomplete</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                {requirementStats.byItem.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0"
                  >
                    <span className="text-muted-foreground">{item.name}</span>
                    <span
                      className={`font-medium ${
                        item.pending > 0 ? "text-warning" : "text-success"
                      }`}
                    >
                      {item.pending} pending
                    </span>
                  </div>
                ))}
              </div>
              {requirementStats.incompleteStudents.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    Students needing attention
                  </p>
                  <div className="space-y-2">
                    {requirementStats.incompleteStudents.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm"
                      >
                        <div>
                          <p className="font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.class} · {s.section}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-warning/10 text-warning">
                          {s.progress}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-md"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Day & Boarding Sections</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/students")}
            >
              View All
            </Button>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {classes.map((cls) => {
                const classStudents = students.filter(
                  (s) => s.class_id === cls.id && s.status === "active",
                );
                const dayCount = classStudents.filter(
                  (s) => (s.boarding_status || "day") === "day",
                ).length;
                const boardingCount = classStudents.filter(
                  (s) => s.boarding_status === "boarding",
                ).length;
                return (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{cls.class_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {classStudents.length} active students
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber/10 text-amber">
                        Day: {dayCount}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue/10 text-blue">
                        Boarding: {boardingCount}
                      </span>
                    </div>
                  </div>
                );
              })}
              {classes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No classes configured yet
                </p>
              )}
            </div>
          )}
        </motion.div>
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
          <h3 className="text-lg font-semibold mb-2">
            Fee Collection Overview
          </h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Payment amounts by current status
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={feeBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={98}
                  paddingAngle={3}
                  label={({ value }) => {
                    const total = feeBreakdown.reduce((sum, entry) => sum + entry.value, 0);
                    return total > 0 ? `${((Number(value) / total) * 100).toFixed(1)}%` : "";
                  }}
                  labelLine={{ stroke: "#64748b", strokeWidth: 1 }}
                >
                  {feeBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatUGX(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {feeBreakdown.map((entry) => {
              const total = feeBreakdown.reduce((sum, item) => sum + item.value, 0);
              const percentage = total > 0 ? (entry.value / total) * 100 : 0;
              return (
                <div key={entry.name} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="flex-1 text-muted-foreground">{entry.name}</span>
                  <span className="font-semibold">{percentage.toFixed(1)}%</span>
                </div>
              );
            })}
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
            <div className="text-muted-foreground text-sm">
              No pending requests
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.slice(0, 4).map((req: any) => (
                <div
                  key={req._id}
                  className="flex items-start justify-between gap-2 pb-2 border-b last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {req.item_name}
                    </div>
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
              <div
                key={i}
                className="h-12 bg-muted rounded animate-pulse"
              ></div>
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
