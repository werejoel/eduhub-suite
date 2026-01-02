import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Users, Search, Loader } from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  useStudents,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
} from "@/hooks/useDatabase";
import { toast } from "sonner";

const columns = [
  { key: "admission_number", label: "Admission#" },
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "class_id", label: "Class" },
  { key: "status", label: "Status" },
];

const StudentsPage = () => {
  const { data: students = [], isLoading } = useStudents();
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const deleteMutation = useDeleteStudent();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({
    first_name: "",
    last_name: "",
    email: "",
    class_id: "",
    admission_number: "",
    phone: "",
    status: "active",
  });

  const filtered = (students || []).filter((s: any) => {
    const q = searchQuery.toLowerCase();
    return (
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.admission_number?.toLowerCase().includes(q)
    );
  });

  const handleAdd = () => {
    setEditing(null);
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      class_id: "",
      admission_number: "",
      phone: "",
      status: "active",
    });
    setDialogOpen(true);
  };
  const handleEdit = (row: any) => {
    setEditing(row);
    setForm({ ...row });
    setDialogOpen(true);
  };
  const handleDelete = async (row: any) => {
    if (!window.confirm("Delete this student?")) return;
    try {
      await deleteMutation.mutateAsync(row.id || row._id);
    } catch (err) {
      console.error(err);
    }
  };

  const submit = async () => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id || editing._id,
          updates: form,
        });
      } else {
        await createMutation.mutateAsync(form);
      }
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Students"
        description="Overview and management of students"
        icon={Users}
        action={{ label: "Add Student", onClick: handleAdd }}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-4 border border-border shadow-md mb-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </motion.div>

          <DataTable
            columns={columns}
            data={filtered}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Edit Student" : "Add Student"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={form.first_name}
                      onChange={(e) =>
                        setForm({ ...form, first_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={form.last_name}
                      onChange={(e) =>
                        setForm({ ...form, last_name: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Admission #</Label>
                  <Input
                    value={form.admission_number}
                    onChange={(e) =>
                      setForm({ ...form, admission_number: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Class ID</Label>
                  <Input
                    value={form.class_id}
                    onChange={(e) =>
                      setForm({ ...form, class_id: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={submit}>
                    {editing ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
};
export default StudentsPage;
