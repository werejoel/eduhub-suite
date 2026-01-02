import PageHeader from '@/components/dashboard/PageHeader';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useStudents, useDormitories, useUpdateStudent } from '@/hooks/useDatabase';
import { useState } from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

export default function AssignStudents() {
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: dormitories = [], isLoading: loadingDorms } = useDormitories();
  const updateStudent = useUpdateStudent();
  const { user } = useAuth();

  const [query, setQuery] = useState('');
  const [selectedDorm, setSelectedDorm] = useState<string | null>(null);

  const canAssign = user && (user.role === 'admin' || user.role === 'dormitory');

  const filtered = (students || []).filter((s: any) => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    return name.includes(query.toLowerCase());
  });

  const handleAssign = (studentId: string) => {
    if (!canAssign || !selectedDorm) return;
    const bed = window.prompt('Enter bed number (optional)');
    const updates: any = { dormitory_id: selectedDorm };
    if (bed && bed.trim()) updates.bed_number = bed.trim();
    updateStudent.mutate({ id: studentId, updates });
  };

  return (
    <DashboardLayout>
      <PageHeader title="Assign Students" description="Assign students to dormitory rooms and beds" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Students</h3>
            <div className="w-64">
              <Input placeholder="Search students" value={query} onChange={(e:any)=>setQuery(e.target.value)} />
            </div>
          </div>

          {loadingStudents ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((s: any) => (
                <div key={s.id || s._id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{s.first_name} {s.last_name}</div>
                    <div className="text-xs text-muted-foreground">{s.gender} • {s.class_name || ''}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={()=>handleAssign(s.id || s._id)} disabled={!canAssign || !selectedDorm}>Assign</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-lg font-semibold mb-4">Assignment</h3>
          {!canAssign && <div className="text-sm text-muted-foreground mb-2">You do not have permission to assign students.</div>}
          <div className="space-y-3">
            <div>
              <Label>Select Dormitory</Label>
              <Select onValueChange={(v)=>setSelectedDorm(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose dormitory" />
                </SelectTrigger>
                <SelectContent>
                  {(dormitories || []).map((d:any)=> (
                    <SelectItem key={d.id||d._id} value={d.id||d._id}>{d.dormitory_name} ({d.capacity})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Selected Dorm</Label>
              <div className="text-sm">{(dormitories||[]).find((d:any)=> (d.id||d._id) === selectedDorm)?.dormitory_name || 'None'}</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
