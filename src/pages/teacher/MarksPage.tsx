import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
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
import { FileText, Search, Save, Edit2, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  useClasses,
  useStudents,
  useMarks,
  useMarksByClass,
  useCreateMark,
  useUpdateMark,
  useDeleteMark,
} from "@/hooks/useDatabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Mark } from "@/lib/types";

const calculateGrade = (marks: number, totalMarks: number) => {
  const percentage = (marks / totalMarks) * 100;
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  if (percentage >= 60) return "D";
  return "F";
};

function MarksPage() {
  const { user } = useAuth();
  const { data: classes = [], isLoading: classesLoading, isError: classesError, error: classesErrorObj } = useClasses();
  const { data: students = [], isLoading: studentsLoading, isError: studentsError, error: studentsErrorObj } = useStudents();
  const { data: allMarks = [], isLoading: marksLoading, isError: marksError, error: marksErrorObj } = useMarks();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [searchParams] = useSearchParams();
  const [selectedExam, setSelectedExam] = useState<string>("Beginning-of-Term");
  const [editingMark, setEditingMark] = useState<Mark | null>(null);
  const [editMarks, setEditMarks] = useState(0);
  const [createDialog, setCreateDialog] = useState(false);
  const [createData, setCreateData] = useState({
    student_id: "",
    class_id: "",
    subject: "",
    exam_type: "Beginning-of-Term",
    marks_obtained: 0,
    total_marks: 100,
    term: "1",
    academic_year: "2024",
  });

  const teacherClasses = useMemo(() => {
    if (!user) return [];
    return classes.filter((c) => c.teacher_id === user.id);
  }, [classes, user]);

  useEffect(() => {
    const classFromParam = searchParams.get("classId");
    if (classFromParam) {
      setSelectedClassId(classFromParam);
      return;
    }
    if (selectedClassId === "" && teacherClasses.length > 0) {
      setSelectedClassId(teacherClasses[0].id);
    }
  }, [teacherClasses, selectedClassId, searchParams]);

  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter((s) => s.class_id === selectedClassId);
  }, [students, selectedClassId]);

  const classMarks = useMemo(() => {
    if (!selectedClassId) return [];
    return allMarks.filter(
      (m) => m.class_id === selectedClassId && m.exam_type === selectedExam
    );
  }, [allMarks, selectedClassId, selectedExam]);

  const createMutation = useCreateMark();
  const updateMutation = useUpdateMark();
  const deleteMutation = useDeleteMark();

  // Log comprehensive data for debugging
  useEffect(() => {
    console.log("=== MarksPage Debug ===");
    console.log("User:", user);
    console.log("Loading states:", { classesLoading, studentsLoading, marksLoading });
    console.log("Error states:", { classesError, studentsError, marksError });
    console.log("Data loaded:", {
      classes: classes.length,
      students: students.length,
      marks: allMarks.length,
    });
    console.log("Classes data:", classes);
    console.log("Students data:", students);
    console.log("Marks data:", allMarks);
    if (classesError) console.error("Classes error:", classesErrorObj);
    if (studentsError) console.error("Students error:", studentsErrorObj);
    if (marksError) console.error("Marks error:", marksErrorObj);
  }, [classesLoading, studentsLoading, marksLoading, classesError, studentsError, marksError, classes.length, students.length, allMarks.length]);

  const filteredMarks = useMemo(() => {
    return classMarks.filter((mark) => {
      const student = students.find((s) => s.id === mark.student_id);
      const studentName = student
        ? `${student.first_name} ${student.last_name}`
        : "";
      return studentName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [classMarks, searchQuery, students]);

  const handleCreateMark = () => {
    if (
      !createData.student_id ||
      !createData.subject ||
      !createData.exam_type
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    createMutation.mutate({
      ...createData,
      class_id: selectedClassId,
    });
    setCreateDialog(false);
    setCreateData({
      student_id: "",
      class_id: "",
      subject: "",
      exam_type: "Beginning-of-Term",
      marks_obtained: 0,
      total_marks: 100,
      term: "1",
      academic_year: "2024",
    });
  };

  const handleUpdateMark = () => {
    if (editingMark) {
      updateMutation.mutate({
        id: editingMark.id,
        updates: {
          marks_obtained: editMarks,
        },
      });
      setEditingMark(null);
    }
  };

  const handleDeleteMark = (markId: string) => {
    if (confirm("Delete this mark record?")) {
      deleteMutation.mutate(markId);
    }
  };

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      A: "bg-success/10 text-success",
      B: "bg-primary/10 text-primary",
      C: "bg-secondary/10 text-secondary-foreground",
      D: "bg-warning/10 text-warning",
      F: "bg-destructive/10 text-destructive",
    };
    return colors[grade] || "bg-muted text-muted-foreground";
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <DashboardLayout>
      <PageHeader
        title="Marks Management"
        description="Add, edit and manage student marks"
        icon={FileText}
      />

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-4 border border-border shadow-md mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
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
          <Select value={selectedExam} onValueChange={setSelectedExam}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select exam" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Beginning-of-Term">Beginning-of-Term</SelectItem>
              <SelectItem value="Mid-Term">Mid-Term</SelectItem>
              <SelectItem value="Final">Final Exam</SelectItem>
              <SelectItem value="Quiz">Quiz</SelectItem>
              <SelectItem value="Monthly">Monthly Test</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Mark
          </Button>
        </div>
      </motion.div>

      {/* Marks Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl border border-border shadow-md overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold">Student Name</th>
                <th className="text-left p-4 font-semibold">Subject</th>
                <th className="text-center p-4 font-semibold">Marks</th>
                <th className="text-center p-4 font-semibold">Grade</th>
                <th className="text-right p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMarks.length > 0 ? (
                filteredMarks.map((mark) => {
                  const student = students.find(
                    (s) => s.id === mark.student_id
                  );
                  const studentName = student
                    ? `${student.first_name} ${student.last_name}`
                    : "Unknown Student";
                  const grade = calculateGrade(
                    mark.marks_obtained,
                    mark.total_marks
                  );

                  return (
                    <tr
                      key={mark.id}
                      className="border-t border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4 font-medium">{studentName}</td>
                      <td className="p-4 text-muted-foreground">
                        {mark.subject}
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold">
                          {mark.marks_obtained}
                        </span>
                        <span className="text-muted-foreground">
                          /{mark.total_marks}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(
                            grade
                          )}`}
                        >
                          {grade}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingMark(mark);
                            setEditMarks(mark.marks_obtained);
                          }}
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMark(mark.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No marks found for this class and exam
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={!!editingMark} onOpenChange={() => setEditingMark(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Marks</DialogTitle>
          </DialogHeader>
          {editingMark && (
            <div className="space-y-4 py-4">
              <div className="bg-muted rounded-xl p-4">
                <p className="text-sm text-muted-foreground">Student</p>
                <p className="font-semibold">
                  {students.find((s) => s.id === editingMark.student_id)
                    ? `${
                        students.find((s) => s.id === editingMark.student_id)!
                          .first_name
                      } ${
                        students.find((s) => s.id === editingMark.student_id)!
                          .last_name
                      }`
                    : "Unknown"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">Exam</p>
                <p className="font-medium">
                  {editingMark.exam_type} - {editingMark.subject}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Marks (out of {editingMark.total_marks})</Label>
                <Input
                  type="number"
                  min={0}
                  max={editingMark.total_marks}
                  value={editMarks}
                  onChange={(e) => setEditMarks(Number(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Grade:{" "}
                  <span className="font-semibold">
                    {calculateGrade(editMarks, editingMark.total_marks)}
                  </span>
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditingMark(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateMark}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Marks
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Mark</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Student *</Label>
              <Select
                value={createData.student_id}
                onValueChange={(v) => {
                  console.log("Selected student:", v);
                  setCreateData({ ...createData, student_id: v });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {classStudents && classStudents.length > 0 ? (
                    classStudents.map((student) => (
                      <SelectItem
                        key={`student-${student.id}`}
                        value={student.id}
                      >
                        {student.first_name} {student.last_name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      No students available
                    </div>
                  )}
                </SelectContent>
              </Select>
              {classStudents.length === 0 && (
                <p className="text-xs text-destructive">
                  No students in this class. Select a class first.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                placeholder="e.g., Mathematics"
                value={createData.subject}
                onChange={(e) =>
                  setCreateData({ ...createData, subject: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Exam Type *</Label>
              <Select
                value={createData.exam_type}
                onValueChange={(v) =>
                  setCreateData({ ...createData, exam_type: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginning-of-Term">Beginning-of-Term</SelectItem>
                  <SelectItem value="Mid-Term">Mid-Term</SelectItem>
                  <SelectItem value="Final">Final Exam</SelectItem>
                  <SelectItem value="Quiz">Quiz</SelectItem>
                  <SelectItem value="Monthly">Monthly Test</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Marks Obtained</Label>
              <Input
                type="number"
                min={0}
                value={createData.marks_obtained}
                onChange={(e) =>
                  setCreateData({
                    ...createData,
                    marks_obtained: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Total Marks</Label>
              <Input
                type="number"
                min={1}
                value={createData.total_marks}
                onChange={(e) =>
                  setCreateData({
                    ...createData,
                    total_marks: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateMark}>
                <Save className="w-4 h-4 mr-2" />
                Add Mark
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
export default MarksPage;
