import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GraduationCap, Save, Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  useClasses,
  useStudents,
  useAttendance,
  useAttendanceByClass,
  useCreateAttendance,
  useUpdateAttendance,
  useDeleteAttendance,
} from "@/hooks/useDatabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Attendance } from "@/lib/types";

function AttendancePage() {
  const { user } = useAuth();
  const { data: classes = [] } = useClasses();
  const { data: students = [] } = useStudents();
  const { data: allAttendance = [] } = useAttendance();

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const teacherClasses = useMemo(() => {
    if (!user) return [];
    return classes.filter((c) => c.teacher_id === user.id);
  }, [classes, user]);

  useEffect(() => {
    if (selectedClassId === "" && teacherClasses.length > 0) {
      setSelectedClassId(teacherClasses[0].id);
    }
  }, [teacherClasses, selectedClassId]);

  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter((s) => s.class_id === selectedClassId);
  }, [students, selectedClassId]);

  const classAttendance = useMemo(() => {
    if (!selectedClassId) return [];
    return allAttendance.filter(
      (a) =>
        a.class_id === selectedClassId && a.attendance_date === selectedDate
    );
  }, [allAttendance, selectedClassId, selectedDate]);

  const createAttendanceMutation = useCreateAttendance();
  const updateAttendanceMutation = useUpdateAttendance();
  const deleteAttendanceMutation = useDeleteAttendance();

  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, Attendance>
  >({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<"present" | "absent" | "late">(
    "present"
  );
  const [editRemarks, setEditRemarks] = useState("");

  useEffect(() => {
    const map: Record<string, Attendance> = {};
    classAttendance.forEach((a) => {
      map[a.student_id] = a;
    });
    setAttendanceMap(map);
  }, [classAttendance]);

  const handleToggleAttendance = (studentId: string) => {
    const existing = attendanceMap[studentId];
    if (existing) {
      const newStatus = existing.status === "present" ? "absent" : "present";
      updateAttendanceMutation.mutate({
        id: existing.id,
        updates: { status: newStatus },
      });
    } else {
      // Create new attendance record
      createAttendanceMutation.mutate({
        student_id: studentId,
        class_id: selectedClassId,
        attendance_date: selectedDate,
        status: "present",
        remarks: "",
      });
    }
  };

  const handleDeleteAttendance = (recordId: string) => {
    if (confirm("Delete this attendance record?")) {
      deleteAttendanceMutation.mutate(recordId);
    }
  };

  const handleEditAttendance = (record: Attendance) => {
    setEditingId(record.id);
    setEditStatus(record.status);
    setEditRemarks(record.remarks || "");
  };

  const handleSaveEdit = () => {
    if (editingId) {
      updateAttendanceMutation.mutate({
        id: editingId,
        updates: { status: editStatus, remarks: editRemarks },
      });
      setEditingId(null);
    }
  };

  const presentCount = Object.values(attendanceMap).filter(
    (a) => a.status === "present"
  ).length;
  const absentCount = Object.values(attendanceMap).filter(
    (a) => a.status === "absent"
  ).length;
  const lateCount = Object.values(attendanceMap).filter(
    (a) => a.status === "late"
  ).length;

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <DashboardLayout>
      <PageHeader
        title="Attendance"
        description="Mark daily attendance for your classes"
        icon={GraduationCap}
      />

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-4 border border-border shadow-md mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {teacherClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.class_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none outline-none text-sm"
            />
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-4 text-sm">
            <span className="text-success font-medium">
              Present: {presentCount}
            </span>
            <span className="text-destructive font-medium">
              Absent: {absentCount}
            </span>
            {lateCount > 0 && (
              <span className="text-warning font-medium">
                Late: {lateCount}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Attendance List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl border border-border shadow-md overflow-hidden"
      >
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="font-semibold">
            Student Attendance - {selectedClass?.class_name || "Select a class"}
          </h3>
        </div>
        <div className="divide-y divide-border max-h-96 overflow-y-auto">
          {classStudents.length > 0 ? (
            classStudents.map((student) => {
              const attendance = attendanceMap[student.id];
              const status = attendance?.status || "absent";
              const remarks = attendance?.remarks || "";

              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                      {student.first_name[0]}
                      {student.last_name[0]}
                    </div>
                    <div>
                      <p className="font-medium">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {student.admission_number}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        status === "present"
                          ? "bg-success/10 text-success"
                          : status === "late"
                          ? "bg-warning/10 text-warning"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAttendance(student.id)}
                    >
                      <Checkbox
                        checked={status === "present"}
                        onCheckedChange={() =>
                          handleToggleAttendance(student.id)
                        }
                      />
                    </Button>
                    {attendance && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAttendance(attendance)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAttendance(attendance.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No students in this class or select a class
            </div>
          )}
        </div>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={!!editingId} onOpenChange={() => setEditingId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Attendance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editStatus}
                onValueChange={(v: any) => setEditStatus(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Input
                placeholder="Add any remarks"
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
export default AttendancePage;
