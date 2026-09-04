import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { DollarSign, Loader, Search, Download } from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import { useFees, useStudents, useCreateFee, useUpdateFee, useDeleteFee } from "@/hooks/useDatabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { motion } from "framer-motion";
import { formatUGX } from "@/lib/utils";
import { exportToExcel } from "@/lib/exportToExcel";
import { toast } from "sonner";

const FinancesPage = () => {
  const { data: fees = [], isLoading } = useFees();
  const { data: students = [] } = useStudents();
  const createFee = useCreateFee();
  const updateFee = useUpdateFee();
  const deleteFee = useDeleteFee();

  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ student_id: '', amount: 0, term: '', academic_year: '', payment_status: 'pending', due_date: '' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any | null>(null);

  const studentById = (studentId: string) =>
    students.find((student) => String(student.id) === String(studentId));

  const financeRows = (fees || []).map((fee: any) => {
    const student = studentById(fee.student_id);
    return {
      ...fee,
      student_name: student
        ? `${student.first_name} ${student.last_name}`
        : "Unknown student",
      display_student_id: student?.admission_number || fee.student_id || "N/A",
    };
  });

  const columns = [
    { key: "display_student_id", label: "Student ID" },
    { key: "student_name", label: "Student Name" },
    { key: "amount", label: "Amount", render: (value: number) => formatUGX(value) },
    { key: "term", label: "Term" },
    { key: "academic_year", label: "Year" },
    {
      key: "payment_status",
      label: "Status",
      render: (value: string) => {
        const status = String(value || "pending").toLowerCase();
        const styles =
          status === "paid"
            ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
            : status === "pending"
              ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
              : "bg-rose-100 text-rose-700 ring-1 ring-rose-200";
        return (
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles}`}>
            {status}
          </span>
        );
      },
    },
    { key: "due_date", label: "Due" },
  ];

  const filtered = financeRows.filter((f: any) => {
    const q = searchQuery.toLowerCase();
    return f.display_student_id?.toLowerCase().includes(q) ||
      f.student_name?.toLowerCase().includes(q) ||
      f.academic_year?.toLowerCase().includes(q) ||
      f.term?.toLowerCase().includes(q);
  });

  const handleAdd = () => { setEditing(null); setForm({ student_id: '', amount: 0, term: '', academic_year: '', payment_status: 'pending', due_date: '' }); setDialogOpen(true); };
  const handleEdit = (row: any) => {
    setEditing(row);
    setForm({
      student_id: row.student_id || "",
      amount: row.amount || 0,
      term: row.term || "",
      academic_year: row.academic_year || "",
      payment_status: row.payment_status || "pending",
      due_date: row.due_date || "",
    });
    setDialogOpen(true);
  };
  const handleDelete = (row: any) => {
    setDeleteItem(row);
    setDeleteConfirmOpen(true);
  };
  const confirmDelete = async () => {
    if (deleteItem) {
      await deleteFee.mutateAsync(deleteItem.id || deleteItem._id);
      setDeleteConfirmOpen(false);
      setDeleteItem(null);
    }
  };
  const submit = async () => {
    if (!form.student_id || !form.amount) {
      toast.error("Select a student and enter an amount");
      return;
    }
    try {
      if (editing) {
        await updateFee.mutateAsync({
          id: editing.id || editing._id,
          updates: form,
        });
        toast.success("Finance record updated successfully");
      } else {
        await createFee.mutateAsync(form);
        toast.success("Finance record created successfully");
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Unable to save finance record");
    }
  };

  const totalRevenue = (fees || []).filter((f: any) => f.payment_status === 'paid').reduce((s: number, f: any) => s + (f.amount || 0), 0);

  return (
    <DashboardLayout>
      <PageHeader title="Finances" description="Financial overview, fee collection and budgeting" icon={DollarSign} action={{ label: 'Add Fee', onClick: handleAdd }} />

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-4 border border-border shadow-md mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search fees..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Button 
                className="gap-2"
                onClick={() => {
                  const exportData = filtered.map((f: any) => ({
                    'Student ID': f.display_student_id,
                    'Student Name': f.student_name,
                    'Amount (UGX)': f.amount,
                    'Term': f.term,
                    'Academic Year': f.academic_year,
                    'Status': f.payment_status,
                    'Due Date': f.due_date,
                  }));
                  exportToExcel(exportData, 'Finance_Records');
                  toast.success('Finance records exported to Excel');
                }}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              <div className="text-right">
                <div className="text-muted-foreground">Revenue collected</div>
                <div className="text-2xl font-bold">{formatUGX(totalRevenue)}</div>
              </div>
            </div>
          </motion.div>

          <DataTable columns={columns} data={filtered} onEdit={handleEdit} onDelete={handleDelete} />

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>{editing ? 'Edit Fee' : 'Add Fee'}</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Student</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}><option value="">Select student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.first_name} {student.last_name} ({student.admission_number})</option>)}</select></div>
                <div className="space-y-2"><Label>Amount</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
                <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Term</Label><Input value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} /></div><div className="space-y-2"><Label>Academic Year</Label><Input value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} /></div></div>
                <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={form.due_date?.split('T')[0] || ''} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
                <div className="space-y-2"><Label>Payment Status</Label><Input value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value })} /></div>
                <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={submit}>{editing ? 'Update' : 'Create'}</Button></div>
              </div>
            </DialogContent>
          </Dialog>

          <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <AlertDialogContent className="sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive">Delete Fee Record</AlertDialogTitle>
                <AlertDialogDescription className="mt-3">
                  Are you sure you want to delete this fee record for student {deleteItem?.student_name || deleteItem?.display_student_id}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex justify-end gap-3 mt-6">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </DashboardLayout>
  );
}
export default FinancesPage;
