import { useState, useMemo, useContext, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Search,
  Filter,
  Eye,
  EyeOff,
  Home,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { useFees, useStudents, useClasses, useCreateStudent, useUpdateStudent, useDeleteStudent } from "@/hooks/useDatabase";
import { formatUGX } from "@/lib/utils";
import {
  getExpectedFee,
  FEE_STRUCTURE,
  BOARDING_STORE_REQUIREMENTS,
  DAY_STORE_REQUIREMENTS,
  BURSER_FEE_REFERENCE,
} from "@/lib/schoolConfig";
import {
  exportToExcel,
  exportMultipleSheets,
  formatDataForExport,
} from "@/lib/exportToExcel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import DataTable from "@/components/dashboard/DataTable";
import StatCard from "@/components/dashboard/StatCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as PieChartComponent,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useCreateFee, useDeleteFee, useUpdateFee } from "@/hooks/useDatabase";

const getCurrentAcademicYear = () => {
  const y = new Date().getFullYear();
  return `${y}/${y + 1}`;
};

const BurserDashboard = () => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<
    "overview" | "payments" | "students" | "reports" | "settings"
  >("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentSectionFilter, setStudentSectionFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const { data: fees = [] } = useFees();
  const { data: students = [] } = useStudents();
  const { data: classes = [] } = useClasses();
  const createFee = useCreateFee();
  const deleteFee = useDeleteFee();
  const updateFee = useUpdateFee();
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [studentForm, setStudentForm] = useState({
    first_name: "",
    last_name: "",
    admission_number: "",
    class_id: "",
    boarding_status: "day" as "day" | "boarding",
    parents_names: "",
    contact: "",
  });

  const [newPayment, setNewPayment] = useState({
    student_id: "",
    amount: "",
    term: "",
    academic_year: "",
    payment_status: "paid",
    due_date: "",
  });

  const getClassName = (classId: string) =>
    classes.find((c) => c.id === classId)?.class_name || "Unassigned";

  const registeredStudents = useMemo(() => {
    return students
      .filter((s) => s.status === "active")
      .filter((s) => {
        const name =
          `${s.first_name} ${s.other_names || ""} ${s.last_name}`.toLowerCase();
        const matchesSearch =
          studentSearchQuery === "" ||
          name.includes(studentSearchQuery.toLowerCase()) ||
          (s.admission_number || "")
            .toLowerCase()
            .includes(studentSearchQuery.toLowerCase());
        const boarding = s.boarding_status || "day";
        const matchesSection =
          studentSectionFilter === "all" || boarding === studentSectionFilter;
        return matchesSearch && matchesSection;
      })
      .map((s) => {
        const className = getClassName(s.class_id);
        const boarding = s.boarding_status || "day";
        const expectedFee = getExpectedFee(className, boarding);
        const studentFees = fees.filter((f) => f.student_id === s.id);
        const paid = studentFees
          .filter((f) => f.payment_status === "paid" || f.payment_status === "pending")
          .reduce((sum, f) => sum + (f.amount || 0), 0);
        return {
          id: s.id,
          name: `${s.first_name} ${s.other_names ? s.other_names + " " : ""}${s.last_name}`,
          admission: s.admission_number,
          class: className,
          section: boarding === "boarding" ? "Boarding" : "Day",
          parents: s.parents_names || "—",
          contact: s.contact || "—",
          registrationFee: s.registration_fee || FEE_STRUCTURE.registration,
          expectedFee,
          paid,
          balance: Math.max(0, expectedFee - paid),
        };
      });
  }, [students, classes, fees, studentSearchQuery, studentSectionFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const paid = fees.filter((f) => f.payment_status === "paid");
    const pending = fees.filter((f) => f.payment_status === "pending");
    const overdue = fees.filter((f) => f.payment_status === "overdue");

    const totalCollected = paid.reduce((sum, f) => sum + (f.amount || 0), 0);
    const totalPending = pending.reduce((sum, f) => sum + (f.amount || 0), 0);
    const totalOverdue = overdue.reduce((sum, f) => sum + (f.amount || 0), 0);
    const totalExpected = fees.reduce((sum, f) => sum + (f.amount || 0), 0);

    return {
      totalCollected,
      totalPending,
      totalOverdue,
      totalExpected,
      collectionRate:
        totalExpected > 0
          ? Math.round((totalCollected / totalExpected) * 100)
          : 0,
      paidCount: paid.length,
      pendingCount: pending.length,
      overdueCount: overdue.length,
    };
  }, [fees]);

  // Payment trend data (by month)
  const paymentTrends = useMemo(() => {
    const monthlyData: Record<
      string,
      { paid: number; pending: number; overdue: number }
    > = {};

    fees.forEach((fee) => {
      const date = new Date(fee.createdAt);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { paid: 0, pending: 0, overdue: 0 };
      }

      if (fee.payment_status === "paid")
        monthlyData[monthKey].paid += fee.amount;
      if (fee.payment_status === "pending")
        monthlyData[monthKey].pending += fee.amount;
      if (fee.payment_status === "overdue")
        monthlyData[monthKey].overdue += fee.amount;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        }),
        paid: Math.round(data.paid / 1000000),
        pending: Math.round(data.pending / 1000000),
        overdue: Math.round(data.overdue / 1000000),
      }));
  }, [fees]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    return [
      { name: "Paid", value: stats.paidCount, color: "#10b981" },
      { name: "Pending", value: stats.pendingCount, color: "#f59e0b" },
      { name: "Overdue", value: stats.overdueCount, color: "#ef4444" },
    ];
  }, [stats]);

  // Recent transactions with student names
  const recentTransactions = useMemo(() => {
    return [...fees]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 15)
      .map((fee) => {
        const student = students.find((s) => s.id === fee.student_id);
        const className = student ? getClassName(student.class_id) : "";
        const expectedFee = Number(fee.expected_fee) > 0
          ? Number(fee.expected_fee)
          : student
            ? getExpectedFee(className, student.boarding_status || "day")
            : 0;
        const totalForTerm = fees
          .filter(
            (otherFee) =>
              otherFee.student_id === fee.student_id &&
              (otherFee.term || "N/A") === (fee.term || "N/A") &&
              (otherFee.academic_year || "N/A") === (fee.academic_year || "N/A") &&
              (otherFee.payment_status === "paid" || otherFee.payment_status === "pending"),
          )
          .reduce((sum, otherFee) => sum + Number(otherFee.amount || 0), 0);

        // Format dates safely
        const formatDate = (dateStr: any) => {
          if (!dateStr) return "N/A";
          try {
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
          } catch {
            return "N/A";
          }
        };

        return {
          id: fee.id,
          student: student
            ? `${student.first_name} ${student.last_name}`
            : "Unknown",
          amount: fee.amount,
          balance: Math.max(0, expectedFee - totalForTerm),
          term: fee.term,
          status: fee.payment_status,
          date: formatDate(fee.createdAt),
          dueDate: formatDate(fee.due_date),
        };
      });
  }, [fees, students]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return recentTransactions.filter(
      (t) =>
        searchQuery === "" ||
        t.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.term.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [recentTransactions, searchQuery]);

  // Top paying students
  const topStudents = useMemo(() => {
    const studentPayments: Record<string, number> = {};

    fees
      .filter((f) => f.payment_status === "paid")
      .forEach((fee) => {
        const student = students.find((s) => s.id === fee.student_id);
        const name = student
          ? `${student.first_name} ${student.last_name}`
          : "Unknown";
        studentPayments[name] = (studentPayments[name] || 0) + fee.amount;
      });

    return Object.entries(studentPayments)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [fees, students]);

  // Report state and handlers
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<Record<string, string>>(
    () => {
      const saved =
        typeof window !== "undefined"
          ? localStorage.getItem("burser_weekly_report")
          : null;
      return saved ? JSON.parse(saved) : {};
    },
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target as any;
    setWeeklyReport((prev) => ({ ...prev, [name]: value }));
  };

  const saveReport = () => {
    try {
      localStorage.setItem(
        "burser_weekly_report",
        JSON.stringify(weeklyReport),
      );
      toast.success("Weekly report saved locally");
    } catch {
      toast.error("Failed to save report");
    }
  };

  const printReport = () => {
    const content = reportRef.current?.innerHTML || "";
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return toast.error("Unable to open print window");
    w.document.write(
      `<html><head><title>Burser Weekly Report</title><meta charset="utf-8"></head><body>`,
    );
    w.document.write(content);
    w.document.write("</body></html>");
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 300);
  };

  const handleNewPaymentChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target as any;
    setNewPayment((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "student_id" && value) {
        const student = students.find((s) => s.id === value);
        if (student) {
          const className = getClassName(student.class_id);
          updated.amount = String(
            getExpectedFee(className, student.boarding_status || "day"),
          );
        }
      }
      return updated;
    });
  };

  const submitNewPayment = async () => {
    if (!newPayment.student_id || !newPayment.amount) {
      return toast.error("Please select a student and enter an amount");
    }

    // Format due_date to ISO string if it's just a date
    let dueDate = newPayment.due_date;
    if (dueDate && !dueDate.includes("T")) {
      dueDate = new Date(dueDate + "T00:00:00").toISOString();
    }

    try {
      const paymentData = {
        student_id: newPayment.student_id,
        amount: Number(newPayment.amount),
        term: newPayment.term || "N/A",
        academic_year: newPayment.academic_year || getCurrentAcademicYear(),
        payment_status: newPayment.payment_status as
          | "paid"
          | "pending"
          | "overdue",
        due_date: dueDate || new Date().toISOString(),
        expected_fee: getExpectedFee(
          getClassName(students.find((s) => s.id === newPayment.student_id)?.class_id || ""),
          students.find((s) => s.id === newPayment.student_id)?.boarding_status || "day",
        ),
      };

      if (editingPaymentId) {
        await updateFee.mutateAsync({ id: editingPaymentId, updates: paymentData });
        toast.success("Payment updated successfully");
      } else {
        await createFee.mutateAsync(paymentData);
        toast.success("Payment recorded successfully");
      }
      setEditingPaymentId(null);
      setNewPayment({
        student_id: "",
        amount: "",
        term: "",
        academic_year: "",
        payment_status: "paid",
        due_date: "",
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to record payment");
    }
  };

  const resetPaymentForm = () => {
    setEditingPaymentId(null);
    setNewPayment({
      student_id: "",
      amount: "",
      term: "",
      academic_year: "",
      payment_status: "paid",
      due_date: "",
    });
  };

  const editPayment = (row: any) => {
    const fee = fees.find((item) => String(item.id) === String(row.id));
    if (!fee) return toast.error("Payment record could not be found");
    setEditingPaymentId(String(fee.id));
    setNewPayment({
      student_id: fee.student_id,
      amount: String(fee.amount || ""),
      term: fee.term || "",
      academic_year: fee.academic_year || "",
      payment_status: fee.payment_status,
      due_date: fee.due_date ? String(fee.due_date).slice(0, 10) : "",
    });
    setActiveTab("payments");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openStudentDialog = (student?: (typeof students)[number]) => {
    setEditingStudentId(student?.id || null);
    setStudentForm({
      first_name: student?.first_name || "",
      last_name: student?.last_name || "",
      admission_number: student?.admission_number || "",
      class_id: student?.class_id || classes[0]?.id || "",
      boarding_status: student?.boarding_status || "day",
      parents_names: student?.parents_names || "",
      contact: student?.contact || "",
    });
    setStudentDialogOpen(true);
  };

  const saveStudent = async () => {
    if (!studentForm.first_name.trim() || !studentForm.last_name.trim() || !studentForm.admission_number.trim() || !studentForm.class_id) {
      toast.error("First name, last name, admission number, and class are required");
      return;
    }
    try {
      if (editingStudentId) {
        await updateStudent.mutateAsync({ id: editingStudentId, updates: studentForm });
      } else {
        await createStudent.mutateAsync({
          ...studentForm,
          date_of_birth: "",
          gender: "male",
          enrollment_date: new Date().toISOString(),
          status: "active",
        });
      }
      setStudentDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to save student record");
    }
  };

  const removeStudent = async (studentId: string) => {
    if (!window.confirm("Delete this student record permanently?")) return;
    try {
      await deleteStudent.mutateAsync(studentId);
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete student record");
    }
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePaymentRow, setDeletePaymentRow] = useState<any | null>(null);

  const handleDeletePayment = (row: any) => {
    setDeletePaymentRow(row);
    setDeleteConfirmOpen(true);
  };

  const confirmDeletePayment = async () => {
    if (deletePaymentRow) {
      try {
        const paymentId = deletePaymentRow.id || deletePaymentRow._id;
        if (!paymentId) throw new Error("Payment record ID is missing");
        await deleteFee.mutateAsync(String(paymentId));
        toast.success("Payment deleted");
      } catch (error: any) {
        toast.error(error?.message || "Failed to delete payment");
      }
      setDeleteConfirmOpen(false);
      setDeletePaymentRow(null);
    }
  };

  // Render different views based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div whileHover={{ y: -5 }}>
                <StatCard
                  title="Total Collected"
                  value={
                    balanceVisible ? formatUGX(stats.totalCollected) : "••••••"
                  }
                  icon={CreditCard}
                  change={`${stats.collectionRate}% collection rate`}
                  changeType="positive"
                />
              </motion.div>
              <motion.div whileHover={{ y: -5 }}>
                <StatCard
                  title="Pending Fees"
                  value={
                    balanceVisible ? formatUGX(stats.totalPending) : "••••••"
                  }
                  icon={AlertCircle}
                  change={`${stats.pendingCount} payments`}
                  changeType="neutral"
                />
              </motion.div>
              <motion.div whileHover={{ y: -5 }}>
                <StatCard
                  title="Overdue Fees"
                  value={
                    balanceVisible ? formatUGX(stats.totalOverdue) : "••••••"
                  }
                  icon={TrendingUp}
                  change={`${stats.overdueCount} overdue`}
                  changeType="negative"
                />
              </motion.div>
              <motion.div whileHover={{ y: -5 }}>
                <StatCard
                  title="Expected Revenue"
                  value={
                    balanceVisible ? formatUGX(stats.totalExpected) : "••••••"
                  }
                  icon={DollarSign}
                  change={`${fees.length} records`}
                  changeType="positive"
                />
              </motion.div>
            </div>

            {/* Export Overview Button */}
            <div className="flex justify-end">
              <Button
                className="gap-2"
                onClick={() => {
                  const overviewData = [
                    {
                      Metric: "Total Collected",
                      "Value (UGX)": stats.totalCollected,
                      "Collection Rate (%)": stats.collectionRate,
                    },
                    {
                      Metric: "Pending Fees",
                      "Value (UGX)": stats.totalPending,
                      Count: stats.pendingCount,
                    },
                    {
                      Metric: "Overdue Fees",
                      "Value (UGX)": stats.totalOverdue,
                      Count: stats.overdueCount,
                    },
                    {
                      Metric: "Expected Revenue",
                      "Value (UGX)": stats.totalExpected,
                      Records: fees.length,
                    },
                  ];
                  exportToExcel(overviewData, "Finance_Overview");
                  toast.success("Finance overview exported to Excel");
                }}
              >
                <Download className="w-4 h-4" />
                Export Overview
              </Button>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Payment Trends Chart */}
              <motion.div
                whileHover={{
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                }}
                className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-100"
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Payment Trends (Millions UGX)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={paymentTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value}M`} />
                    <Legend />
                    <Bar dataKey="paid" fill="#10b981" />
                    <Bar dataKey="pending" fill="#f59e0b" />
                    <Bar dataKey="overdue" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Status Distribution */}
              <motion.div
                whileHover={{
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                }}
                className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Status Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChartComponent>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChartComponent>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Top Paying Students */}
            <motion.div
              whileHover={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
              className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Paying Students
                </h3>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    const exportData = topStudents.map((s, i) => ({
                      Rank: i + 1,
                      "Student Name": s.name,
                      "Total Paid (UGX)": s.amount,
                    }));
                    exportToExcel(exportData, "Top_Paying_Students");
                    toast.success("Top paying students exported to Excel");
                  }}
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
              <div className="space-y-3">
                {topStudents.map((student, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{student.name}</span>
                    </div>
                    <span className="text-primary font-semibold">
                      {formatUGX(student.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        );

      case "payments":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Add Payment Form */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">
                {editingPaymentId ? "Edit Payment" : "Record New Payment"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <select
                  name="student_id"
                  value={newPayment.student_id}
                  onChange={handleNewPaymentChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                    </option>
                  ))}
                </select>

                <Input
                  name="amount"
                  type="number"
                  value={newPayment.amount}
                  onChange={handleNewPaymentChange}
                  placeholder="Amount (UGX)"
                />
                <Input
                  name="term"
                  value={newPayment.term}
                  onChange={handleNewPaymentChange}
                  placeholder="Term"
                />
                <select
                  name="payment_status"
                  value={newPayment.payment_status}
                  onChange={handleNewPaymentChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
                <Input
                  name="due_date"
                  type="date"
                  value={newPayment.due_date}
                  onChange={handleNewPaymentChange}
                  placeholder="Due date"
                />
                <Input
                  name="academic_year"
                  value={newPayment.academic_year}
                  onChange={handleNewPaymentChange}
                  placeholder="Academic year"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" onClick={submitNewPayment} className="gap-2">
                <CheckCircle className="w-4 h-4" />
                {editingPaymentId ? "Save Payment" : "Record Payment"}
              </Button>
              <Button type="button" variant="outline" onClick={resetPaymentForm}>
                {editingPaymentId ? "Cancel Edit" : "Clear"}
              </Button>
              </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search by student or term..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
                <Button
                  className="gap-2"
                  onClick={() => {
                    const exportData = filteredTransactions.map((t) => ({
                      "Student Name": t.student,
                      Term: t.term,
                      "Amount (UGX)": t.amount,
                      "Balance (UGX)": t.balance,
                      Status: t.status,
                      "Due Date": t.dueDate,
                      Date: t.date,
                    }));
                    exportToExcel(exportData, "Payment_Records");
                    toast.success("Payment records exported to Excel");
                  }}
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3 mb-4 rounded-lg bg-slate-50 px-3 py-2 text-xs">
                <span className="font-semibold text-slate-600">Payment status:</span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-700">Paid</span>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-700">Pending</span>
                <span className="rounded-full bg-rose-100 px-2.5 py-1 font-medium text-rose-700">Overdue</span>
              </div>

              <DataTable
                columns={[
                  { key: "student", label: "Student Name" },
                  { key: "term", label: "Term" },
                  {
                    key: "amount",
                    label: "Amount",
                    render: (value: number) => (
                      <span className="font-semibold text-slate-700">{formatUGX(value)}</span>
                    ),
                  },
                  {
                    key: "status",
                    label: "Status",
                    render: (value: string) => (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          value === "paid"
                            ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                            : value === "pending"
                              ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                              : "bg-rose-100 text-rose-700 ring-1 ring-rose-200"
                        }`}
                      >
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </span>
                    ),
                  },
                  {
                    key: "balance",
                    label: "Remaining Balance",
                    render: (value: number) => (
                      <span className={`inline-flex rounded-md px-2.5 py-1 font-semibold ${value > 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {formatUGX(value)}
                      </span>
                    ),
                  },
                  {
                    key: "dueDate",
                    label: "Due Date",
                    render: (value: any) => {
                      if (!value || value === "N/A") return "N/A";
                      return String(value);
                    },
                  },
                  {
                    key: "date",
                    label: "Created Date",
                    render: (value: any) => {
                      if (!value || value === "N/A") return "N/A";
                      return String(value);
                    },
                  },
                ]}
                data={filteredTransactions}
                onEdit={editPayment}
                onDelete={(row) => handleDeletePayment(row)}
              />
            </div>
          </motion.div>
        );

      case "students":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <p className="text-sm text-gray-600 mb-4">
                Fee structure: Baby/Top (Day) —{" "}
                {formatUGX(FEE_STRUCTURE.day_baby_top)} · P1–P3 (Day) —{" "}
                {formatUGX(FEE_STRUCTURE.day_p1_p3)} · P4–P7 (Boarding) —{" "}
                {formatUGX(FEE_STRUCTURE.boarding_p4_p7)}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search by name or admission number..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={studentSectionFilter}
                  onChange={(e) => setStudentSectionFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="all">All Sections</option>
                  <option value="day">Day Students</option>
                  <option value="boarding">Boarding Students</option>
                </select>
                <Button
                  className="gap-2"
                  onClick={() => {
                    exportToExcel(
                      registeredStudents.map((s) => ({
                        Name: s.name,
                        Admission: s.admission,
                        Class: s.class,
                        Section: s.section,
                        Parents: s.parents,
                        Contact: s.contact,
                        "Registration Fee": s.registrationFee,
                        "Expected Term Fee": s.expectedFee,
                        Paid: s.paid,
                        Balance: s.balance,
                      })),
                      "Registered_Students",
                    );
                    toast.success("Student list exported");
                  }}
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <Button
                  type="button"
                  className="gap-2"
                  onClick={() => openStudentDialog()}
                >
                  <Plus className="w-4 h-4" />
                  Register Student
                </Button>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Registered Students ({registeredStudents.length})
              </h3>
              <DataTable
                columns={[
                  { key: "name", label: "Student Name" },
                  { key: "admission", label: "Admission No." },
                  { key: "class", label: "Class" },
                  { key: "section", label: "Section" },
                  { key: "parents", label: "Parents" },
                  { key: "contact", label: "Contact" },
                  {
                    key: "registrationFee",
                    label: "Reg. Fee",
                    render: (v: number) => formatUGX(v),
                  },
                  {
                    key: "expectedFee",
                    label: "Expected Fee",
                    render: (v: number) => formatUGX(v),
                  },
                  {
                    key: "paid",
                    label: "Paid",
                    render: (v: number) => formatUGX(v),
                  },
                  {
                    key: "balance",
                    label: "Balance",
                    render: (v: number) => (
                      <span
                        className={
                          v > 0
                            ? "text-destructive font-medium"
                            : "text-success"
                        }
                      >
                        {formatUGX(v)}
                      </span>
                    ),
                  },
                  {
                    key: "actions",
                    label: "Actions",
                    render: (_: unknown, row: (typeof registeredStudents)[number]) => (
                      <div className="flex min-w-max gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="relative z-10 border-[#800020] bg-[#800020] text-white pointer-events-auto hover:bg-[#660018] hover:text-white"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            const student = students.find(
                              (candidate) => String(candidate.id) === String(row.id),
                            );
                            if (!student) {
                              toast.error("Student record could not be found");
                              return;
                            }
                            openStudentDialog(student);
                          }}
                        >
                          <Pencil className="mr-1 h-3 w-3" /> Edit
                        </Button>
                        <Button type="button" size="sm" variant="destructive" onClick={() => removeStudent(row.id)}>
                          <Trash2 className="mr-1 h-3 w-3" /> Delete
                        </Button>
                      </div>
                    ),
                  },
                ]}
                data={registeredStudents}
              />
            </div>
            <Dialog open={studentDialogOpen} onOpenChange={setStudentDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingStudentId ? "Edit Student Record" : "Register Student"}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input value={studentForm.first_name} onChange={(e) => setStudentForm({ ...studentForm, first_name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input value={studentForm.last_name} onChange={(e) => setStudentForm({ ...studentForm, last_name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Admission Number</Label>
                    <Input value={studentForm.admission_number} onChange={(e) => setStudentForm({ ...studentForm, admission_number: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <select className="h-10 rounded-md border bg-background px-3" value={studentForm.class_id} onChange={(e) => setStudentForm({ ...studentForm, class_id: e.target.value })}>
                      <option value="">Select class</option>
                      {classes.map((studentClass) => <option key={studentClass.id} value={studentClass.id}>{studentClass.class_name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Section</Label>
                    <select className="h-10 rounded-md border bg-background px-3" value={studentForm.boarding_status} onChange={(e) => setStudentForm({ ...studentForm, boarding_status: e.target.value as "day" | "boarding" })}>
                      <option value="day">Day</option>
                      <option value="boarding">Boarding</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Parent Contact</Label>
                    <Input value={studentForm.contact} onChange={(e) => setStudentForm({ ...studentForm, contact: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setStudentDialogOpen(false)}>Cancel</Button>
                  <Button onClick={saveStudent} disabled={createStudent.isPending || updateStudent.isPending}>
                    {editingStudentId ? "Save Changes" : "Register Student"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div>
        );

      case "reports":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">
                    KIBAALE PARENTS PRIMARY SCHOOL
                  </h2>
                  <p className="text-sm text-gray-600">
                    BURSAR’S WEEKLY REPORT — “EDUCATION FOR FREEDOM”
                  </p>
                  <p className="text-sm text-gray-600">
                    TEL: 0778226647 / 0772557596 / 0701021168
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={saveReport}>
                    Save
                  </Button>
                  <Button onClick={printReport}>Print / Export</Button>
                  <Button
                    className="gap-2"
                    onClick={() => {
                      const reportData = [
                        {
                          "Report Type": "Weekly Report",
                          School: "KIBAALE PARENTS PRIMARY SCHOOL",
                          "Date Generated": new Date().toLocaleDateString(),
                          "Prepared By": weeklyReport.prepared_by || "N/A",
                          "Approved By": weeklyReport.approved_by || "N/A",
                        },
                      ];
                      exportToExcel(reportData, "Weekly_Report");
                      toast.success("Weekly report exported to Excel");
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Export as Excel
                  </Button>
                </div>
              </div>

              <div ref={reportRef} className="space-y-6">
                {/* BOARDING SECTION */}
                <div>
                  <h3 className="font-semibold mb-2">
                    SCHOOL FEES — BOARDING SECTION
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      (P4–P7: {formatUGX(FEE_STRUCTURE.boarding_p4_p7)})
                    </span>
                  </h3>
                  <table className="w-full table-auto border-collapse">
                    <thead>
                      <tr className="text-left">
                        <th className="border px-2 py-1">CLASS</th>
                        <th className="border px-2 py-1">EXPECTED</th>
                        <th className="border px-2 py-1">RECEIVED</th>
                        <th className="border px-2 py-1">BALANCE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        "BABY",
                        "TOP",
                        "P.1",
                        "P.2",
                        "P.3",
                        "P.4",
                        "P.5",
                        "P.6",
                        "P.7",
                      ].map((cls) => (
                        <tr key={`boarding-${cls}`}>
                          <td className="border px-2 py-1">
                            {cls}
                            {BURSER_FEE_REFERENCE[cls]?.boarding && (
                              <span className="text-xs text-gray-500 block">
                                Ref:{" "}
                                {formatUGX(BURSER_FEE_REFERENCE[cls].boarding!)}
                              </span>
                            )}
                          </td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`boarding_${cls}_expected`}
                              value={
                                weeklyReport[`boarding_${cls}_expected`] || ""
                              }
                              onChange={handleInputChange}
                            />
                          </td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`boarding_${cls}_received`}
                              value={
                                weeklyReport[`boarding_${cls}_received`] || ""
                              }
                              onChange={handleInputChange}
                            />
                          </td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`boarding_${cls}_balance`}
                              value={
                                weeklyReport[`boarding_${cls}_balance`] || ""
                              }
                              onChange={handleInputChange}
                            />
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td className="border px-2 py-1 font-semibold">
                          TOTAL
                        </td>
                        <td className="border px-2 py-1">
                          <Input
                            name="boarding_total_expected"
                            value={weeklyReport.boarding_total_expected || ""}
                            onChange={handleInputChange}
                          />
                        </td>
                        <td className="border px-2 py-1">
                          <Input
                            name="boarding_total_received"
                            value={weeklyReport.boarding_total_received || ""}
                            onChange={handleInputChange}
                          />
                        </td>
                        <td className="border px-2 py-1">
                          <Input
                            name="boarding_total_balance"
                            value={weeklyReport.boarding_total_balance || ""}
                            onChange={handleInputChange}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* DAY SECTION */}
                <div>
                  <h3 className="font-semibold mb-2">
                    SCHOOL FEES — DAY SECTION
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      (Baby/Top: {formatUGX(FEE_STRUCTURE.day_baby_top)} ·
                      P1–P3: {formatUGX(FEE_STRUCTURE.day_p1_p3)})
                    </span>
                  </h3>
                  <table className="w-full table-auto border-collapse">
                    <thead>
                      <tr className="text-left">
                        <th className="border px-2 py-1">CLASS</th>
                        <th className="border px-2 py-1">EXPECTED</th>
                        <th className="border px-2 py-1">RECEIVED</th>
                        <th className="border px-2 py-1">BALANCE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        "BABY",
                        "TOP",
                        "P.1",
                        "P.2",
                        "P.3",
                        "P.4",
                        "P.5",
                        "P.6",
                        "P.7",
                      ].map((cls) => (
                        <tr key={`day-${cls}`}>
                          <td className="border px-2 py-1">
                            {cls}
                            {BURSER_FEE_REFERENCE[cls]?.day && (
                              <span className="text-xs text-gray-500 block">
                                Ref: {formatUGX(BURSER_FEE_REFERENCE[cls].day!)}
                              </span>
                            )}
                          </td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`day_${cls}_expected`}
                              value={weeklyReport[`day_${cls}_expected`] || ""}
                              onChange={handleInputChange}
                            />
                          </td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`day_${cls}_received`}
                              value={weeklyReport[`day_${cls}_received`] || ""}
                              onChange={handleInputChange}
                            />
                          </td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`day_${cls}_balance`}
                              value={weeklyReport[`day_${cls}_balance`] || ""}
                              onChange={handleInputChange}
                            />
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td className="border px-2 py-1 font-semibold">
                          TOTAL
                        </td>
                        <td className="border px-2 py-1">
                          <Input
                            name="day_total_expected"
                            value={weeklyReport.day_total_expected || ""}
                            onChange={handleInputChange}
                          />
                        </td>
                        <td className="border px-2 py-1">
                          <Input
                            name="day_total_received"
                            value={weeklyReport.day_total_received || ""}
                            onChange={handleInputChange}
                          />
                        </td>
                        <td className="border px-2 py-1">
                          <Input
                            name="day_total_balance"
                            value={weeklyReport.day_total_balance || ""}
                            onChange={handleInputChange}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* BOOKS */}
                <div>
                  <h3 className="font-semibold mb-2">BOOKS</h3>
                  <table className="w-full table-auto border-collapse">
                    <thead>
                      <tr className="text-left">
                        <th className="border px-2 py-1">BOOKS</th>
                        <th className="border px-2 py-1">DISTRIBUTED</th>
                        <th className="border px-2 py-1">BALANCE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        "COUNTER BOOKS",
                        "CITY BOOKS",
                        "96 PAGED BOOKS",
                        "48 PAGED BOOKS",
                      ].map((b) => (
                        <tr key={`book-${b}`}>
                          <td className="border px-2 py-1">{b}</td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`book_${b}_distributed`}
                              value={
                                weeklyReport[`book_${b}_distributed`] || ""
                              }
                              onChange={handleInputChange}
                            />
                          </td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`book_${b}_balance`}
                              value={weeklyReport[`book_${b}_balance`] || ""}
                              onChange={handleInputChange}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* REQUIREMENTS — Boarding store items */}
                <div>
                  <h3 className="font-semibold mb-2">
                    STORE REQUIREMENTS — BOARDING
                    <span className="text-sm font-normal text-gray-500 ml-2 block mt-1">
                      Posho 20kgs · Beans 10kgs · Sugar 4kg · Gnuts 4kg ·
                      Tissues 4 Rolls · Broom 1 · Squeezer 1
                    </span>
                  </h3>
                  <table className="w-full table-auto border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="border px-2 py-1">CLASS</th>
                        <th className="border px-2 py-1">POSHO</th>
                        <th className="border px-2 py-1">BEANS</th>
                        <th className="border px-2 py-1">SUGAR</th>
                        <th className="border px-2 py-1">G/NUTS</th>
                        <th className="border px-2 py-1">T/P</th>
                        <th className="border px-2 py-1">BROOM</th>
                        <th className="border px-2 py-1">SQUEEZER</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        "BABY",
                        "TOP",
                        "P.1",
                        "P.2",
                        "P.3",
                        "P.4",
                        "P.5",
                        "P.6",
                        "P.7",
                      ].map((cls) => (
                        <tr key={`req-${cls}`}>
                          <td className="border px-2 py-1">{cls}</td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`req_${cls}_posho`}
                              value={weeklyReport[`req_${cls}_posho`] || ""}
                              onChange={handleInputChange}
                            />
                          </td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`req_${cls}_beans`}
                              value={weeklyReport[`req_${cls}_beans`] || ""}
                              onChange={handleInputChange}
                            />
                          </td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`req_${cls}_sugar`}
                              value={weeklyReport[`req_${cls}_sugar`] || ""}
                              onChange={handleInputChange}
                            />
                          </td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`req_${cls}_gnuts`}
                              value={weeklyReport[`req_${cls}_gnuts`] || ""}
                              onChange={handleInputChange}
                            />
                          </td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`req_${cls}_tp`}
                              value={weeklyReport[`req_${cls}_tp`] || ""}
                              onChange={handleInputChange}
                            />
                          </td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`req_${cls}_broom`}
                              value={weeklyReport[`req_${cls}_broom`] || ""}
                              onChange={handleInputChange}
                            />
                          </td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`req_${cls}_squeezer`}
                              value={weeklyReport[`req_${cls}_squeezer`] || ""}
                              onChange={handleInputChange}
                            />
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td className="border px-2 py-1 font-semibold">
                          TOTAL
                        </td>
                        <td className="border px-2 py-1">
                          <Input
                            name="req_total_posho"
                            value={weeklyReport.req_total_posho || ""}
                            onChange={handleInputChange}
                          />
                        </td>
                        <td className="border px-2 py-1">
                          <Input
                            name="req_total_beans"
                            value={weeklyReport.req_total_beans || ""}
                            onChange={handleInputChange}
                          />
                        </td>
                        <td className="border px-2 py-1">
                          <Input
                            name="req_total_sugar"
                            value={weeklyReport.req_total_sugar || ""}
                            onChange={handleInputChange}
                          />
                        </td>
                        <td className="border px-2 py-1">
                          <Input
                            name="req_total_gnuts"
                            value={weeklyReport.req_total_gnuts || ""}
                            onChange={handleInputChange}
                          />
                        </td>
                        <td className="border px-2 py-1">
                          <Input
                            name="req_total_tp"
                            value={weeklyReport.req_total_tp || ""}
                            onChange={handleInputChange}
                          />
                        </td>
                        <td className="border px-2 py-1">
                          <Input
                            name="req_total_broom"
                            value={weeklyReport.req_total_broom || ""}
                            onChange={handleInputChange}
                          />
                        </td>
                        <td className="border px-2 py-1">
                          <Input
                            name="req_total_squeezer"
                            value={weeklyReport.req_total_squeezer || ""}
                            onChange={handleInputChange}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* DAY STORE REQUIREMENTS */}
                <div>
                  <h3 className="font-semibold mb-2">
                    STORE REQUIREMENTS — DAY SECTION
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      (Sugar 2kgs · Tissues 2 Rolls)
                    </span>
                  </h3>
                  <table className="w-full table-auto border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="border px-2 py-1">CLASS</th>
                        <th className="border px-2 py-1">SUGAR</th>
                        <th className="border px-2 py-1">TISSUES</th>
                        <th className="border px-2 py-1">RECEIVED</th>
                        <th className="border px-2 py-1">BALANCE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        "BABY",
                        "TOP",
                        "P.1",
                        "P.2",
                        "P.3",
                        "P.4",
                        "P.5",
                        "P.6",
                        "P.7",
                      ].map((cls) => (
                        <tr key={`dayreq-${cls}`}>
                          <td className="border px-2 py-1">{cls}</td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`dayreq_${cls}_sugar`}
                              value={weeklyReport[`dayreq_${cls}_sugar`] || ""}
                              onChange={handleInputChange}
                            />
                          </td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`dayreq_${cls}_tissues`}
                              value={
                                weeklyReport[`dayreq_${cls}_tissues`] || ""
                              }
                              onChange={handleInputChange}
                            />
                          </td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`dayreq_${cls}_received`}
                              value={
                                weeklyReport[`dayreq_${cls}_received`] || ""
                              }
                              onChange={handleInputChange}
                            />
                          </td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`dayreq_${cls}_balance`}
                              value={
                                weeklyReport[`dayreq_${cls}_balance`] || ""
                              }
                              onChange={handleInputChange}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* OTHER REQUIREMENTS */}
                <div>
                  <h3 className="font-semibold mb-2">OTHER REQUIREMENTS</h3>
                  <table className="w-full table-auto border-collapse">
                    <thead>
                      <tr>
                        <th className="border px-2 py-1">REQUIREMENT</th>
                        <th className="border px-2 py-1">EXPECTED</th>
                        <th className="border px-2 py-1">RECEIVED</th>
                        <th className="border px-2 py-1">BALANCE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        "MEDICAL INSURANCE",
                        "HOLIDAY PACKAGE",
                        "HAIR SHAVING",
                        "CHURCH TITHE",
                        "LUNCH",
                        "OTHER",
                      ].map((it) => (
                        <tr key={`other-${it}`}>
                          <td className="border px-2 py-1">{it}</td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`other_${it}_expected`}
                              value={weeklyReport[`other_${it}_expected`] || ""}
                              onChange={handleInputChange}
                            />
                          </td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`other_${it}_received`}
                              value={weeklyReport[`other_${it}_received`] || ""}
                              onChange={handleInputChange}
                            />
                          </td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`other_${it}_balance`}
                              value={weeklyReport[`other_${it}_balance`] || ""}
                              onChange={handleInputChange}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* UNIFORMS */}
                <div>
                  <h3 className="font-semibold mb-2">UNIFORMS</h3>
                  <table className="w-full table-auto border-collapse">
                    <thead>
                      <tr>
                        <th className="border px-2 py-1">UNIFORM</th>
                        <th className="border px-2 py-1">RECEIVED</th>
                        <th className="border px-2 py-1">ISSUED</th>
                        <th className="border px-2 py-1">BALANCE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        "SCHOOL SHORTS",
                        "SCHOOL SHIRTS",
                        "JUMPERS",
                        "WHITE SHIRTS",
                        "CASUAL DRESSES",
                        "CASUAL SHIRTS",
                        "CASUAL SHORTS",
                        "SUNDAY DRESSES",
                        "SUNDAY SHIRTS",
                        "SWEATERS",
                        "SPORTS SHORTS",
                        "SPORTS SHIRTS",
                        "NURSERY DRESSES",
                      ].map((u) => (
                        <tr key={`uniform-${u}`}>
                          <td className="border px-2 py-1">{u}</td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`uniform_${u}_received`}
                              value={
                                weeklyReport[`uniform_${u}_received`] || ""
                              }
                              onChange={handleInputChange}
                            />
                          </td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`uniform_${u}_issued`}
                              value={weeklyReport[`uniform_${u}_issued`] || ""}
                              onChange={handleInputChange}
                            />
                          </td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`uniform_${u}_balance`}
                              value={weeklyReport[`uniform_${u}_balance`] || ""}
                              onChange={handleInputChange}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* STORE CHECKLIST */}
                <div>
                  <h3 className="font-semibold mb-2">STORE CHECKLIST</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2 text-primary">
                        Boarding Section
                      </h4>
                      <ul className="text-sm space-y-1">
                        {BOARDING_STORE_REQUIREMENTS.map((r) => (
                          <li key={r.id} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            {r.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2 text-primary">
                        Day Section
                      </h4>
                      <ul className="text-sm space-y-1">
                        {DAY_STORE_REQUIREMENTS.map((r) => (
                          <li key={r.id} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            {r.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Input
                      key={`store-${i}`}
                      name={`store_row_${i}`}
                      value={weeklyReport[`store_row_${i}`] || ""}
                      onChange={handleInputChange}
                      className="mb-2"
                      placeholder={`Store note ${i + 1}`}
                    />
                  ))}
                </div>

                {/* WEEKLY EXPENDITURE */}
                <div>
                  <h3 className="font-semibold mb-2">WEEKLY EXPENDITURE</h3>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={`ex-${i}`} className="flex gap-2 mb-2">
                      <Input
                        name={`ex_item_${i}`}
                        value={weeklyReport[`ex_item_${i}`] || ""}
                        onChange={handleInputChange}
                        placeholder="ITEM"
                      />
                      <Input
                        name={`ex_amount_${i}`}
                        value={weeklyReport[`ex_amount_${i}`] || ""}
                        onChange={handleInputChange}
                        placeholder="AMOUNT"
                      />
                    </div>
                  ))}
                </div>

                {/* BUDGET FOR INCOMING WEEK */}
                <div>
                  <h3 className="font-semibold mb-2">
                    BUDGET FOR INCOMING WEEK
                  </h3>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={`bud-${i}`} className="flex gap-2 mb-2">
                      <Input
                        name={`bud_item_${i}`}
                        value={weeklyReport[`bud_item_${i}`] || ""}
                        onChange={handleInputChange}
                        placeholder="ITEM"
                      />
                      <Input
                        name={`bud_amount_${i}`}
                        value={weeklyReport[`bud_amount_${i}`] || ""}
                        onChange={handleInputChange}
                        placeholder="AMOUNT"
                      />
                    </div>
                  ))}
                </div>

                {/* RECOMMENDATIONS */}
                <div>
                  <h3 className="font-semibold mb-2">RECOMMENDATIONS</h3>
                  <textarea
                    name="recommendations"
                    value={weeklyReport.recommendations || ""}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2 h-24"
                  />
                </div>

                {/* PREPARED / APPROVED */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">PREPARED BY</p>
                    <Input
                      name="prepared_by"
                      value={weeklyReport.prepared_by || ""}
                      onChange={handleInputChange}
                    />
                    <div className="flex gap-2 mt-2">
                      <Input
                        name="prepared_sign"
                        value={weeklyReport.prepared_sign || ""}
                        onChange={handleInputChange}
                        placeholder="SIGN"
                      />
                      <Input
                        name="prepared_date"
                        value={weeklyReport.prepared_date || ""}
                        onChange={handleInputChange}
                        placeholder="DATE"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">APPROVED BY</p>
                    <Input
                      name="approved_by"
                      value={weeklyReport.approved_by || ""}
                      onChange={handleInputChange}
                    />
                    <div className="flex gap-2 mt-2">
                      <Input
                        name="approved_sign"
                        value={weeklyReport.approved_sign || ""}
                        onChange={handleInputChange}
                        placeholder="SIGN"
                      />
                      <Input
                        name="approved_date"
                        value={weeklyReport.approved_date || ""}
                        onChange={handleInputChange}
                        placeholder="DATE"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case "settings":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h3 className="text-lg font-semibold mb-6">Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border-b">
                  <div>
                    <p className="font-medium">Balance Visibility</p>
                    <p className="text-sm text-gray-600">
                      Show/hide balance amounts
                    </p>
                  </div>
                  <button
                    onClick={() => setBalanceVisible(!balanceVisible)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {balanceVisible ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="bg-[#800020] text-white shadow-xl overflow-hidden"
      >
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">Burser</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className="space-y-2 px-3 py-6">
          {[
            { id: "overview", icon: Home, label: "Overview" },
            { id: "students", icon: Users, label: "Students" },
            { id: "payments", icon: CreditCard, label: "Payments" },
            { id: "reports", icon: FileText, label: "Reports" },
            {
              id: "finances",
              icon: DollarSign,
              label: "Finances",
              route: "/burser/finances",
            },
            { id: "settings", icon: Settings, label: "Settings" },
          ].map((item) => (
            <motion.button
              key={item.id}
              onClick={() => {
                if (item.route) {
                  navigate(item.route);
                } else {
                  setActiveTab(item.id as any);
                }
              }}
              whileHover={{ x: 5 }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? "bg-white/20 border-l-4 border-white"
                  : "hover:bg-white/10"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </motion.button>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/20">
            <button
              onClick={async () => {
                try {
                  await authContext?.signOut?.();
                  toast.success("Logged out successfully");
                  navigate("/login");
                } catch (error) {
                  toast.error("Failed to logout");
                  console.error("Logout error:", error);
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        )}
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {activeTab === "overview" && "Dashboard"}
                {activeTab === "students" && "Registered Students"}
                {activeTab === "payments" && "Payment Records"}
                {activeTab === "reports" && "Reports"}
                {activeTab === "settings" && "Settings"}
              </h1>
              <p className="text-gray-600 mt-1">Welcome back, Burser</p>
            </div>
            {activeTab === "overview" && (
              <button
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {balanceVisible ? (
                  <Eye className="w-6 h-6" />
                ) : (
                  <EyeOff className="w-6 h-6" />
                )}
              </button>
            )}
          </div>

          {renderContent()}

          <AlertDialog
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
          >
            <AlertDialogContent className="sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive">
                  Delete Payment
                </AlertDialogTitle>
                <AlertDialogDescription className="mt-3">
                  Are you sure you want to delete this payment record? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex justify-end gap-3 mt-6">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeletePayment}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  );
};

export default BurserDashboard;
