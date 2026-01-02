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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraduationCap, Search, Filter, Loader } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  useTeachers,
  useCreateTeacher,
  useUpdateTeacher,
  useDeleteTeacher,
} from "@/hooks/useDatabase";
import { Teacher } from "@/lib/types";

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

function TeachersPage() {
  const { data: teachers, isLoading } = useTeachers();
  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher();
  const deleteMutation = useDeleteTeacher();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    subject: "",
    qualification: "",
    employee_id: "",
  });

  const filteredTeachers = (teachers || []).filter((teacher) => {
    const fullName = `${teacher.first_name} ${teacher.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject =
      filterSubject === "all" || teacher.subject === filterSubject;
    return matchesSearch && matchesSubject;
  });

  const handleAddTeacher = async () => {
    if (
      !newTeacher.first_name ||
      !newTeacher.last_name ||
      !newTeacher.email ||
      !newTeacher.subject
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          updates: {
            first_name: newTeacher.first_name,
            last_name: newTeacher.last_name,
            email: newTeacher.email,
            phone: newTeacher.phone,
            subject: newTeacher.subject,
            qualification: newTeacher.qualification,
            employee_id: newTeacher.employee_id,
          },
        });
      } else {
        await createMutation.mutateAsync({
          first_name: newTeacher.first_name,
          last_name: newTeacher.last_name,
          email: newTeacher.email,
          phone: newTeacher.phone,
          subject: newTeacher.subject,
          qualification: newTeacher.qualification,
          employee_id: newTeacher.employee_id,
          employment_date: new Date().toISOString(),
          status: "active",
        });
      }
      setNewTeacher({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        subject: "",
        qualification: "",
        employee_id: "",
      });
      setEditingId(null);
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (teacher: Teacher) => {
    try {
      await deleteMutation.mutateAsync(teacher.id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingId(teacher.id as string);
    setNewTeacher({
      first_name: teacher.first_name || "",
      last_name: teacher.last_name || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      subject: teacher.subject || "",
      qualification: teacher.qualification || "",
      employee_id: teacher.employee_id || "",
    });
    setDialogOpen(true);
  };

  const uniqueSubjects = [
    ...new Set((teachers || []).map((t) => t.subject)),
  ].filter(Boolean);

  return (
    <DashboardLayout>
      <PageHeader
        title="Teachers Management"
        description="Manage all teacher records and assignments"
        icon={GraduationCap}
        action={{
          label: "Add Teacher",
          onClick: () => setDialogOpen(true),
        }}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-4 border border-border shadow-md mb-6"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search teachers..."
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

          {/* Table */}
          <DataTable
            columns={columns}
            data={filteredTeachers}
            onEdit={(row) => handleEdit(row)}
            onView={(row) =>
              toast.info(`View ${row.first_name} ${row.last_name}`)
            }
            onDelete={handleDelete}
          />

          {/* Add Teacher Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Teacher</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={newTeacher.first_name}
                      onChange={(e) =>
                        setNewTeacher({
                          ...newTeacher,
                          first_name: e.target.value,
                        })
                      }
                      placeholder="First name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={newTeacher.last_name}
                      onChange={(e) =>
                        setNewTeacher({
                          ...newTeacher,
                          last_name: e.target.value,
                        })
                      }
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newTeacher.email}
                    onChange={(e) =>
                      setNewTeacher({ ...newTeacher, email: e.target.value })
                    }
                    placeholder="teacher@school.edu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    value={newTeacher.employee_id}
                    onChange={(e) =>
                      setNewTeacher({
                        ...newTeacher,
                        employee_id: e.target.value,
                      })
                    }
                    placeholder="EMP-001"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={newTeacher.subject}
                      onChange={(e) =>
                        setNewTeacher({
                          ...newTeacher,
                          subject: e.target.value,
                        })
                      }
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newTeacher.phone}
                      onChange={(e) =>
                        setNewTeacher({ ...newTeacher, phone: e.target.value })
                      }
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input
                    id="qualification"
                    value={newTeacher.qualification}
                    onChange={(e) =>
                      setNewTeacher({
                        ...newTeacher,
                        qualification: e.target.value,
                      })
                    }
                    placeholder="e.g., Bachelor of Science"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddTeacher}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Adding..." : "Add Teacher"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
}
export default TeachersPage;
