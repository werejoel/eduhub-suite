import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { useClasses, useCreateClass, useTeachers, useUpdateClass, useDeleteClass } from "@/hooks/useDatabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, Search, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ClassesPage() {
  const { data: classes = [], isLoading } = useClasses();
  const { data: teachers = [] } = useTeachers();
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newClass, setNewClass] = useState({ class_name: "", class_code: "", form_number: 1, capacity: 30, teacher_id: "" });

  const filtered = classes.filter((c: any) => c.class_name.toLowerCase().includes(search.toLowerCase()) || c.class_code.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!newClass.class_name || !newClass.class_code) {
      toast.error("Class name and code are required");
      return;
    }
    try {
      if (editingId) {
        await updateClass.mutateAsync({ id: editingId, updates: newClass });
        toast.success("Class updated successfully");
      } else {
        await createClass.mutateAsync(newClass);
        toast.success("Class created successfully");
      }
      resetForm();
    } catch (err) {
      toast.error("Error saving class");
      console.error(err);
    }
  };

  const handleEdit = (cls: any) => {
    setEditingId(cls.id);
    setNewClass({ class_name: cls.class_name, class_code: cls.class_code, form_number: cls.form_number, capacity: cls.capacity, teacher_id: cls.teacher_id });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      try {
        await deleteClass.mutateAsync(id);
        toast.success("Class deleted");
      } catch (err) {
        toast.error("Error deleting class");
      }
    }
  };

  const resetForm = () => {
    setNewClass({ class_name: "", class_code: "", form_number: 1, capacity: 30, teacher_id: "" });
    setEditingId(null);
    setDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <PageHeader title="Manage Classes" description="Create and manage classes" icon={BookOpen} />

      <div className="bg-card rounded-2xl border border-border p-6 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 flex-1">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search classes..." 
              value={search} 
              onChange={(e: any) => setSearch(e.target.value)} 
              className="pl-2"
            />
          </div>
          <Button 
            onClick={() => { resetForm(); setDialogOpen(true); }} 
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> New Class
          </Button>
        </div>

        {dialogOpen && (
          <div className="space-y-4 mb-6 p-4 bg-muted rounded-lg">
            <div>
              <Label>Class Name *</Label>
              <Input 
                value={newClass.class_name} 
                onChange={(e: any) => setNewClass({ ...newClass, class_name: e.target.value })} 
                placeholder="e.g., Grade 10A"
              />
            </div>
            <div>
              <Label>Class Code *</Label>
              <Input 
                value={newClass.class_code} 
                onChange={(e: any) => setNewClass({ ...newClass, class_code: e.target.value })} 
                placeholder="e.g., G10A"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Form Number</Label>
                <Input 
                  type="number" 
                  value={newClass.form_number} 
                  onChange={(e: any) => setNewClass({ ...newClass, form_number: parseInt(e.target.value) || 1 })} 
                />
              </div>
              <div>
                <Label>Capacity</Label>
                <Input 
                  type="number" 
                  value={newClass.capacity} 
                  onChange={(e: any) => setNewClass({ ...newClass, capacity: parseInt(e.target.value) || 30 })} 
                />
              </div>
            </div>
            <div>
              <Label>Teacher (optional)</Label>
              <select 
                value={newClass.teacher_id} 
                onChange={(e: any) => setNewClass({ ...newClass, teacher_id: e.target.value })} 
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Unassigned</option>
                {teachers.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleCreate} 
                disabled={createClass.isPending || updateClass.isPending}
              >
                {editingId ? "Update" : "Create"}
              </Button>
              <Button variant="ghost" onClick={resetForm}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-8">Loading classes...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No classes found</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Class</th>
                  <th className="text-left p-3">Code</th>
                  <th className="text-left p-3">Form</th>
                  <th className="text-left p-3">Capacity</th>
                  <th className="text-left p-3">Teacher</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cls: any) => {
                  const teacher = teachers.find((t: any) => t.id === cls.teacher_id);
                  return (
                    <tr key={cls.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{cls.class_name}</td>
                      <td className="p-3">{cls.class_code}</td>
                      <td className="p-3">{cls.form_number}</td>
                      <td className="p-3">{cls.capacity}</td>
                      <td className="p-3">{teacher ? `${teacher.first_name} ${teacher.last_name}` : "Unassigned"}</td>
                      <td className="p-3 flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(cls)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(cls.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
