import { useState, useMemo } from 'react';
import { CreditCard, List, Plus, UserPlus, Search } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/dashboard/DataTable';
import StatCard from '@/components/dashboard/StatCard';
import PageHeader from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFees, useStudents, useClasses, useCreateStudent } from '@/hooks/useDatabase';
import { formatUGX } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const BurserDashboard = () => {
  const [query, setQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    date_of_birth: string;
    gender: 'male' | 'female';
    class_id: string;
    admission_number: string;
  }>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'male',
    class_id: '',
    admission_number: '',
  });

  const { data: fees = [], isLoading: feesLoading } = useFees();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: classes = [] } = useClasses();
  const createStudentMutation = useCreateStudent();

  // Calculate stats from fees data
  const totalCollected = useMemo(() => {
    return fees
      .filter(f => f.payment_status === 'paid')
      .reduce((sum, f) => sum + (f.amount || 0), 0);
  }, [fees]);

  const totalPending = useMemo(() => {
    return fees
      .filter(f => f.payment_status === 'pending')
      .reduce((sum, f) => sum + (f.amount || 0), 0);
  }, [fees]);

  // Use fees data for transactions display with student names
  const recent = useMemo(() => {
    return fees
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((fee) => {
        const student = students.find(s => s.id === fee.student_id);
        const studentName = student 
          ? `${student.first_name} ${student.last_name}` 
          : fee.student_id || '—';
        
        return {
          id: fee.id,
          student: studentName,
          amount: formatUGX(fee.amount, { decimals: 2 }),
          type: fee.payment_status,
          date: new Date(fee.created_at).toLocaleDateString(),
        };
      });
  }, [fees, students]);

  const handleAddStudent = async () => {
    if (!newStudent.first_name || !newStudent.last_name || !newStudent.email || !newStudent.class_id || !newStudent.admission_number) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      await createStudentMutation.mutateAsync({
        first_name: newStudent.first_name,
        last_name: newStudent.last_name,
        email: newStudent.email,
        phone: newStudent.phone,
        date_of_birth: newStudent.date_of_birth,
        gender: newStudent.gender,
        class_id: newStudent.class_id,
        admission_number: newStudent.admission_number,
        enrollment_date: new Date().toISOString(),
        status: 'active',
      });
      setNewStudent({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: 'male',
        class_id: '',
        admission_number: '',
      });
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Burser Dashboard"
        description="Manage fees, payments, and student registrations"
        icon={CreditCard}
        action={{
          label: 'Add Student',
          onClick: () => setDialogOpen(true),
        }}
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={CreditCard} title="Total Collected" value={formatUGX(totalCollected)} />
          <StatCard icon={List} title="Transactions" value={`${fees.length}`} />
          <StatCard icon={CreditCard} title="Pending Fees" value={formatUGX(totalPending)} />
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 border border-border shadow-md"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Filter by student or amount"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </motion.div>

        <DataTable
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'student', label: 'Student' },
            { key: 'amount', label: 'Amount (UGX)' },
            { key: 'type', label: 'Type', render: (value: string) => (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                value === 'paid' ? 'bg-success/10 text-success' :
                value === 'pending' ? 'bg-warning/10 text-warning' :
                'bg-destructive/10 text-destructive'
              }`}>
                {value}
              </span>
            )},
            { key: 'date', label: 'Date' },
          ]}
          data={recent.filter((r) =>
            query ? Object.values(r).join(' ').toLowerCase().includes(query.toLowerCase()) : true
          )}
          isLoading={feesLoading || studentsLoading}
          actions={false}
        />
      </div>

      {/* Add Student Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add New Student
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={newStudent.first_name}
                  onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={newStudent.last_name}
                  onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                placeholder="student@school.edu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admission">Admission Number *</Label>
              <Input
                id="admission"
                value={newStudent.admission_number}
                onChange={(e) => setNewStudent({ ...newStudent, admission_number: e.target.value })}
                placeholder="ADM-001"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">Class *</Label>
                <Select
                  value={newStudent.class_id}
                  onValueChange={(value) => setNewStudent({ ...newStudent, class_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={newStudent.gender}
                  onValueChange={(value) => setNewStudent({ ...newStudent, gender: value as 'male' | 'female' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={newStudent.date_of_birth}
                  onChange={(e) => setNewStudent({ ...newStudent, date_of_birth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                  placeholder="+256..."
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStudent} disabled={createStudentMutation.isPending}>
              {createStudentMutation.isPending ? 'Adding...' : 'Add Student'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default BurserDashboard;
