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
import { useStudents, useClasses, useUpdateStudent, useAttendance, useMarks } from "@/hooks/useDatabase";
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
  const { data: students = [], isLoading: studentsLoading, isError: studentsError, error: studentsErrorObj } = useStudents();
  const { data: classes = [], isLoading: classesLoading, isError: classesError, error: classesErrorObj } = useClasses();
  const { data: allAttendance = [], isLoading: attendanceLoading, isError: attendanceError, error: attendanceErrorObj } = useAttendance();
  const { data: allMarks = [], isLoading: marksLoading, isError: marksError, error: marksErrorObj } = useMarks();
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

  // Log comprehensive data for debugging
  useEffect(() => {
    console.log("=== TeacherStudentsPage Debug ===");
    console.log("User:", user);
    console.log("Loading states:", { studentsLoading, classesLoading, attendanceLoading, marksLoading });
    console.log("Error states:", { studentsError, classesError, attendanceError, marksError });
    console.log("Data loaded:", {
      students: students.length,
      classes: classes.length,
      attendance: allAttendance.length,
      marks: allMarks.length,
    });
    console.log("Students data:", students);
    console.log("Classes data:", classes);
    if (studentsError) console.error("Students error:", studentsErrorObj);
    if (classesError) console.error("Classes error:", classesErrorObj);
    if (attendanceError) console.error("Attendance error:", attendanceErrorObj);
    if (marksError) console.error("Marks error:", marksErrorObj);
  }, [studentsLoading, classesLoading, attendanceLoading, marksLoading, studentsError, classesError, attendanceError, marksError, students.length, classes.length, allAttendance.length, allMarks.length]);

  useEffect(() => {
    if (!selectedClass && teacherClasses.length > 0) setSelectedClass(teacherClasses[0].id);
  }, [teacherClasses, selectedClass]);

  // Calculate average grade for a student
  const getAverageGrade = (studentId: string, classId: string): string => {
    const studentMarks = allMarks.filter(
      (m: any) => m.student_id === studentId && m.class_id === classId
    );

    if (studentMarks.length === 0) return "-";

    // Calculate average percentage
    const totalObtained = studentMarks.reduce((sum, m: any) => sum + m.marks_obtained, 0);
    const totalMarks = studentMarks.reduce((sum, m: any) => sum + m.total_marks, 0);

    if (totalMarks === 0) return "-";

    const averagePercentage = (totalObtained / totalMarks) * 100;
    // Convert to grade
    if (averagePercentage >= 90) return "A";
    if (averagePercentage >= 80) return "B";
    if (averagePercentage >= 70) return "C";
    if (averagePercentage >= 60) return "D";
    if(averagePercentage  >= 50) return "E";
    return "F";
  };

  // Calculate attendance percentage for each student
  const getAttendancePercentage = (studentId: string, classId: string): string => {
    const studentAttendance = allAttendance.filter(
      (a: any) => a.student_id === studentId && a.class_id === classId
    );
    
    if (studentAttendance.length === 0) return "-";
    
    const presentCount = studentAttendance.filter(
      (a: any) => a.status === "present"
    ).length;
    
    const percentage = Math.round(
      (presentCount / studentAttendance.length) * 100
    );
    
    return `${percentage}%`;
  };

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
            <Dialog 
              open={registerOpen} 
              onOpenChange={(open) => {
                setRegisterOpen(open);
                if (!open) {
                  setSelectedStudentToRegister("");
                }
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setSelectedStudentToRegister("");
                  setRegisterOpen(true);
                }}>
                  Register Student
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Register Student to Class</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label>Select Class</Label>
                    <Select 
                      value={selectedClass || ""} 
                      onValueChange={setSelectedClass}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherClasses.map((cls: any) => (
                          <SelectItem key={cls.id || cls._id} value={cls.id || cls._id}>
                            {cls.class_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Student</Label>
                    <Select 
                      value={selectedStudentToRegister || ""} 
                      onValueChange={setSelectedStudentToRegister}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select student to register" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.length > 0 ? (
                          students
                            .filter((s: any) => {
                              // Show all students, but prefer unregistered ones
                              return true;
                            })
                            .map((s: any) => (
                              <SelectItem key={s.id || s._id} value={s.id || s._id}>
                                {s.first_name} {s.last_name} ({s.admission_number})
                                {s.class_id ? ` - Class: ${classes.find((c: any) => (c.id || c._id) === s.class_id)?.class_name || 'Unknown'}` : ' - Unregistered'}
                              </SelectItem>
                            ))
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground text-center">No students available</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => {
                      setRegisterOpen(false);
                      setSelectedStudentToRegister("");
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      if (!selectedStudentToRegister || !selectedClass) {
                        toast.error('Select a student and class');
                        return;
                      }
                      const student = students.find((s:any) => (s.id || s._id) === selectedStudentToRegister);
                      if (!student) {
                        toast.error('Student not found');
                        return;
                      }
                      setPendingAssign({ 
                        studentId: selectedStudentToRegister, 
                        studentName: `${student.first_name} ${student.last_name}`, 
                        classId: selectedClass 
                      });
                      setConfirmAssignOpen(true);
                    }}>
                      Assign to Class
                    </Button>
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
          id: s.id || s._id,
          rollNumber: s.admission_number,
          name: `${s.first_name} ${s.last_name}`,
          class: classes.find((c: any) => (c.id || c._id) === s.class_id)?.class_name || "-",
          email: s.email,
          attendance: getAttendancePercentage(s.id || s._id, selectedClass),
          avgGrade: getAverageGrade(s.id || s._id, selectedClass),
          actions: (
            <div className="flex items-center gap-2">
              <Select 
                value={s.class_id || ""} 
                onValueChange={(v) => {
                  if (!v) return;
                  const studentName = `${s.first_name} ${s.last_name}`;
                  setPendingAssign({ 
                    studentId: s.id || s._id, 
                    studentName, 
                    classId: v 
                  });
                  setConfirmAssignOpen(true);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={s.class_id ? classes.find((c:any) => (c.id || c._id) === s.class_id)?.class_name : 'Assign class'} />
                </SelectTrigger>
                <SelectContent>
                  {teacherClasses.map((cls: any) => (
                    <SelectItem key={cls.id || cls._id} value={cls.id || cls._id}>
                      {cls.class_name}
                    </SelectItem>
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
                    nextStudents = (prevStudents as any[]).map(s => 
                      (s.id || s._id) === studentId ? { ...s, class_id: classId } : s
                    );
                    queryClient.setQueryData(["students"], nextStudents);
                  }

                  if (prevClasses && nextStudents) {
                    // compute student counts per class and store as derived `student_count`
                    const counts: Record<string, number> = {};
                    (nextStudents as any[]).forEach(s => {
                      if (s.class_id) counts[s.class_id] = (counts[s.class_id] || 0) + 1;
                    });
                    const nextClasses = (prevClasses as any[]).map(c => ({ 
                      ...c, 
                      student_count: counts[c.id || c._id] || 0 
                    }));
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
                  setSelectedStudentToRegister("");
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
