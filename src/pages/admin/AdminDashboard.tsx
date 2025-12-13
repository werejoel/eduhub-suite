import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { motion } from "framer-motion";
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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const stats = [
  { title: "Total Students", value: "1,234", change: "+12% this month", changeType: "positive" as const, icon: Users, iconColor: "bg-primary" },
  { title: "Total Teachers", value: "86", change: "+3 new hires", changeType: "positive" as const, icon: GraduationCap, iconColor: "bg-success" },
  { title: "Fees Collected", value: "$45,230", change: "78% of target", changeType: "neutral" as const, icon: DollarSign, iconColor: "bg-secondary" },
  { title: "Dormitory", value: "456", change: "85% occupancy", changeType: "neutral" as const, icon: Building2, iconColor: "bg-warning" },
];

const recentStudents = [
  { id: "1", name: "Alice Johnson", class: "Grade 10A", admissionDate: "2024-01-15", status: "Active" },
  { id: "2", name: "Bob Smith", class: "Grade 9B", admissionDate: "2024-01-12", status: "Active" },
  { id: "3", name: "Carol Williams", class: "Grade 11A", admissionDate: "2024-01-10", status: "Active" },
  { id: "4", name: "David Brown", class: "Grade 8C", admissionDate: "2024-01-08", status: "Pending" },
  { id: "5", name: "Eva Martinez", class: "Grade 12A", admissionDate: "2024-01-05", status: "Active" },
];

const feeData = [
  { month: "Jan", collected: 12000 },
  { month: "Feb", collected: 15000 },
  { month: "Mar", collected: 18000 },
  { month: "Apr", collected: 14000 },
  { month: "May", collected: 22000 },
  { month: "Jun", collected: 25000 },
];

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
  return (
    <DashboardLayout role="admin" userName="Admin User">
      <PageHeader
        title="Admin Dashboard"
        description="Welcome back! Here's what's happening at your school."
        icon={TrendingUp}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
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
          <h3 className="text-lg font-semibold mb-4">Fee Collection Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={feeData}>
                <defs>
                  <linearGradient id="colorFee" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 22%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 22%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                <XAxis dataKey="month" stroke="hsl(215, 16%, 47%)" fontSize={12} />
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
              { label: "Add New Student", icon: Users, color: "bg-primary" },
              { label: "Record Payment", icon: DollarSign, color: "bg-success" },
              { label: "View Timetable", icon: Calendar, color: "bg-secondary" },
              { label: "Manage Store", icon: ShoppingCart, color: "bg-warning" },
            ].map((action) => (
              <button
                key={action.label}
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
      </div>

      {/* Recent Students Table */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Recent Admissions</h3>
        <DataTable
          columns={columns}
          data={recentStudents}
          onEdit={(row) => console.log("Edit", row)}
          onView={(row) => console.log("View", row)}
        />
      </div>
    </DashboardLayout>
  );
}
