import PageHeader from '@/components/dashboard/PageHeader';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useDormitories, useCreateDormitory, useUpdateDormitory, useDeleteDormitory, useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom, exportAssignmentCsv } from '@/hooks/useDatabase';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import DataTable from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/AuthContext';

export default function DormitoryDetails() {
  const { data: dormitories = [], isLoading } = useDormitories();
  const createDorm = useCreateDormitory();
  const updateDorm = useUpdateDormitory();
  const deleteDorm = useDeleteDormitory();
  const { user } = useAuth();

  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<{ dormitory_name: string; capacity: number; dormitory_type: 'boys' | 'girls'; location: string }>({ dormitory_name: '', capacity: 0, dormitory_type: 'boys', location: '' });

  const [selectedDormId, setSelectedDormId] = useState<string | null>(null);

  // dialog visibility
  const [dormDialogOpen, setDormDialogOpen] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);

  const { data: rooms = [], isLoading: roomsLoading } = useRooms(selectedDormId || undefined);
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();

  const [roomForm, setRoomForm] = useState({ room_name: '', bed_count: 0 });
  const [editingRoom, setEditingRoom] = useState<any>(null);

  const canManage = user && (user.role === 'admin' || user.role === 'dormitory');

  const startEdit = (d: any) => {
    setEditing(d);
    setForm({
      dormitory_name: d.dormitory_name || '',
      capacity: d.capacity || 0,
      dormitory_type: d.dormitory_type || 'boys',
      location: d.location || '',
    });
    setDormDialogOpen(true);
  };

  const handleAddDorm = () => {
    resetForm();
    setDormDialogOpen(true);
  };

  const handleAddRoom = () => {
    resetRoomForm();
    setRoomDialogOpen(true);
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ dormitory_name: '', capacity: 0, dormitory_type: 'boys', location: '' });
    setDormDialogOpen(false);
  };

  const handleSave = () => {
    if (!form.dormitory_name || form.capacity <= 0) return;
    if (!canManage) return;
    const payload: any = { ...form };
    // ensure occupancy not lost when creating
    if (!editing) payload.current_occupancy = 0;
    if (editing) {
      updateDorm.mutate({ id: editing.id || editing._id, updates: payload });
    } else {
      createDorm.mutate(payload);
    }
    resetForm();
  };

  const resetRoomForm = () => {
    setEditingRoom(null);
    setRoomForm({ room_name: '', bed_count: 0 });
    setRoomDialogOpen(false);
  };

  const startEditRoom = (r: any) => {
    setEditingRoom(r);
    setRoomForm({ room_name: r.room_name || '', bed_count: r.bed_count || 0 });
    setRoomDialogOpen(true);
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

      <div className="space-y-6">
        {/* dormitories table */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Dormitories</h3>
            <Button size="sm" onClick={handleAddDorm} disabled={!canManage}>
              Add Dormitory
            </Button>
          </div>
          {isLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : dormitories.length === 0 ? (
            <div className="text-muted-foreground">No dormitories configured</div>
          ) : (
            <DataTable
              columns={[
                { key: 'dormitory_name', label: 'Name' },
                { key: 'capacity', label: 'Capacity' },
                { key: 'current_occupancy', label: 'Occupied' },
              ]}
              data={dormitories}
              onEdit={startEdit}
              onDelete={(row: any) => {
                const id = row.id;
                if (selectedDormId === id) setSelectedDormId(null);
                if (canManage) deleteDorm.mutate(id);
              }}
              onView={(row: any) => setSelectedDormId(row.id)}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* rooms list for selected dorm */}
        {selectedDormId && (
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Rooms for {dormitories.find(d => d.id === selectedDormId)?.dormitory_name || ''}
              </h3>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddRoom} disabled={!canManage}>
                  Add Room
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedDormId(null)}>
                  Show all
                </Button>
                <Button size="sm" onClick={handleExportAssignments} disabled={!selectedDormId}>
                  Export Assignments
                </Button>
              </div>
            </div>
            {rooms.length === 0 ? (
              <div className="text-muted-foreground">No rooms created yet</div>
            ) : (
              <DataTable
                columns={[
                  { key: 'room_name', label: 'Name' },
                  { key: 'bed_count', label: 'Beds' },
                  { key: 'current_occupancy', label: 'Occupied' },
                ]}
                data={rooms}
                onEdit={startEditRoom}
                onDelete={(row: any) => canManage && deleteRoom.mutate(row.id || row._id)}
                isLoading={roomsLoading}
              />
            )}
          </div>
        )}
      </div>

      {/* Dormitory dialog */}
      <Dialog open={dormDialogOpen} onOpenChange={setDormDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Dormitory' : 'Add Dormitory'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Dormitory Name</Label>
              <Input
                value={form.dormitory_name}
                onChange={(e: any) => setForm({ ...form, dormitory_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Type</Label>
              <select
                className="w-full p-2 border rounded"
                value={form.dormitory_type}
                onChange={(e: any) => setForm({ ...form, dormitory_type: e.target.value })}
              >
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
              </select>
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e: any) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div>
              <Label>Capacity (beds)</Label>
              <Input
                type="number"
                value={form.capacity}
                onChange={(e: any) =>
                  setForm({ ...form, capacity: parseInt(e.target.value || '0') })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canManage}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Room dialog */}
      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRoom ? 'Edit Room' : 'Add Room'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Room Name</Label>
              <Input
                value={roomForm.room_name}
                onChange={(e: any) => setRoomForm({ ...roomForm, room_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Bed Count</Label>
              <Input
                type="number"
                value={roomForm.bed_count}
                onChange={(e: any) =>
                  setRoomForm({ ...roomForm, bed_count: parseInt(e.target.value || '0') })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetRoomForm}>
              Cancel
            </Button>
            <Button onClick={handleSaveRoom} disabled={!canManage || !selectedDormId}>
              {editingRoom ? 'Update Room' : 'Create Room'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
