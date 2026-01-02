import PageHeader from '@/components/dashboard/PageHeader';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useDormitories, useCreateDormitory, useUpdateDormitory, useDeleteDormitory, useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom, exportAssignmentCsv } from '@/hooks/useDatabase';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

export default function DormitoryDetails() {
  const { data: dormitories = [], isLoading } = useDormitories();
  const createDorm = useCreateDormitory();
  const updateDorm = useUpdateDormitory();
  const deleteDorm = useDeleteDormitory();
  const { user } = useAuth();

  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ dormitory_name: '', capacity: 0 });

  const [selectedDormId, setSelectedDormId] = useState<string | null>(null);

  const { data: rooms = [] } = useRooms(selectedDormId || undefined);
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();

  const [roomForm, setRoomForm] = useState({ room_name: '', bed_count: 0 });
  const [editingRoom, setEditingRoom] = useState<any>(null);

  const canManage = user && (user.role === 'admin' || user.role === 'dormitory');

  const startEdit = (d: any) => {
    setEditing(d);
    setForm({ dormitory_name: d.dormitory_name || '', capacity: d.capacity || 0 });
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ dormitory_name: '', capacity: 0 });
  };

  const handleSave = () => {
    if (!form.dormitory_name || form.capacity <= 0) return;
    if (!canManage) return;
    if (editing) {
      updateDorm.mutate({ id: editing.id || editing._id, updates: { ...form } });
    } else {
      createDorm.mutate({ ...form });
    }
    resetForm();
  };

  const resetRoomForm = () => {
    setEditingRoom(null);
    setRoomForm({ room_name: '', bed_count: 0 });
  };

  const startEditRoom = (r:any) => {
    setEditingRoom(r);
    setRoomForm({ room_name: r.room_name || '', bed_count: r.bed_count || 0 });
  };

  const handleSaveRoom = () => {
    if (!roomForm.room_name || roomForm.bed_count <= 0 || !selectedDormId) return;
    if (!canManage) return;
    if (editingRoom) {
      updateRoom.mutate({ id: editingRoom.id || editingRoom._id, updates: { ...roomForm } });
    } else {
      createRoom.mutate({ ...roomForm, dormitory_id: selectedDormId });
    }
    resetRoomForm();
  };

  const handleExportAssignments = async () => {
    try {
      const csv = await exportAssignmentCsv(selectedDormId ? { dormitory_id: selectedDormId } : undefined);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'assignment_logs.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Failed to export assignments');
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Dormitory Details" description="Manage dormitory rooms and capacities" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-lg font-semibold mb-4">Dormitories</h3>
          {isLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : dormitories.length === 0 ? (
            <div className="text-muted-foreground">No dormitories configured</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-3">
                <Label className="w-28">Select Dorm</Label>
                <select className="flex-1 p-2 border rounded" value={selectedDormId || ''} onChange={(e)=>setSelectedDormId(e.target.value || null)}>
                  <option value="">-- Select --</option>
                  {dormitories.map((d:any)=>(<option key={d.id||d._id} value={d.id||d._id}>{d.dormitory_name} ({d.capacity})</option>))}
                </select>
                <div className="ml-auto">
                  <Button size="sm" onClick={handleExportAssignments} disabled={!selectedDormId}>Export Assignments</Button>
                </div>
              </div>

              {(selectedDormId ? (rooms || []) : dormitories).map((d: any) => (
                <div key={d.id ?? d._id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{d.room_name || d.dormitory_name}</div>
                    <div className="text-sm text-muted-foreground">{d.bed_count ? `Beds: ${d.bed_count}` : `Capacity: ${d.capacity} • Occupied: ${d.current_occupancy || 0}`}</div>
                  </div>
                  <div className="flex gap-2">
                    {d.room_name ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => startEditRoom(d)} disabled={!canManage}>Edit Room</Button>
                        <Button size="sm" variant="destructive" onClick={() => canManage && deleteRoom.mutate(d.id || d._id)} disabled={!canManage}>Delete Room</Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => startEdit(d)} disabled={!canManage}>Edit Dorm</Button>
                        <Button size="sm" variant="destructive" onClick={() => canManage && deleteDorm.mutate(d.id || d._id)} disabled={!canManage}>Delete Dorm</Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-lg font-semibold mb-4">Add / Edit Dormitory / Rooms</h3>
          {!canManage && <div className="text-sm text-muted-foreground mb-2">You do not have permission to manage dormitories or rooms.</div>}
          <div className="space-y-3">
            <div>
              <Label>Type</Label>
              <div className="flex gap-2">
                <Button variant={editing ? 'outline' : 'default'} onClick={()=>{setEditingRoom(null); setEditing(null);}}>Dormitory</Button>
                <Button variant={editingRoom ? 'default' : 'outline'} onClick={()=>{setEditing(null); setEditingRoom(null);}}>Room</Button>
              </div>
            </div>

            {editingRoom ? (
              <>
                <div>
                  <Label>Room Name</Label>
                  <Input value={roomForm.room_name} onChange={(e:any)=>setRoomForm({...roomForm, room_name: e.target.value})} />
                </div>
                <div>
                  <Label>Bed Count</Label>
                  <Input type="number" value={roomForm.bed_count} onChange={(e:any)=>setRoomForm({...roomForm, bed_count: parseInt(e.target.value||'0')})} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetRoomForm}>Cancel</Button>
                  <Button onClick={handleSaveRoom} disabled={!canManage}>{editingRoom ? 'Update Room' : 'Create Room'}</Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label>Dormitory Name</Label>
                  <Input value={form.dormitory_name} onChange={(e: any) => setForm({ ...form, dormitory_name: e.target.value })} />
                </div>
                <div>
                  <Label>Capacity (beds)</Label>
                  <Input type="number" value={form.capacity} onChange={(e: any) => setForm({ ...form, capacity: parseInt(e.target.value || '0') })} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetForm}>Cancel</Button>
                  <Button onClick={handleSave} disabled={!canManage}>{editing ? 'Update' : 'Create'}</Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
