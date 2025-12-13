import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string;
  classes: string;
  phone: string;
  status: string;
}

const initialTeachers: Teacher[] = [
  { id: "1", name: "Dr. Sarah Wilson", email: "sarah.wilson@school.edu", subject: "Mathematics", classes: "Grade 10A, 11B", phone: "+1234567890", status: "Active" },
  { id: "2", name: "Mr. James Brown", email: "james.brown@school.edu", subject: "Physics", classes: "Grade 9A, 10B, 11A", phone: "+1234567891", status: "Active" },
  { id: "3", name: "Ms. Emily Davis", email: "emily.davis@school.edu", subject: "English", classes: "Grade 8A, 9B", phone: "+1234567892", status: "Active" },
  { id: "4", name: "Mr. Robert Miller", email: "robert.miller@school.edu", subject: "Chemistry", classes: "Grade 10A, 12A", phone: "+1234567893", status: "On Leave" },
  { id: "5", name: "Mrs. Jennifer Taylor", email: "jennifer.taylor@school.edu", subject: "Biology", classes: "Grade 9A, 10A", phone: "+1234567894", status: "Active" },
];

const columns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "subject", label: "Subject" },
  { key: "classes", label: "Classes" },
  { key: "phone", label: "Phone" },
  {
    key: "status",
    label: "Status",
    render: (value: string) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          value === "Active"
            ? "bg-success/10 text-success"
            : "bg-warning/10 text-warning"
        }`}
      >
        {value}
      </span>
    ),
  },
];

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === "all" || teacher.subject === filterSubject;
    return matchesSearch && matchesSubject;
  });

  const uniqueSubjects = [...new Set(teachers.map((t) => t.subject))];

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <PageHeader
        title="Teachers Management"
        description="Manage all teacher records and assignments"
        icon={GraduationCap}
        action={{
          label: "Add Teacher",
          onClick: () => toast.info("Add teacher dialog"),
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
        onEdit={(row) => toast.info(`Edit ${row.name}`)}
        onView={(row) => toast.info(`View ${row.name}`)}
        onDelete={(row) => {
          setTeachers(teachers.filter((t) => t.id !== row.id));
          toast.success("Teacher removed");
        }}
      />
    </DashboardLayout>
  );
}
