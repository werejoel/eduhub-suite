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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Search, Filter, Plus, Loader } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from "@/hooks/useDatabase";
import { Student } from "@/lib/types";

const columns = [
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "class_id", label: "Class" },
  { key: "gender", label: "Gender" },
  { key: "enrollment_date", label: "Enrollment Date" },
  {
    key: "status",
    label: "Status",
    render: (value: string) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          value === "active"
            ? "bg-success/10 text-success"
            : "bg-destructive/10 text-destructive"
        }`}
      >
        {value}
      </span>
    ),
  },
];

export default function StudentsPage() {
  const { data: students, isLoading } = useStudents();
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const deleteMutation = useDeleteStudent();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "male" as const,
    class_id: "",
    admission_number: "",
  });

  const filteredStudents = (students || []).filter((student) => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === "all" || student.class_id === filterClass;
    return matchesSearch && matchesClass;
  });

  const handleAddStudent = async () => {
    if (!newStudent.first_name || !newStudent.last_name || !newStudent.email || !newStudent.class_id) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await createMutation.mutateAsync({
        first_name: newStudent.first_name,
        last_name: newStudent.last_name,
        email: newStudent.email,
        phone: newStudent.phone,
        date_of_birth: newStudent.date_of_birth,
        gender: newStudent.gender,
        class_id: newStudent.class_id,
        admission_number: newStudent.admission_number,
        enrollment_date: new Date().toISOString(),
        status: "active",
      });
      setNewStudent({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        date_of_birth: "",
        gender: "male",
        class_id: "",
        admission_number: "",
      });
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (student: Student) => {
    try {
      await deleteMutation.mutateAsync(student.id);
    } catch (error) {
      console.error(error);
    }
  };

  const uniqueClasses = [...new Set((students || []).map((s) => s.class_id))].filter(Boolean);

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <PageHeader
        title="Students Management"
        description="Manage all student records and information"
        icon={Users}
        action={{
          label: "Add Student",
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
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {uniqueClasses.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Table */}
          <DataTable
            columns={columns}
            data={filteredStudents}
            onEdit={(row) => toast.info(`Edit ${row.first_name} ${row.last_name}`)}
            onDelete={handleDelete}
            onView={(row) => toast.info(`View ${row.first_name} ${row.last_name}`)}
          />

          {/* Add Student Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={newStudent.first_name}
                      onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
                      placeholder="First name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={newStudent.last_name}
                      onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    placeholder="student@school.edu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admission">Admission Number *</Label>
                  <Input
                    id="admission"
                    value={newStudent.admission_number}
                    onChange={(e) => setNewStudent({ ...newStudent, admission_number: e.target.value })}
                    placeholder="ADM-001"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="class">Class *</Label>
                    <Select
                      value={newStudent.class_id}
                      onValueChange={(value) => setNewStudent({ ...newStudent, class_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueClasses.map((cls) => (
                          <SelectItem key={cls} value={cls}>
                            {cls}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={newStudent.gender}
                      onValueChange={(value: any) => setNewStudent({ ...newStudent, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={newStudent.date_of_birth}
                      onChange={(e) => setNewStudent({ ...newStudent, date_of_birth: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newStudent.phone}
                      onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddStudent} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Adding..." : "Add Student"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
}
