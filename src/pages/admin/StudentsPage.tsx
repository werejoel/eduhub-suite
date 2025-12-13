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
import { Users, Search, Filter, Plus } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Student {
  id: string;
  name: string;
  email: string;
  class: string;
  gender: string;
  admissionDate: string;
  status: string;
  parentPhone: string;
}

const initialStudents: Student[] = [
  { id: "1", name: "Alice Johnson", email: "alice@school.edu", class: "Grade 10A", gender: "Female", admissionDate: "2024-01-15", status: "Active", parentPhone: "+1234567890" },
  { id: "2", name: "Bob Smith", email: "bob@school.edu", class: "Grade 9B", gender: "Male", admissionDate: "2024-01-12", status: "Active", parentPhone: "+1234567891" },
  { id: "3", name: "Carol Williams", email: "carol@school.edu", class: "Grade 11A", gender: "Female", admissionDate: "2024-01-10", status: "Active", parentPhone: "+1234567892" },
  { id: "4", name: "David Brown", email: "david@school.edu", class: "Grade 8C", gender: "Male", admissionDate: "2024-01-08", status: "Inactive", parentPhone: "+1234567893" },
  { id: "5", name: "Eva Martinez", email: "eva@school.edu", class: "Grade 12A", gender: "Female", admissionDate: "2024-01-05", status: "Active", parentPhone: "+1234567894" },
  { id: "6", name: "Frank Wilson", email: "frank@school.edu", class: "Grade 10B", gender: "Male", admissionDate: "2024-01-03", status: "Active", parentPhone: "+1234567895" },
];

const columns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "class", label: "Class" },
  { key: "gender", label: "Gender" },
  { key: "admissionDate", label: "Admission Date" },
  {
    key: "status",
    label: "Status",
    render: (value: string) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          value === "Active"
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
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    class: "",
    gender: "",
    parentPhone: "",
  });

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === "all" || student.class === filterClass;
    return matchesSearch && matchesClass;
  });

  const handleAddStudent = () => {
    if (!newStudent.name || !newStudent.email || !newStudent.class) {
      toast.error("Please fill in all required fields");
      return;
    }
    const student: Student = {
      id: String(Date.now()),
      ...newStudent,
      admissionDate: new Date().toISOString().split("T")[0],
      status: "Active",
    };
    setStudents([student, ...students]);
    setNewStudent({ name: "", email: "", class: "", gender: "", parentPhone: "" });
    setDialogOpen(false);
    toast.success("Student added successfully");
  };

  const handleDelete = (student: Student) => {
    setStudents(students.filter((s) => s.id !== student.id));
    toast.success("Student removed successfully");
  };

  const uniqueClasses = [...new Set(students.map((s) => s.class))];

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
        onEdit={(row) => toast.info(`Edit ${row.name}`)}
        onDelete={handleDelete}
        onView={(row) => toast.info(`View ${row.name}`)}
      />

      {/* Add Student Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                placeholder="Enter student name"
              />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">Class *</Label>
                <Select
                  value={newStudent.class}
                  onValueChange={(value) => setNewStudent({ ...newStudent, class: value })}
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
                  onValueChange={(value) => setNewStudent({ ...newStudent, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Parent Phone</Label>
              <Input
                id="phone"
                value={newStudent.parentPhone}
                onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })}
                placeholder="+1234567890"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStudent}>Add Student</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
