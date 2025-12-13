import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Search, Filter, Plus, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import StatCard from "@/components/dashboard/StatCard";

interface FeeRecord {
  id: string;
  studentName: string;
  class: string;
  feeType: string;
  amount: number;
  dueDate: string;
  status: string;
  paidDate?: string;
}

const initialFees: FeeRecord[] = [
  { id: "1", studentName: "Alice Johnson", class: "Grade 10A", feeType: "Tuition", amount: 5000, dueDate: "2024-02-01", status: "Paid", paidDate: "2024-01-28" },
  { id: "2", studentName: "Bob Smith", class: "Grade 9B", feeType: "Tuition", amount: 4500, dueDate: "2024-02-01", status: "Pending" },
  { id: "3", studentName: "Carol Williams", class: "Grade 11A", feeType: "Hostel", amount: 3000, dueDate: "2024-02-01", status: "Paid", paidDate: "2024-01-25" },
  { id: "4", studentName: "David Brown", class: "Grade 8C", feeType: "Tuition", amount: 4000, dueDate: "2024-02-01", status: "Overdue" },
  { id: "5", studentName: "Eva Martinez", class: "Grade 12A", feeType: "Exam Fee", amount: 500, dueDate: "2024-02-15", status: "Pending" },
  { id: "6", studentName: "Frank Wilson", class: "Grade 10B", feeType: "Tuition", amount: 5000, dueDate: "2024-02-01", status: "Paid", paidDate: "2024-01-30" },
];

const columns = [
  { key: "studentName", label: "Student" },
  { key: "class", label: "Class" },
  { key: "feeType", label: "Fee Type" },
  {
    key: "amount",
    label: "Amount",
    render: (value: number) => `$${value.toLocaleString()}`,
  },
  { key: "dueDate", label: "Due Date" },
  {
    key: "status",
    label: "Status",
    render: (value: string) => {
      const styles = {
        Paid: "bg-success/10 text-success",
        Pending: "bg-warning/10 text-warning",
        Overdue: "bg-destructive/10 text-destructive",
      };
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[value as keyof typeof styles]}`}>
          {value}
        </span>
      );
    },
  },
];

export default function FeesPage() {
  const [fees, setFees] = useState<FeeRecord[]>(initialFees);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState<FeeRecord | null>(null);

  const filteredFees = fees.filter((fee) => {
    const matchesSearch = fee.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || fee.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalCollected = fees.filter((f) => f.status === "Paid").reduce((sum, f) => sum + f.amount, 0);
  const totalPending = fees.filter((f) => f.status === "Pending").reduce((sum, f) => sum + f.amount, 0);
  const totalOverdue = fees.filter((f) => f.status === "Overdue").reduce((sum, f) => sum + f.amount, 0);

  const handleRecordPayment = (fee: FeeRecord) => {
    setFees(
      fees.map((f) =>
        f.id === fee.id
          ? { ...f, status: "Paid", paidDate: new Date().toISOString().split("T")[0] }
          : f
      )
    );
    setPaymentDialog(null);
    toast.success("Payment recorded successfully");
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <PageHeader
        title="Fees Management"
        description="Track and manage student fee payments"
        icon={DollarSign}
        action={{
          label: "Add Fee Record",
          onClick: () => setDialogOpen(true),
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Collected"
          value={`$${totalCollected.toLocaleString()}`}
          icon={CheckCircle}
          iconColor="bg-success"
          delay={0}
        />
        <StatCard
          title="Pending Payments"
          value={`$${totalPending.toLocaleString()}`}
          icon={Clock}
          iconColor="bg-warning"
          delay={0.1}
        />
        <StatCard
          title="Overdue Payments"
          value={`$${totalOverdue.toLocaleString()}`}
          icon={AlertCircle}
          iconColor="bg-destructive"
          delay={0.2}
        />
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-4 border border-border shadow-md mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredFees}
        onEdit={(row) => row.status !== "Paid" && setPaymentDialog(row)}
        onView={(row) => toast.info(`Viewing ${row.studentName}'s fee record`)}
      />

      {/* Payment Dialog */}
      <Dialog open={!!paymentDialog} onOpenChange={() => setPaymentDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {paymentDialog && (
            <div className="py-4">
              <div className="bg-muted rounded-xl p-4 mb-4">
                <p className="text-sm text-muted-foreground">Student</p>
                <p className="font-semibold">{paymentDialog.studentName}</p>
                <p className="text-sm text-muted-foreground mt-2">Amount Due</p>
                <p className="text-2xl font-bold text-primary">${paymentDialog.amount.toLocaleString()}</p>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setPaymentDialog(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleRecordPayment(paymentDialog)} variant="success">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
