import PageHeader from '@/components/dashboard/PageHeader';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useStudents, useDormitories, useUpdateStudent } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, AlertCircle, Heart, Clock, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StudentWithStatus {
  id: string;
  first_name: string;
  last_name: string;
  gender: 'male' | 'female';
  class_name?: string;
  bed_number?: string;
  dormitory_status?: 'present' | 'absent' | 'sick' | 'not-around';
}

export default function StudentStatus() {
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: dormitories = [], isLoading: dormsLoading } = useDormitories();
  const updateStudent = useUpdateStudent();
  const { user } = useAuth();

  const [selectedDormId, setSelectedDormId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStudent, setEditingStudent] = useState<StudentWithStatus | null>(null);
  const [newStatus, setNewStatus] = useState<'present' | 'absent' | 'sick' | 'not-around'>('present');

  const canManage = user && (user.role === 'admin' || user.role === 'dormitory' || user.role === 'headteacher');

  const isLoading = studentsLoading || dormsLoading;

  // Filter students by selected dormitory
  const dormitoryStudents = useMemo(() => {
    if (!selectedDormId) return [];
    const filtered = (students || [])
      .filter((s: any) => {
        const hasDormId = s.dormitory_id === selectedDormId;
        return hasDormId;
      })
      .map((s: any) => ({
        id: s.id || s._id,
        first_name: s.first_name,
        last_name: s.last_name,
        gender: s.gender,
        class_name: s.class_name,
        bed_number: s.bed_number,
        dormitory_status: s.dormitory_status || 'present',
      }));
    
    return filtered;
    return filtered;
  }, [students, selectedDormId]);

  // Filter by search query
  const filteredStudents = useMemo(() => {
    return dormitoryStudents.filter((s) =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [dormitoryStudents, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = dormitoryStudents.length;
    const present = dormitoryStudents.filter((s) => s.dormitory_status === 'present').length;
    const absent = dormitoryStudents.filter((s) => s.dormitory_status === 'absent').length;
    const sick = dormitoryStudents.filter((s) => s.dormitory_status === 'sick').length;
    const notAround = dormitoryStudents.filter((s) => s.dormitory_status === 'not-around').length;

    return { total, present, absent, sick, notAround };
  }, [dormitoryStudents]);

  // Status percentage for chart
  const statusChartData = useMemo(() => {
    if (stats.total === 0) return [];
    return [
      { name: 'Present', value: stats.present, percentage: ((stats.present / stats.total) * 100).toFixed(1) },
      { name: 'Sick', value: stats.sick, percentage: ((stats.sick / stats.total) * 100).toFixed(1) },
      { name: 'Absent', value: stats.absent, percentage: ((stats.absent / stats.total) * 100).toFixed(1) },
      { name: 'Not Around', value: stats.notAround, percentage: ((stats.notAround / stats.total) * 100).toFixed(1) },
    ];
  }, [stats]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'sick' | 'not-around') => {
    if (!canManage) return;
    updateStudent.mutate({ id: studentId, updates: { dormitory_status: status } });
    setEditingStudent(null);
  };

  const handleEditClick = (student: StudentWithStatus) => {
    setEditingStudent(student);
    setNewStatus(student.dormitory_status || 'present');
  };

  const statusColors: Record<string, { bg: string; text: string; border: string; darkBg: string }> = {
    present: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', darkBg: 'dark:bg-green-950' },
    absent: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', darkBg: 'dark:bg-red-950' },
    sick: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', darkBg: 'dark:bg-yellow-950' },
    'not-around': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', darkBg: 'dark:bg-blue-950' },
  };

  const statusIcons: Record<string, any> = {
    present: <Users className="w-4 h-4" />,
    absent: <AlertCircle className="w-4 h-4" />,
    sick: <Heart className="w-4 h-4" />,
    'not-around': <Clock className="w-4 h-4" />,
  };

  const statusLabels: Record<string, string> = {
    present: 'Present',
    absent: 'Absent',
    sick: 'Sick',
    'not-around': 'Not Around',
  };

  return (
    <DashboardLayout>
      <PageHeader 
        title="Student Status Tracking" 
        description="Monitor and manage student presence in dormitories"
        icon={Users}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))
        ) : (
          <>
            <motion.div 
              className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Students</p>
                  <p className="text-3xl font-bold mt-2">{selectedDormId ? stats.total : '-'}</p>
                </div>
                <Users className="w-10 h-10 text-primary opacity-20" />
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl p-6 border border-green-500/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700 dark:text-green-400 uppercase tracking-wide">Present</p>
                  <p className="text-3xl font-bold mt-2 text-green-700 dark:text-green-400">{selectedDormId ? stats.present : '-'}</p>
                </div>
                <Users className="w-10 h-10 text-green-500 opacity-20" />
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-2xl p-6 border border-yellow-500/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">Sick</p>
                  <p className="text-3xl font-bold mt-2 text-yellow-700 dark:text-yellow-400">{selectedDormId ? stats.sick : '-'}</p>
                </div>
                <Heart className="w-10 h-10 text-yellow-500 opacity-20" />
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-2xl p-6 border border-red-500/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-700 dark:text-red-400 uppercase tracking-wide">Absent</p>
                  <p className="text-3xl font-bold mt-2 text-red-700 dark:text-red-400">{selectedDormId ? stats.absent : '-'}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-red-500 opacity-20" />
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-2xl p-6 border border-blue-500/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wide">Not Around</p>
                  <p className="text-3xl font-bold mt-2 text-blue-700 dark:text-blue-400">{selectedDormId ? stats.notAround : '-'}</p>
                </div>
                <Clock className="w-10 h-10 text-blue-500 opacity-20" />
              </div>
            </motion.div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Chart */}
          {selectedDormId && !isLoading && statusChartData.length > 0 && (
            <motion.div 
              className="bg-card rounded-2xl p-6 border border-border shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-semibold mb-6">Status Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statusChartData.map((item) => (
                  <div key={item.name} className="text-center p-4 bg-muted/50 rounded-xl border border-border/50">
                    <p className="text-2xl font-bold text-primary">{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.name}</p>
                    <p className="text-sm font-semibold mt-1">{item.percentage}%</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Students List */}
          <motion.div 
            className="bg-card rounded-2xl p-6 border border-border shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Students</h3>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : !selectedDormId ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Select a dormitory to view students</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No students found matching your search' : 'No students assigned to this dormitory'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">Note: Students need to be assigned to this dormitory first</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredStudents.map((student, idx) => (
                    <motion.div
                      key={student.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border/50 hover:border-border hover:shadow-md transition-all group"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: idx * 0.02 }}
                      layout
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-sm">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                          <div>Bed {student.bed_number || 'N/A'} • {student.class_name}</div>
                          <div className="capitalize">{student.gender}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline"
                          className={`whitespace-nowrap flex items-center gap-1.5 ${statusColors[student.dormitory_status || 'present'].bg} ${statusColors[student.dormitory_status || 'present'].text} ${statusColors[student.dormitory_status || 'present'].border} border`}
                        >
                          {statusIcons[student.dormitory_status || 'present']}
                          {statusLabels[student.dormitory_status || 'present']}
                        </Badge>

                        {canManage && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditClick(student)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Update
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update Student Status</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="p-3 bg-muted rounded-lg">
                                  <p className="font-semibold text-sm">
                                    {editingStudent?.first_name} {editingStudent?.last_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Bed {editingStudent?.bed_number || 'N/A'} • {editingStudent?.class_name}
                                  </p>
                                </div>
                                <div>
                                  <Label className="mb-3 block text-sm font-semibold">Status</Label>
                                  <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="present">
                                        <span className="flex items-center gap-2">
                                          <Users className="w-4 h-4" /> Present
                                        </span>
                                      </SelectItem>
                                      <SelectItem value="absent">
                                        <span className="flex items-center gap-2">
                                          <AlertCircle className="w-4 h-4" /> Absent
                                        </span>
                                      </SelectItem>
                                      <SelectItem value="sick">
                                        <span className="flex items-center gap-2">
                                          <Heart className="w-4 h-4" /> Sick
                                        </span>
                                      </SelectItem>
                                      <SelectItem value="not-around">
                                        <span className="flex items-center gap-2">
                                          <Clock className="w-4 h-4" /> Not Around
                                        </span>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={() =>
                                    editingStudent && handleStatusChange(editingStudent.id, newStatus)
                                  }
                                  disabled={!canManage || updateStudent.isPending}
                                  className="w-full"
                                >
                                  {updateStudent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                  {updateStudent.isPending ? 'Updating...' : 'Update Status'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar - Dormitory Selection */}
        <motion.div 
          className="bg-card rounded-2xl p-6 border border-border shadow-sm h-fit sticky top-24"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="text-lg font-semibold mb-4">Dormitories</h3>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : dormitories.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No dormitories available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dormitories.map((dorm: any, idx: number) => (
                <motion.button
                  key={dorm.id || dorm._id}
                  onClick={() => setSelectedDormId(dorm.id || dorm._id)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                    selectedDormId === (dorm.id || dorm._id)
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                      : 'bg-muted/50 border-border hover:border-primary hover:bg-muted'
                  }`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="font-semibold text-sm">{dorm.dormitory_name}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {dorm.current_occupancy || 0} / {dorm.capacity} students
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
