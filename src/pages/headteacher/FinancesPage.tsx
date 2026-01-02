import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { DollarSign, Loader, Search } from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import { useFees, useCreateFee, useUpdateFee, useDeleteFee } from "@/hooks/useDatabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { motion } from "framer-motion";
import { formatUGX } from "@/lib/utils";

const columns = [
  { key: 'student_id', label: 'Student ID' },
  { key: 'amount', label: 'Amount' },
  { key: 'term', label: 'Term' },
  { key: 'academic_year', label: 'Year' },
  { key: 'payment_status', label: 'Status' },
  { key: 'due_date', label: 'Due' },
];

const FinancesPage = () => {
  const { data: fees = [], isLoading } = useFees();
  const createFee = useCreateFee();
  const updateFee = useUpdateFee();
  const deleteFee = useDeleteFee();

  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ student_id: '', amount: 0, term: '', academic_year: '', payment_status: 'pending', due_date: '' });

  const filtered = (fees || []).filter((f: any) => {
    const q = searchQuery.toLowerCase();
    return f.student_id?.toLowerCase().includes(q) || (f.academic_year || '').toLowerCase().includes(q) || (f.term || '').toLowerCase().includes(q);
  });

  const handleAdd = () => { setEditing(null); setForm({ student_id: '', amount: 0, term: '', academic_year: '', payment_status: 'pending', due_date: '' }); setDialogOpen(true); };
  const handleEdit = (row: any) => { setEditing(row); setForm({ ...row }); setDialogOpen(true); };
  const handleDelete = async (row: any) => { if (!window.confirm('Delete this fee record?')) return; await deleteFee.mutateAsync(row.id || row._id); };
  const submit = async () => { if (editing) { await updateFee.mutateAsync({ id: editing.id || editing._id, updates: form }); } else { await createFee.mutateAsync(form); } setDialogOpen(false); };

  const totalRevenue = (fees || []).filter((f: any) => f.payment_status === 'paid').reduce((s: number, f: any) => s + (f.amount || 0), 0);

  return (
    <DashboardLayout>
      <PageHeader title="Finances" description="Financial overview, fee collection and budgeting" icon={DollarSign} action={{ label: 'Add Fee', onClick: handleAdd }} />

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-4 border border-border shadow-md mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search fees..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
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
                <div className="space-y-2"><Label>Student ID</Label><Input value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} /></div>
                <div className="space-y-2"><Label>Amount</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
                <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Term</Label><Input value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} /></div><div className="space-y-2"><Label>Academic Year</Label><Input value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} /></div></div>
                <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={form.due_date?.split('T')[0] || ''} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
                <div className="space-y-2"><Label>Payment Status</Label><Input value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value })} /></div>
                <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={submit}>{editing ? 'Update' : 'Create'}</Button></div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
}
export default FinancesPage;
