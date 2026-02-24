import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { BookOpen, Loader, Search } from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import {
  useClasses,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
  useMarks,
  useCreateMark,
  useUpdateMark,
  useDeleteMark,
  useTeachers,
  useStudents,
} from "@/hooks/useDatabase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { motion } from "framer-motion";

const AcademicPage = () => {
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const { data: teachers = [] } = useTeachers();
  const { data: students = [] } = useStudents();
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();

  const { data: marks = [], isLoading: marksLoading } = useMarks();
  const createMark = useCreateMark();
  const updateMark = useUpdateMark();
  const deleteMark = useDeleteMark();

  // Create teacher name lookup
  const teacherMap = teachers.reduce((acc: any, teacher: any) => {
    acc[teacher.id] = `${teacher.first_name} ${teacher.last_name}`;
    return acc;
  }, {});

  // Create student name lookup
  const studentMap = students.reduce((acc: any, student: any) => {
    acc[student.id] = `${student.first_name} ${student.last_name}`;
    return acc;
  }, {});

  // Transform classes data to include teacher names
  const classesWithTeacherNames = classes.map((cls: any) => ({
    ...cls,
    teacher_name: teacherMap[cls.teacher_id] || cls.teacher_id,
  }));

  // Transform marks data to include student names
  const marksWithStudentNames = marks.map((mark: any) => ({
    ...mark,
    student_name: studentMap[mark.student_id] || mark.student_id,
  }));

  // Column definitions with custom renders
  const classColumns = [
    {
      key: "class_name",
      label: "Class Name",
      render: (value: string) => (
        <span className="font-semibold text-foreground">{value}</span>
      ),
    },
    {
      key: "class_code",
      label: "Code",
      render: (value: string) => (
        <Badge variant="outline">{value}</Badge>
      ),
    },
    {
      key: "form_number",
      label: "Form",
      render: (value: number) => (
        <div className="flex items-center justify-center">
          <Badge className="bg-blue-100 text-blue-800">Form {value}</Badge>
        </div>
      ),
    },
    {
      key: "teacher_name",
      label: "Teacher",
      render: (value: string) => (
        <span className="text-muted-foreground">{value || "Unassigned"}</span>
      ),
    },
    {
      key: "capacity",
      label: "Capacity",
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: "70%" }}></div>
          </div>
          <span className="text-sm font-medium">{value}</span>
        </div>
      ),
    },
  ];

  const markColumns = [
    {
      key: "student_name",
      label: "Student Name",
      render: (value: string) => (
        <span className="font-semibold text-foreground">{value}</span>
      ),
    },
    {
      key: "subject",
      label: "Subject",
      render: (value: string) => (
        <Badge variant="secondary">{value}</Badge>
      ),
    },
    {
      key: "marks_obtained",
      label: "Marks Obtained",
      render: (value: number, row: any) => {
        const percentage = ((value / (row.total_marks || 100)) * 100).toFixed(1);
        const numPercentage = parseFloat(percentage);
        let badgeClass = "bg-green-100 text-green-800";
        if (numPercentage < 50) badgeClass = "bg-red-100 text-red-800";
        else if (numPercentage < 70) badgeClass = "bg-yellow-100 text-yellow-800";
        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold">{value}</span>
            <Badge className={badgeClass}>{percentage}%</Badge>
          </div>
        );
      },
    },
    {
      key: "total_marks",
      label: "Total Marks",
      render: (value: number) => (
        <span className="text-muted-foreground">{value}</span>
      ),
    },
    {
      key: "exam_type",
      label: "Exam Type",
      render: (value: string) => (
        <Badge variant="outline" className="text-xs">
          {value || "Assignment"}
        </Badge>
      ),
    },
  ];

  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any | null>(null);
  const [classForm, setClassForm] = useState<any>({
    class_name: "",
    class_code: "",
    form_number: 1,
    teacher_id: "",
    capacity: 0,
  });

  const [markDialogOpen, setMarkDialogOpen] = useState(false);
  const [editingMark, setEditingMark] = useState<any | null>(null);
  const [markForm, setMarkForm] = useState<any>({
    student_id: "",
    class_id: "",
    subject: "",
    marks_obtained: 0,
    total_marks: 100,
  });

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"class" | "mark" | null>(null);
  const [deleteItem, setDeleteItem] = useState<any | null>(null);

  const handleEditClass = (row: any) => {
    setEditingClass(row);
    setClassForm({ ...row });
    setClassDialogOpen(true);
  };
  const handleDeleteClass = (row: any) => {
    setDeleteType("class");
    setDeleteItem(row);
    setDeleteConfirmOpen(true);
  };
  const submitClass = async () => {
    if (editingClass) {
      await updateClass.mutateAsync({
        id: editingClass.id || editingClass._id,
        updates: classForm,
      });
    } else {
      await createClass.mutateAsync(classForm);
    }
    setClassDialogOpen(false);
  };

  const handleEditMark = (row: any) => {
    setEditingMark(row);
    setMarkForm({ ...row });
    setMarkDialogOpen(true);
  };
  const handleDeleteMark = (row: any) => {
    setDeleteType("mark");
    setDeleteItem(row);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteType === "class" && deleteItem) {
      await deleteClass.mutateAsync(deleteItem.id || deleteItem._id);
    } else if (deleteType === "mark" && deleteItem) {
      await deleteMark.mutateAsync(deleteItem.id || deleteItem._id);
    }
    setDeleteConfirmOpen(false);
    setDeleteType(null);
    setDeleteItem(null);
  };
  const submitMark = async () => {
    if (editingMark) {
      await updateMark.mutateAsync({
        id: editingMark.id || editingMark._id,
        updates: markForm,
      });
    } else {
      await createMark.mutateAsync(markForm);
    }
    setMarkDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Academic"
        description="Academic settings, timetables and curriculum management"
        icon={BookOpen}
      />

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Classes Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col"
        >
          <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20 rounded-2xl p-6 border border-border shadow-md flex flex-col h-full">
            {classesLoading ? (
              <p className="text-muted-foreground">Loading classes...</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold">Classes</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {classes.length} classes configured
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingClass(null);
                      setClassForm({
                        class_name: "",
                        class_code: "",
                        form_number: 1,
                        teacher_id: "",
                        capacity: 0,
                      });
                      setClassDialogOpen(true);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    + Add Class
                  </Button>
                </div>
                <div className="flex-1 overflow-auto">
                  <DataTable
                    columns={classColumns}
                    data={classesWithTeacherNames}
                    onEdit={handleEditClass}
                    onDelete={handleDeleteClass}
                  />
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Marks Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col"
        >
          <div className="bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/20 rounded-2xl p-6 border border-border shadow-md flex flex-col h-full">
            {marksLoading ? (
              <p className="text-muted-foreground">Loading marks...</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold">Student Marks</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {marks.length} marks recorded
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingMark(null);
                      setMarkForm({
                        student_id: "",
                        class_id: "",
                        subject: "",
                        marks_obtained: 0,
                        total_marks: 100,
                      });
                      setMarkDialogOpen(true);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    + Add Mark
                  </Button>
                </div>
                <div className="flex-1 overflow-auto">
                  <DataTable
                    columns={markColumns}
                    data={marksWithStudentNames}
                    onEdit={handleEditMark}
                    onDelete={handleDeleteMark}
                  />
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingClass ? "Edit Class" : "Add Class"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Class Name</Label>
              <Input
                value={classForm.class_name}
                onChange={(e) =>
                  setClassForm({ ...classForm, class_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Class Code</Label>
              <Input
                value={classForm.class_code}
                onChange={(e) =>
                  setClassForm({ ...classForm, class_code: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Form Number</Label>
                <Input
                  type="number"
                  value={classForm.form_number}
                  onChange={(e) =>
                    setClassForm({
                      ...classForm,
                      form_number: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={classForm.capacity}
                  onChange={(e) =>
                    setClassForm({
                      ...classForm,
                      capacity: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Teacher ID</Label>
              <Input
                value={classForm.teacher_id}
                onChange={(e) =>
                  setClassForm({ ...classForm, teacher_id: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setClassDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={submitClass}>
                {editingClass ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={markDialogOpen} onOpenChange={setMarkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMark ? "Edit Mark" : "Add Mark"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Student ID</Label>
              <Input
                value={markForm.student_id}
                onChange={(e) =>
                  setMarkForm({ ...markForm, student_id: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Class ID</Label>
              <Input
                value={markForm.class_id}
                onChange={(e) =>
                  setMarkForm({ ...markForm, class_id: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={markForm.subject}
                onChange={(e) =>
                  setMarkForm({ ...markForm, subject: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marks Obtained</Label>
                <Input
                  type="number"
                  value={markForm.marks_obtained}
                  onChange={(e) =>
                    setMarkForm({
                      ...markForm,
                      marks_obtained: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Total Marks</Label>
                <Input
                  type="number"
                  value={markForm.total_marks}
                  onChange={(e) =>
                    setMarkForm({
                      ...markForm,
                      total_marks: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setMarkDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={submitMark}>
                {editingMark ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Delete {deleteType === "class" ? "Class" : "Mark"}
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-3">
              {deleteType === "class"
                ? `Are you sure you want to delete the class "${deleteItem?.class_name}"? This action cannot be undone.`
                : `Are you sure you want to delete the mark for "${deleteItem?.student_name}" in ${deleteItem?.subject}? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};
export default AcademicPage;
