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
} from "@/hooks/useDatabase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { motion } from "framer-motion";

const classColumns = [
  { key: "class_name", label: "Class" },
  { key: "class_code", label: "Code" },
  { key: "form_number", label: "Form" },
  { key: "teacher_id", label: "Teacher ID" },
  { key: "capacity", label: "Capacity" },
];

const markColumns = [
  { key: "student_id", label: "Student ID" },
  { key: "class_id", label: "Class ID" },
  { key: "subject", label: "Subject" },
  { key: "marks_obtained", label: "Marks" },
  { key: "total_marks", label: "Total" },
];

const AcademicPage = () => {
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();

  const { data: marks = [], isLoading: marksLoading } = useMarks();
  const createMark = useCreateMark();
  const updateMark = useUpdateMark();
  const deleteMark = useDeleteMark();

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

  const handleEditClass = (row: any) => {
    setEditingClass(row);
    setClassForm({ ...row });
    setClassDialogOpen(true);
  };
  const handleDeleteClass = async (row: any) => {
    if (!window.confirm("Delete this class?")) return;
    await deleteClass.mutateAsync(row.id || row._id);
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
  const handleDeleteMark = async (row: any) => {
    if (!window.confirm("Delete this mark?")) return;
    await deleteMark.mutateAsync(row.id || row._id);
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

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-2xl p-6 border border-border shadow-md">
          {classesLoading ? (
            <p className="text-muted-foreground">Loading classes...</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Classes ({classes.length})
                </h3>
                <div className="flex gap-2">
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
                  >
                    Add Class
                  </Button>
                </div>
              </div>
              <DataTable
                columns={classColumns}
                data={classes}
                onEdit={handleEditClass}
                onDelete={handleDeleteClass}
              />
            </>
          )}
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-md">
          {marksLoading ? (
            <p className="text-muted-foreground">Loading marks...</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Marks ({marks.length})
                </h3>
                <div>
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
                  >
                    Add Mark
                  </Button>
                </div>
              </div>
              <DataTable
                columns={markColumns}
                data={marks}
                onEdit={handleEditMark}
                onDelete={handleDeleteMark}
              />
            </>
          )}
        </div>
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
    </DashboardLayout>
  );
};
export default AcademicPage;
