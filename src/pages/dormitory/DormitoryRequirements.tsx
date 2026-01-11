import PageHeader from '@/components/dashboard/PageHeader';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useDormitories, useUpdateDormitory, useStudents } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Users, BarChart3, Home, Edit2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface DormRequirements {
  id: string;
  dormitory_name: string;
  dormitory_type: 'boys' | 'girls';
  capacity: number;
  current_occupancy: number;
  location: string;
  boys_count: number;
  girls_count: number;
  empty_beds: number;
}

export default function DormitoryRequirements() {
  const { data: dormitories = [], isLoading: dormsLoading } = useDormitories();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const updateDorm = useUpdateDormitory();
  const { user } = useAuth();

  const [selectedDormId, setSelectedDormId] = useState<string | null>(null);
  const [editingCapacity, setEditingCapacity] = useState<string | null>(null);
  const [newCapacity, setNewCapacity] = useState('');

  const isLoading = dormsLoading || studentsLoading;
  const canManage = user && (user.role === 'admin' || user.role === 'dormitory' || user.role === 'headteacher');

  // Enhance dormitory data with student counts
  const dormitoryRequirements: DormRequirements[] = useMemo(() => {
    return (dormitories || []).map((d: any) => {
      const dormStudents = (students || []).filter((s: any) => s.dormitory_id === (d.id || d._id));
      const boysCount = dormStudents.filter((s: any) => s.gender === 'male').length;
      const girlsCount = dormStudents.filter((s: any) => s.gender === 'female').length;

      return {
        id: d.id || d._id,
        dormitory_name: d.dormitory_name,
        dormitory_type: d.dormitory_type || 'boys',
        capacity: d.capacity || 0,
        current_occupancy: d.current_occupancy || dormStudents.length,
        location: d.location || 'Not specified',
        boys_count: boysCount,
        girls_count: girlsCount,
        empty_beds: Math.max(0, (d.capacity || 0) - dormStudents.length),
      };
    });
  }, [dormitories, students]);

  const selectedDorm = dormitoryRequirements.find((d) => d.id === selectedDormId);

  // Prepare chart data
  const occupancyChartData = useMemo(() => {
    return dormitoryRequirements.map((d) => ({
      name: d.dormitory_name,
      occupied: d.current_occupancy,
      available: d.empty_beds,
    }));
  }, [dormitoryRequirements]);

  const genderChartData = useMemo(() => {
    if (!selectedDorm) return [];
    return [
      { name: 'Boys', value: selectedDorm.boys_count, color: '#3b82f6' },
      { name: 'Girls', value: selectedDorm.girls_count, color: '#ec4899' },
    ];
  }, [selectedDorm]);

  const handleUpdateCapacity = () => {
    if (!selectedDormId || !newCapacity || !canManage) return;
    const capacity = parseInt(newCapacity, 10);
    if (capacity <= 0) return;

    updateDorm.mutate({
      id: selectedDormId,
      updates: { capacity },
    });

    setEditingCapacity(null);
    setNewCapacity('');
  };

  const handleEditClick = (dormId: string, currentCapacity: number) => {
    setEditingCapacity(dormId);
    setNewCapacity(currentCapacity.toString());
  };

  return (
    <DashboardLayout>
      <PageHeader 
        title="Dormitory Requirements" 
        description="Manage dormitory capacity, beds, and student distribution"
        icon={Home}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Summary Stats */}
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))
        ) : selectedDorm ? (
          <>
            <motion.div 
              className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Capacity</p>
                  <p className="text-3xl font-bold mt-2">{selectedDorm.capacity}</p>
                </div>
                <Home className="w-10 h-10 text-primary opacity-20" />
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
                  <p className="text-xs font-medium text-green-700 dark:text-green-400 uppercase tracking-wide">Occupied</p>
                  <p className="text-3xl font-bold mt-2 text-green-700 dark:text-green-400">
                    {selectedDorm.current_occupancy}
                  </p>
                </div>
                <Users className="w-10 h-10 text-green-500 opacity-20" />
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-2xl p-6 border border-blue-500/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wide">Empty Beds</p>
                  <p className="text-3xl font-bold mt-2 text-blue-700 dark:text-blue-400">
                    {selectedDorm.empty_beds}
                  </p>
                </div>
                <BarChart3 className="w-10 h-10 text-blue-500 opacity-20" />
              </div>
            </motion.div>
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Occupancy Chart */}
          {occupancyChartData.length > 0 && (
            <motion.div 
              className="bg-card rounded-2xl p-6 border border-border shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-semibold mb-6">Overall Occupancy</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--muted-foreground)" opacity={0.2} />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }} />
                    <Legend />
                    <Bar dataKey="occupied" fill="#10b981" name="Occupied Beds" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="available" fill="#3b82f6" name="Available Beds" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Gender Distribution */}
          {selectedDorm && genderChartData.length > 0 && (
            <motion.div 
              className="bg-card rounded-2xl p-6 border border-border shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-semibold mb-6">Gender Distribution</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        dataKey="value"
                        data={genderChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        label={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                      >
                        {genderChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center space-y-3">
                  <motion.div 
                    className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase">Male Students</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                      {selectedDorm.boys_count}
                    </p>
                  </motion.div>
                  <motion.div 
                    className="p-4 bg-gradient-to-br from-pink-500/10 to-pink-500/5 rounded-xl border border-pink-500/20"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <p className="text-xs font-medium text-pink-700 dark:text-pink-400 uppercase">Female Students</p>
                    <p className="text-3xl font-bold text-pink-600 dark:text-pink-400 mt-2">
                      {selectedDorm.girls_count}
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm h-fit sticky top-24">
          <h3 className="text-lg font-semibold mb-4">Dormitories</h3>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : dormitoryRequirements.length === 0 ? (
            <div className="text-center py-8">
              <Home className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No dormitories available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dormitoryRequirements.map((dorm, idx) => (
                <motion.button
                  key={dorm.id}
                  onClick={() => setSelectedDormId(dorm.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedDormId === dorm.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                      : 'bg-muted/50 border-border hover:border-primary hover:bg-muted'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="font-semibold text-sm">{dorm.dormitory_name}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {dorm.current_occupancy} / {dorm.capacity} occupied
                  </div>
                  <div className="text-xs opacity-60 mt-0.5">
                    B:{dorm.boys_count} • G:{dorm.girls_count}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bed Management Section */}
      {selectedDorm && (
        <motion.div 
          className="bg-card rounded-2xl p-6 border border-border shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">{selectedDorm.dormitory_name} - Bed Management</h3>
              <p className="text-xs text-muted-foreground mt-1">{selectedDorm.location}</p>
            </div>
            {canManage && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    size="sm"
                    onClick={() => handleEditClick(selectedDorm.id, selectedDorm.capacity)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Update Capacity
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Dormitory Capacity</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-semibold text-sm">{selectedDorm.dormitory_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{selectedDorm.location}</p>
                    </div>
                    <div>
                      <Label className="mb-3 block text-sm font-semibold">Total Beds</Label>
                      <Input
                        type="number"
                        min="1"
                        value={newCapacity}
                        onChange={(e) => setNewCapacity(e.target.value)}
                        placeholder="Enter number of beds"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Current occupancy: {selectedDorm.current_occupancy} students (B:{selectedDorm.boys_count} • G:{selectedDorm.girls_count})
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleUpdateCapacity}
                      disabled={!canManage || updateDorm.isPending || !newCapacity}
                      className="w-full"
                    >
                      {updateDorm.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {updateDorm.isPending ? 'Updating...' : 'Update'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <motion.div 
              className="p-4 bg-muted/50 rounded-xl border border-border"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-xs font-medium text-muted-foreground uppercase">Total Beds</p>
              <p className="text-3xl font-bold mt-2">{selectedDorm.capacity}</p>
            </motion.div>
            <motion.div 
              className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl border border-green-500/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <p className="text-xs font-medium text-green-700 dark:text-green-400 uppercase">Occupied</p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-400 mt-2">
                {selectedDorm.current_occupancy}
              </p>
            </motion.div>
            <motion.div 
              className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase">Available</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400 mt-2">
                {selectedDorm.empty_beds}
              </p>
            </motion.div>
            <motion.div 
              className="p-4 bg-muted/50 rounded-xl border border-border"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <p className="text-xs font-medium text-muted-foreground uppercase">Occupancy %</p>
              <p className="text-3xl font-bold mt-2">
                {Math.round((selectedDorm.current_occupancy / Math.max(1, selectedDorm.capacity)) * 100)}%
              </p>
            </motion.div>
          </div>

          {/* Capacity Bar */}
          <div>
            <div className="flex justify-between mb-3">
              <span className="text-sm font-semibold">Capacity Status</span>
              <span className="text-sm text-muted-foreground">
                {selectedDorm.current_occupancy} of {selectedDorm.capacity} beds
              </span>
            </div>
            <div className="relative h-6 bg-muted rounded-full overflow-hidden border border-border">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (selectedDorm.current_occupancy / Math.max(1, selectedDorm.capacity)) * 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
