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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Search, Filter, Plus, CheckCircle, Clock, AlertCircle, Loader } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import StatCard from "@/components/dashboard/StatCard";
import { useFees, useCreateFee, useUpdateFee } from "@/hooks/useDatabase";
import { useStudents } from "@/hooks/useDatabase";
import { Fee } from "@/lib/types";

const columns = [
  { key: "student_id", label: "Student ID" },
  { key: "amount", label: "Amount", render: (value: number) => `$${value.toLocaleString()}` },
  { key: "term", label: "Term" },
  { key: "academic_year", label: "Academic Year" },
  { key: "due_date", label: "Due Date" },
  {
    key: "payment_status",
    label: "Status",
    render: (value: string) => {
      const styles = {
        paid: "bg-success/10 text-success",
        pending: "bg-warning/10 text-warning",
        overdue: "bg-destructive/10 text-destructive",
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
  const { data: fees, isLoading } = useFees();
  const { data: students } = useStudents();
  const createMutation = useCreateFee();
  const updateMutation = useUpdateFee();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newFee, setNewFee] = useState({
    student_id: "",
    amount: 0,
    term: "",
    academic_year: "",
    due_date: "",
    payment_status: "pending" as const,
  });

  const filteredFees = (fees || []).filter((fee) => {
    const matchesSearch = searchQuery === "" || fee.student_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || fee.payment_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalCollected = (fees || [])
    .filter((f) => f.payment_status === "paid")
    .reduce((sum, f) => sum + f.amount, 0);
  const totalPending = (fees || [])
    .filter((f) => f.payment_status === "pending")
    .reduce((sum, f) => sum + f.amount, 0);
  const totalOverdue = (fees || [])
    .filter((f) => f.payment_status === "overdue")
    .reduce((sum, f) => sum + f.amount, 0);

  const handleAddFee = async () => {
    if (!newFee.student_id || newFee.amount <= 0 || !newFee.term || !newFee.academic_year || !newFee.due_date) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await createMutation.mutateAsync({
        student_id: newFee.student_id,
        amount: newFee.amount,
        term: newFee.term,
        academic_year: newFee.academic_year,
        due_date: newFee.due_date,
        payment_status: "pending",
      });
      setNewFee({
        student_id: "",
        amount: 0,
        term: "",
        academic_year: "",
        due_date: "",
        payment_status: "pending",
      });
      setDialogOpen(false);
    } catch (error) {
      console.error("Error creating fee:", error);
    }
  };

  const handleRecordPayment = async (fee: Fee) => {
    try {
      await updateMutation.mutateAsync({
        id: fee.id,
        updates: {
          payment_status: "paid",
          paid_date: new Date().toISOString().split("T")[0],
        },
      });
    } catch (error) {
      console.error("Error recording payment:", error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="admin" userName="Admin User">
        <div className="flex items-center justify-center h-screen">
          <Loader className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <PageHeader
        title="Fees Management"
        description="Track and manage student fee payments"
        icon={DollarSign}
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
              placeholder="Search by student..."
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
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Fee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Fee Record</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="student_id">Student</Label>
                  <select
                    id="student_id"
                    value={newFee.student_id}
                    onChange={(e) => setNewFee({ ...newFee, student_id: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md"
                  >
                    <option value="">Select a student</option>
                    {students?.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.first_name} {student.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="e.g., 5000"
                    value={newFee.amount}
                    onChange={(e) => setNewFee({ ...newFee, amount: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="term">Term</Label>
                  <Input
                    id="term"
                    placeholder="e.g., Term 1"
                    value={newFee.term}
                    onChange={(e) => setNewFee({ ...newFee, term: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="academic_year">Academic Year</Label>
                  <Input
                    id="academic_year"
                    placeholder="e.g., 2024"
                    value={newFee.academic_year}
                    onChange={(e) => setNewFee({ ...newFee, academic_year: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={newFee.due_date}
                    onChange={(e) => setNewFee({ ...newFee, due_date: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddFee} disabled={createMutation.isPending} className="w-full">
                  {createMutation.isPending ? "Creating..." : "Create Fee Record"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-6 shadow-md"
      >
        <DataTable
          columns={columns}
          data={(filteredFees || []).map((fee) => ({
            ...fee,
            actions:
              fee.payment_status !== "paid" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRecordPayment(fee)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              ) : null,
          }))}
          isLoading={isLoading}
        />
      </motion.div>
    </DashboardLayout>
  );
}
