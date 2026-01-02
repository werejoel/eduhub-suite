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
import { BookOpen, Plus, Loader, Search } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  useClasses,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
} from "@/hooks/useDatabase";
import { useTeachers } from "@/hooks/useDatabase";
import { Class } from "@/lib/types";

const columns = [
  { key: "class_name", label: "Class Name" },
  { key: "class_code", label: "Code" },
  { key: "form_number", label: "Form" },
  { key: "capacity", label: "Capacity" },
  { key: "teacher_id", label: "Teacher ID" },
];
function ClassesPage() {
  const { data: classes, isLoading } = useClasses();
  const { data: teachers } = useTeachers();
  const createMutation = useCreateClass();
  const updateMutation = useUpdateClass();
  const deleteMutation = useDeleteClass();

  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newClass, setNewClass] = useState({
    class_name: "",
    class_code: "",
    form_number: 0,
    teacher_id: "",
    capacity: 0,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredClasses = (classes || []).filter((cls) => {
    const matchesSearch =
      cls.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.class_code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleAddClass = async () => {
    if (
      !newClass.class_name ||
      !newClass.class_code ||
      !newClass.teacher_id ||
      newClass.capacity <= 0
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          updates: {
            class_name: newClass.class_name,
            class_code: newClass.class_code,
            form_number: newClass.form_number,
            teacher_id: newClass.teacher_id,
            capacity: newClass.capacity,
          },
        });
      } else {
        await createMutation.mutateAsync({
          class_name: newClass.class_name,
          class_code: newClass.class_code,
          form_number: newClass.form_number,
          teacher_id: newClass.teacher_id,
          capacity: newClass.capacity,
        });
      }
      setNewClass({
        class_name: "",
        class_code: "",
        form_number: 0,
        teacher_id: "",
        capacity: 0,
      });
      setEditingId(null);
      setDialogOpen(false);
    } catch (error) {
      console.error(
        editingId ? "Error updating class:" : "Error creating class:",
        error
      );
    }
  };

  const handleEdit = (cls: Class) => {
    setEditingId(cls.id as string);
    setNewClass({
      class_name: cls.class_name || "",
      class_code: cls.class_code || "",
      form_number: cls.form_number || 0,
      teacher_id: cls.teacher_id || "",
      capacity: cls.capacity || 0,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this class?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Classes Management"
        description="View and manage all classes"
        icon={BookOpen}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-6 shadow-md"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4 flex-1">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Edit Class" : "Create New Class"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="class_name">Class Name</Label>
                  <Input
                    id="class_name"
                    placeholder="e.g., Grade 10A"
                    value={newClass.class_name}
                    onChange={(e) =>
                      setNewClass({ ...newClass, class_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="class_code">Class Code</Label>
                  <Input
                    id="class_code"
                    placeholder="e.g., GR10A"
                    value={newClass.class_code}
                    onChange={(e) =>
                      setNewClass({ ...newClass, class_code: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="form_number">Form Number</Label>
                  <Input
                    id="form_number"
                    type="number"
                    placeholder="e.g., 4"
                    value={newClass.form_number}
                    onChange={(e) =>
                      setNewClass({
                        ...newClass,
                        form_number: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="teacher_id">Teacher</Label>
                  <select
                    id="teacher_id"
                    value={newClass.teacher_id}
                    onChange={(e) =>
                      setNewClass({ ...newClass, teacher_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-input rounded-md"
                  >
                    <option value="">Select a teacher</option>
                    {teachers?.map((teacher) => (
                      <option
                        key={(teacher as any).id ?? (teacher as any)._id}
                        value={(teacher as any).id ?? (teacher as any)._id}
                      >
                        {teacher.first_name} {teacher.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="e.g., 40"
                    value={newClass.capacity}
                    onChange={(e) =>
                      setNewClass({
                        ...newClass,
                        capacity: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <Button
                  onClick={handleAddClass}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="w-full"
                >
                  {editingId
                    ? updateMutation.isPending
                      ? "Saving..."
                      : "Save Changes"
                    : createMutation.isPending
                    ? "Creating..."
                    : "Create Class"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          columns={columns}
          data={(filteredClasses || []).map((cls) => ({
            ...cls,
            actions: (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(cls)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(cls.id)}
                >
                  Delete
                </Button>
              </div>
            ),
          }))}
        />
      </motion.div>
    </DashboardLayout>
  );
}
export default ClassesPage;