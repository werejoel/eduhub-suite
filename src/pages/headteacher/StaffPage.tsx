import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { GraduationCap, Search, Filter, Loader } from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState } from "react";
import {
  useTeachers,
  useCreateTeacher,
  useUpdateTeacher,
  useDeleteTeacher,
} from "@/hooks/useDatabase";

const columns = [
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "subject", label: "Subject" },
  { key: "phone", label: "Phone" },
  {
    key: "status",
    label: "Status",
    render: (value: string) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          value === "active"
            ? "bg-success/10 text-success"
            : "bg-warning/10 text-warning"
        }`}
      >
        {value}
      </span>
    ),
  },
];

const StaffPage = () => {
  const { data: teachers = [], isLoading } = useTeachers();
  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher();
  const deleteMutation = useDeleteTeacher();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    subject: "",
    qualification: "",
    employee_id: "",
    status: "active",
  });

  const filtered = (teachers || []).filter((t: any) => {
    const q = searchQuery.toLowerCase();
    return (
      `${t.first_name} ${t.last_name}`.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      (t.subject || "").toLowerCase().includes(q)
    );
  });

  const handleAdd = () => {
    setEditing(null);
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      subject: "",
      qualification: "",
      employee_id: "",
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
    if (!window.confirm("Delete this staff member?")) return;
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

  const uniqueSubjects = [
    ...new Set((teachers || []).map((t: any) => t.subject)),
  ].filter(Boolean);

  return (
    <DashboardLayout>
      <PageHeader
        title="Staff Management"
        description="Manage school staff and assignments"
        icon={GraduationCap}
        action={{ label: "Add Staff", onClick: handleAdd }}
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
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {uniqueSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  {editing ? "Edit Staff" : "Add Staff"}
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
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input
                      value={form.subject}
                      onChange={(e) =>
                        setForm({ ...form, subject: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Qualification</Label>
                  <Input
                    value={form.qualification}
                    onChange={(e) =>
                      setForm({ ...form, qualification: e.target.value })
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
export default StaffPage;
