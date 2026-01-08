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
} from "lucide-react";
import { useFees, useStudents } from "@/hooks/useDatabase";
import { formatUGX } from "@/lib/utils";
import { exportToExcel, exportMultipleSheets, formatDataForExport } from "@/lib/exportToExcel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DataTable from "@/components/dashboard/DataTable";
import StatCard from "@/components/dashboard/StatCard";
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
import { useCreateFee, useDeleteFee } from "@/hooks/useDatabase";

const getCurrentAcademicYear = () => {
  const y = new Date().getFullYear();
  return `${y}/${y + 1}`;
};

const BurserDashboard = () => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<
    "overview" | "payments" | "reports" | "settings"
  >("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);

  const { data: fees = [] } = useFees();
  const { data: students = [] } = useStudents();
  const createFee = useCreateFee();
  const deleteFee = useDeleteFee();

  const [newPayment, setNewPayment] = useState({
    student_id: "",
    amount: "",
    term: "",
    academic_year: "",
    payment_status: "paid",
    due_date: "",
  });

  // Calculate  statistics
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
      const date = new Date(fee.created_at);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
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
    return fees
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 15)
      .map((fee) => {
        const student = students.find((s) => s.id === fee.student_id);
        return {
          id: fee.id,
          student: student
            ? `${student.first_name} ${student.last_name}`
            : "Unknown",
          amount: fee.amount,
          term: fee.term,
          status: fee.payment_status,
          date: new Date(fee.created_at).toLocaleDateString(),
          dueDate: new Date(fee.due_date).toLocaleDateString(),
        };
      });
  }, [fees, students]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return recentTransactions.filter(
      (t) =>
        searchQuery === "" ||
        t.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.term.toLowerCase().includes(searchQuery.toLowerCase())
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
    }
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target as any;
    setWeeklyReport((prev) => ({ ...prev, [name]: value }));
  };

  const saveReport = () => {
    try {
      localStorage.setItem(
        "burser_weekly_report",
        JSON.stringify(weeklyReport)
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
      `<html><head><title>Burser Weekly Report</title><meta charset="utf-8"></head><body>`
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target as any;
    setNewPayment((prev) => ({ ...prev, [name]: value }));
  };

  const submitNewPayment = async () => {
    if (!newPayment.student_id || !newPayment.amount) {
      return toast.error("Please select a student and enter an amount");
    }
    try {
      await createFee.mutateAsync({
        student_id: newPayment.student_id,
        amount: Number(newPayment.amount),
        term: newPayment.term || "N/A",
        academic_year: newPayment.academic_year || getCurrentAcademicYear(),
        payment_status: newPayment.payment_status as
          | "paid"
          | "pending"
          | "overdue",
        due_date: newPayment.due_date || new Date().toISOString(),
      });
      toast.success("Payment recorded");
      setNewPayment({
        student_id: "",
        amount: "",
        term: "",
        academic_year: "",
        payment_status: "paid",
        due_date: "",
      });
    } catch (err) {
      toast.error("Failed to record payment");
    }
  };

  const handleDeletePayment = async (row: any) => {
    if (!window.confirm("Delete this payment?")) return;
    try {
      await deleteFee.mutateAsync(String(row.id));
      toast.success("Payment deleted");
    } catch {
      toast.error("Failed to delete payment");
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
                  const overviewData = [{
                    'Metric': 'Total Collected',
                    'Value (UGX)': stats.totalCollected,
                    'Collection Rate (%)': stats.collectionRate,
                  }, {
                    'Metric': 'Pending Fees',
                    'Value (UGX)': stats.totalPending,
                    'Count': stats.pendingCount,
                  }, {
                    'Metric': 'Overdue Fees',
                    'Value (UGX)': stats.totalOverdue,
                    'Count': stats.overdueCount,
                  }, {
                    'Metric': 'Expected Revenue',
                    'Value (UGX)': stats.totalExpected,
                    'Records': fees.length,
                  }];
                  exportToExcel(overviewData, 'Finance_Overview');
                  toast.success('Finance overview exported to Excel');
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
                      'Rank': i + 1,
                      'Student Name': s.name,
                      'Total Paid (UGX)': s.amount,
                    }));
                    exportToExcel(exportData, 'Top_Paying_Students');
                    toast.success('Top paying students exported to Excel');
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
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
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
                    const exportData = filteredTransactions.map(t => ({
                      'Student Name': t.student,
                      'Term': t.term,
                      'Amount (UGX)': t.amount,
                      'Status': t.status,
                      'Due Date': t.dueDate,
                      'Date': t.date,
                    }));
                    exportToExcel(exportData, 'Payment_Records');
                    toast.success('Payment records exported to Excel');
                  }}
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>

              <DataTable
                columns={[
                  { key: "student", label: "Student Name" },
                  { key: "term", label: "Term" },
                  {
                    key: "amount",
                    label: "Amount",
                    render: (value: number) => formatUGX(value),
                  },
                  {
                    key: "status",
                    label: "Status",
                    render: (value: string) => (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          value === "paid"
                            ? "bg-success/10 text-success"
                            : value === "pending"
                            ? "bg-warning/10 text-warning"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </span>
                    ),
                  },
                  { key: "dueDate", label: "Due Date" },
                  { key: "date", label: "Date" },
                ]}
                data={filteredTransactions}
                onDelete={(row) => handleDeletePayment(row)}
              />
            </div>

            {/* Add Payment */}
            <div className="flex gap-2 mb-4 items-end">
              <select
                name="student_id"
                value={newPayment.student_id}
                onChange={handleNewPaymentChange}
                className="border rounded px-2 py-1"
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
                value={newPayment.amount}
                onChange={handleNewPaymentChange}
                placeholder="Amount"
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
                className="border rounded px-2 py-1"
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
              <Input
                name="due_date"
                value={newPayment.due_date}
                onChange={handleNewPaymentChange}
                placeholder="Due date (YYYY-MM-DD)"
              />
              <Input
                name="academic_year"
                value={newPayment.academic_year}
                onChange={handleNewPaymentChange}
                placeholder="Academic year (e.g. 2025/2026)"
              />
              <Button onClick={submitNewPayment}>Add Payment</Button>
            </div>
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
                      const reportData = [{
                        'Report Type': 'Weekly Report',
                        'School': 'KIBAALE PARENTS PRIMARY SCHOOL',
                        'Date Generated': new Date().toLocaleDateString(),
                        'Prepared By': weeklyReport.prepared_by || 'N/A',
                        'Approved By': weeklyReport.approved_by || 'N/A',
                      }];
                      exportToExcel(reportData, 'Weekly_Report');
                      toast.success('Weekly report exported to Excel');
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
                          <td className="border px-2 py-1">{cls}</td>
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
                          <td className="border px-2 py-1">{cls}</td>
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

                {/* REQUIREMENTS */}
                <div>
                  <h3 className="font-semibold mb-2">REQUIREMENTS</h3>
                  <table className="w-full table-auto border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="border px-2 py-1">CLASS</th>
                        <th className="border px-2 py-1">BEANS</th>
                        <th className="border px-2 py-1">FLOUR</th>
                        <th className="border px-2 py-1">SUGAR</th>
                        <th className="border px-2 py-1">G/NUTS</th>
                        <th className="border px-2 py-1">T/P</th>
                        <th className="border px-2 py-1">BROOMS</th>
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
                              name={`req_${cls}_beans`}
                              value={weeklyReport[`req_${cls}_beans`] || ""}
                              onChange={handleInputChange}
                            />
                          </td>
                          <td className="border px-2 py-1">
                            <Input
                              name={`req_${cls}_flour`}
                              value={weeklyReport[`req_${cls}_flour`] || ""}
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
                              name={`req_${cls}_brooms`}
                              value={weeklyReport[`req_${cls}_brooms`] || ""}
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
                            name="req_total_beans"
                            value={weeklyReport.req_total_beans || ""}
                            onChange={handleInputChange}
                          />
                        </td>
                        <td className="border px-2 py-1">
                          <Input
                            name="req_total_flour"
                            value={weeklyReport.req_total_flour || ""}
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
                            name="req_total_brooms"
                            value={weeklyReport.req_total_brooms || ""}
                            onChange={handleInputChange}
                          />
                        </td>
                      </tr>
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

                {/* STORE */}
                <div>
                  <h3 className="font-semibold mb-2">STORE</h3>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Input
                      key={`store-${i}`}
                      name={`store_row_${i}`}
                      value={weeklyReport[`store_row_${i}`] || ""}
                      onChange={handleInputChange}
                      className="mb-2"
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
        className="bg-red-900 text-white shadow-xl overflow-hidden"
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
            { id: "payments", icon: CreditCard, label: "Payments" },
            { id: "reports", icon: FileText, label: "Reports" },
            { id: "finances", icon: DollarSign, label: "Finances", route: "/burser/finances" },
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
        </div>
      </main>
    </div>
  );
};

export default BurserDashboard;
