import { useState, useMemo, useEffect } from "react";
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
import { useStudents, useClasses, useUpdateStudent } from "@/hooks/useDatabase";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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

// Real data will be fetched from hooks

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
  const { user } = useAuth();
  const { data: students = [] } = useStudents();
  const { data: classes = [] } = useClasses();
  const updateStudent = useUpdateStudent();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [selectedStudentToRegister, setSelectedStudentToRegister] = useState("");
  const [pendingAssign, setPendingAssign] = useState<{
    studentId: string;
    studentName?: string;
    classId: string;
  } | null>(null);
  const [confirmAssignOpen, setConfirmAssignOpen] = useState(false);
  const queryClient = useQueryClient();

  const teacherClasses = useMemo(() => {
    if (!user) return [];
    return classes.filter((c) => c.teacher_id === user.id);
  }, [classes, user]);

  useEffect(() => {
    if (!selectedClass && teacherClasses.length > 0) setSelectedClass(teacherClasses[0].id);
  }, [teacherClasses, selectedClass]);

  const filteredStudents = students
    .filter((s: any) => (searchQuery ? (`${s.first_name} ${s.last_name}`).toLowerCase().includes(searchQuery.toLowerCase()) : true))
    .filter((s: any) => (selectedClass ? s.class_id === selectedClass : true));

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
              {teacherClasses.map((cls: any) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.class_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-2">
            <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setRegisterOpen(true)}>
                  Register Student
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Register Student to Class</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label>Student</Label>
                    <Select value={selectedStudentToRegister} onValueChange={setSelectedStudentToRegister}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students
                          .filter((s: any) => !s.class_id || s.class_id === "")
                          .map((s: any) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.first_name} {s.last_name} ({s.admission_number})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setRegisterOpen(false)}>Cancel</Button>
                            <Button onClick={() => {
                              if (!selectedStudentToRegister || !selectedClass) return toast.error('Select a student and class');
                              const student = students.find((s:any) => s.id === selectedStudentToRegister);
                              setPendingAssign({ studentId: selectedStudentToRegister, studentName: student ? `${student.first_name} ${student.last_name}` : undefined, classId: selectedClass });
                              setConfirmAssignOpen(true);
                            }}>Assign</Button>
                          </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredStudents.map((s: any) => ({
          id: s.id,
          rollNumber: s.admission_number,
          name: `${s.first_name} ${s.last_name}`,
          class: classes.find((c: any) => c.id === s.class_id)?.class_name || "-",
          email: s.email,
          attendance: "-",
          avgGrade: "-",
          actions: (
            <div className="flex items-center gap-2">
              <Select value={s.class_id || ""} onValueChange={(v) => {
                // open confirm dialog instead of immediate change
                const studentName = `${s.first_name} ${s.last_name}`;
                setPendingAssign({ studentId: s.id, studentName, classId: v });
                setConfirmAssignOpen(true);
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={s.class_id ? classes.find((c:any) => c.id === s.class_id)?.class_name : 'Assign class'} />
                </SelectTrigger>
                <SelectContent>
                  {teacherClasses.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.class_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ),
        }))}
        onView={(row) => toast.info(`View ${row.name}'s profile`)}
        actions={true}
      />

      {/* Confirm Assign Dialog */}
      <Dialog open={confirmAssignOpen} onOpenChange={(open) => { if (!open) setPendingAssign(null); setConfirmAssignOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p>Are you sure you want to assign <strong>{pendingAssign?.studentName || pendingAssign?.studentId}</strong> to the selected class?</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setConfirmAssignOpen(false); setPendingAssign(null); }}>Cancel</Button>
              <Button onClick={async () => {
                if (!pendingAssign) return;
                const { studentId, classId } = pendingAssign;
                // optimistic update for students and classes
                const prevStudents = queryClient.getQueryData<any>(["students"]);
                const prevClasses = queryClient.getQueryData<any>(["classes"]);
                try {
                  let nextStudents = prevStudents;
                  if (prevStudents) {
                    nextStudents = (prevStudents as any[]).map(s => s.id === studentId ? { ...s, class_id: classId } : s);
                    queryClient.setQueryData(["students"], nextStudents);
                  }

                  if (prevClasses && nextStudents) {
                    // compute student counts per class and store as derived `student_count`
                    const counts: Record<string, number> = {};
                    (nextStudents as any[]).forEach(s => {
                      if (s.class_id) counts[s.class_id] = (counts[s.class_id] || 0) + 1;
                    });
                    const nextClasses = (prevClasses as any[]).map(c => ({ ...c, student_count: counts[c.id] || 0 }));
                    queryClient.setQueryData(["classes"], nextClasses);
                  }

                  await updateStudent.mutateAsync({ id: studentId, updates: { class_id: classId } });
                  toast.success("Student assigned successfully");
                } catch (err) {
                  // rollback both caches
                  if (prevStudents) queryClient.setQueryData(["students"], prevStudents);
                  if (prevClasses) queryClient.setQueryData(["classes"], prevClasses);
                  toast.error("Failed to assign student");
                  console.error(err);
                } finally {
                  setConfirmAssignOpen(false);
                  setPendingAssign(null);
                }
              }}>Confirm</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
export default TeacherStudentsPage;
