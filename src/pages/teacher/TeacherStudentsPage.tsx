import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Search } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Student {
  id: string;
  name: string;
  class: string;
  rollNumber: string;
  email: string;
  attendance: string;
  avgGrade: string;
}

const initialStudents: Student[] = [
  {
    id: "1",
    name: "Alice Johnson",
    class: "Grade 10A",
    rollNumber: "10A-001",
    email: "alice@school.edu",
    attendance: "95%",
    avgGrade: "A",
  },
  {
    id: "2",
    name: "Bob Smith",
    class: "Grade 10A",
    rollNumber: "10A-002",
    email: "bob@school.edu",
    attendance: "88%",
    avgGrade: "B",
  },
  {
    id: "3",
    name: "Carol Williams",
    class: "Grade 10A",
    rollNumber: "10A-003",
    email: "carol@school.edu",
    attendance: "92%",
    avgGrade: "A",
  },
  {
    id: "4",
    name: "David Brown",
    class: "Grade 10A",
    rollNumber: "10A-004",
    email: "david@school.edu",
    attendance: "78%",
    avgGrade: "C",
  },
  {
    id: "5",
    name: "Eva Martinez",
    class: "Grade 10A",
    rollNumber: "10A-005",
    email: "eva@school.edu",
    attendance: "96%",
    avgGrade: "B",
  },
  {
    id: "6",
    name: "Frank Wilson",
    class: "Grade 10A",
    rollNumber: "10A-006",
    email: "frank@school.edu",
    attendance: "90%",
    avgGrade: "A",
  },
];

const columns = [
  { key: "rollNumber", label: "Roll No." },
  { key: "name", label: "Name" },
  { key: "class", label: "Class" },
  { key: "email", label: "Email" },
  { key: "attendance", label: "Attendance" },
  {
    key: "avgGrade",
    label: "Avg Grade",
    render: (value: string) => {
      const colors: Record<string, string> = {
        A: "bg-success/10 text-success",
        B: "bg-primary/10 text-primary",
        C: "bg-warning/10 text-warning",
      };
      return (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            colors[value] || "bg-muted text-muted-foreground"
          }`}
        >
          {value}
        </span>
      );
    },
  },
];
function TeacherStudentsPage() {
  const [students] = useState<Student[]>(initialStudents);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("Grade 10A");

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesClass = student.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <DashboardLayout>
      <PageHeader
        title="My Students"
        description="View and manage students in your classes"
        icon={Users}
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
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Grade 10A">Grade 10A</SelectItem>
              <SelectItem value="Grade 11B">Grade 11B</SelectItem>
              <SelectItem value="Grade 9A">Grade 9A</SelectItem>
              <SelectItem value="Grade 12A">Grade 12A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredStudents}
        onView={(row) => toast.info(`View ${row.name}'s profile`)}
        actions={true}
      />
    </DashboardLayout>
  );
}
export default TeacherStudentsPage;
