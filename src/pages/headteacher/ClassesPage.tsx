import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import {
  BookOpen,
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader,
  Users,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useClasses,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
  useTeachers,
  useAssignClassToTeacher,
  useUnassignClassFromTeacher,
} from "@/hooks/useDatabase";
import { Class } from "@/lib/types";

const ClassesPage = () => {
  const { data: classes = [], isLoading } = useClasses();
  const { data: teachers = [] } = useTeachers();
  const createMutation = useCreateClass();
  const updateMutation = useUpdateClass();
  const deleteMutation = useDeleteClass();
  const assignClassMutation = useAssignClassToTeacher();
  const unassignClassMutation = useUnassignClassFromTeacher();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [selectedClassForAssign, setSelectedClassForAssign] = useState<Class | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [pendingAssign, setPendingAssign] = useState<{ classId: string; className: string; teacherId: string; teacherName: string } | null>(null);
  const [confirmAssignOpen, setConfirmAssignOpen] = useState(false);

  const [form, setForm] = useState<any>({
    class_name: "",
    class_code: "",
    form_number: 1,
    capacity: 50,
  });

  const filtered = (classes || []).filter((c: any) => {
    const q = searchQuery.toLowerCase();
    return (
      c.class_name?.toLowerCase().includes(q) ||
      c.class_code?.toLowerCase().includes(q)
    );
  });

  const handleAdd = () => {
    setEditing(null);
    setForm({
      class_name: "",
      class_code: "",
      form_number: 1,
      capacity: 50,
    });
    setDialogOpen(true);
  };

  const handleEdit = (row: any) => {
    setEditing(row);
    setForm({ ...row });
    setDialogOpen(true);
  };

  const handleDelete = async (row: any) => {
    if (!window.confirm("Delete this class? This cannot be undone.")) return;
    try {
      await deleteMutation.mutateAsync(row.id || row._id);
      toast.success("Class deleted successfully");
    } catch (err) {
      console.error(err);
    }
  };

  const submit = async () => {
    if (!form.class_name || !form.class_code) {
      toast.error("Class name and code are required");
      return;
    }

    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id || editing._id,
          updates: form,
        });
      } else {
        await createMutation.mutateAsync(form);
      }
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignClass = () => {
    if (!selectedClassForAssign || !selectedTeacherId) return;
    const teacher = teachers.find((t: any) => (t.id || t._id) === selectedTeacherId);
    if (!teacher) return;
    setPendingAssign({
      classId: selectedClassForAssign.id,
      className: selectedClassForAssign.class_name,
      teacherId: selectedTeacherId,
      teacherName: `${teacher.first_name} ${teacher.last_name}`,
    });
    setConfirmAssignOpen(true);
  };

  const confirmAssign = async () => {
    if (!pendingAssign) return;
    const { classId, teacherId } = pendingAssign;
    const prevClasses = queryClient.getQueryData<any>(["classes"]);
    try {
      if (prevClasses) {
        const next = (prevClasses as any[]).map((c) => {
          const cId = c.id || c._id;
          return cId === classId || String(cId) === String(classId)
            ? { ...c, teacher_id: teacherId }
            : c;
        });
        queryClient.setQueryData(["classes"], next);
      }
      await assignClassMutation.mutateAsync({ classId, teacherId });
      toast.success("Class assigned to teacher successfully");
    } catch (err) {
      if (prevClasses) queryClient.setQueryData(["classes"], prevClasses);
      toast.error("Failed to assign class");
      console.error(err);
    } finally {
      setConfirmAssignOpen(false);
      setPendingAssign(null);
      setAssignDialogOpen(false);
      setSelectedTeacherId("");
    }
  };

  const handleUnassignClass = async (classId: string) => {
    if (window.confirm("Remove this class assignment?")) {
      try {
        await unassignClassMutation.mutateAsync(classId);
        toast.success("Class unassigned successfully");
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getTeacherName = (teacherId: string) => {
    if (!teacherId) return "-";
    const teacher = teachers.find((t: any) => (t.id || t._id) === teacherId);
    return teacher
      ? `${teacher.first_name} ${teacher.last_name}`
      : "Unknown Teacher";
  };

  const stats = useMemo(() => {
    return {
      totalClasses: classes.length,
      assignedClasses: classes.filter((c: any) => c.teacher_id).length,
      unassignedClasses: classes.filter((c: any) => !c.teacher_id).length,
      totalCapacity: classes.reduce((sum: number, c: any) => sum + (c.capacity || 0), 0),
    };
  }, [classes]);

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-lg border border-gray-200 p-4 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon className="w-8 h-8 opacity-20" />
      </div>
    </motion.div>
  );

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PageHeader
          title="Classes Management"
          description="Create and manage classes, assign teachers"
          icon={BookOpen}
        />

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={BookOpen}
            label="Total Classes"
            value={stats.totalClasses}
            color="bg-gradient-to-br from-blue-50 to-blue-100"
          />
          <StatCard
            icon={Users}
            label="Assigned Classes"
            value={stats.assignedClasses}
            color="bg-gradient-to-br from-green-50 to-green-100"
          />
          <StatCard
            icon={BookOpen}
            label="Unassigned Classes"
            value={stats.unassignedClasses}
            color="bg-gradient-to-br from-yellow-50 to-yellow-100"
          />
          <StatCard
            icon={GraduationCap}
            label="Total Capacity"
            value={stats.totalCapacity}
            color="bg-gradient-to-br from-purple-50 to-purple-100"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl p-4 border border-border shadow-md mb-6"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search classes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleAdd} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Class
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editing ? "✏️ Edit Class" : "➕ Add New Class"}
                      </DialogTitle>
                      <DialogDescription>
                        {editing
                          ? "Update class information"
                          : "Create a new class in the system"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Class Name</Label>
                          <Input
                            placeholder="e.g. Form 1A"
                            value={form.class_name}
                            onChange={(e) =>
                              setForm({ ...form, class_name: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Class Code</Label>
                          <Input
                            placeholder="e.g. F1A"
                            value={form.class_code}
                            onChange={(e) =>
                              setForm({ ...form, class_code: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Form Number</Label>
                          <Input
                            type="number"
                            min="1"
                            max="6"
                            value={form.form_number}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                form_number: parseInt(e.target.value) || 1,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Capacity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={form.capacity}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                capacity: parseInt(e.target.value) || 50,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => setDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={submit}>
                          {editing ? "Update" : "Create"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </motion.div>

            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow className="hover:bg-gray-50 border-b-2">
                      <TableHead className="font-semibold">Class Name</TableHead>
                      <TableHead className="font-semibold">Code</TableHead>
                      <TableHead className="font-semibold">Form</TableHead>
                      <TableHead className="font-semibold">Capacity</TableHead>
                      <TableHead className="font-semibold">Teacher</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2 text-gray-500">
                            <BookOpen className="w-8 h-8 opacity-30" />
                            <p>No classes found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((cls: any, idx: number) => (
                        <motion.tr
                          key={cls.id || cls._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="hover:bg-blue-50 border-b transition-colors"
                        >
                          <TableCell className="font-medium">
                            {cls.class_name}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {cls.class_code}
                          </TableCell>
                          <TableCell className="text-sm">
                            <Badge variant="outline">Form {cls.form_number}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {cls.capacity}
                          </TableCell>
                          <TableCell className="text-sm">
                            {cls.teacher_id ? (
                              <Badge className="bg-green-100 text-green-800">
                                {getTeacherName(cls.teacher_id)}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">
                                Unassigned
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog
                                open={
                                  assignDialogOpen &&
                                  selectedClassForAssign?.id === (cls.id || cls._id)
                                }
                                onOpenChange={(open) => {
                                  setAssignDialogOpen(open);
                                  if (!open) {
                                    setSelectedClassForAssign(null);
                                    setSelectedTeacherId("");
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedClassForAssign(cls);
                                      setSelectedTeacherId(cls.teacher_id || "");
                                      setAssignDialogOpen(true);
                                    }}
                                    className="hover:bg-blue-50"
                                  >
                                    <GraduationCap className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Assign Teacher</DialogTitle>
                                    <DialogDescription>
                                      Assign a teacher to {cls.class_name}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Select Teacher</Label>
                                      <Select
                                        value={selectedTeacherId || ""}
                                        onValueChange={(value) =>
                                          setSelectedTeacherId(value)
                                        }
                                      >
                                        <SelectTrigger className="mt-1.5">
                                          <SelectValue placeholder="Choose a teacher" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {teachers.map((teacher: any) => (
                                            <SelectItem
                                              key={teacher.id || teacher._id}
                                              value={
                                                teacher.id || teacher._id
                                              }
                                            >
                                              {teacher.first_name}{" "}
                                              {teacher.last_name}
                                              {teacher.subject &&
                                                ` (${teacher.subject})`}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    {cls.teacher_id && (
                                      <div className="p-3 bg-blue-50 rounded-lg text-sm">
                                        <p className="text-gray-700">
                                          <strong>Current Teacher:</strong>{" "}
                                          {getTeacherName(cls.teacher_id)}
                                        </p>
                                      </div>
                                    )}
                                    <Button
                                      onClick={handleAssignClass}
                                      disabled={
                                        assignClassMutation.isPending ||
                                        !selectedTeacherId
                                      }
                                      className="w-full"
                                    >
                                      Assign Teacher
                                    </Button>
                                    {cls.teacher_id && (
                                      <Button
                                        variant="destructive"
                                        onClick={() =>
                                          handleUnassignClass(
                                            cls.id || cls._id
                                          )
                                        }
                                        className="w-full"
                                      >
                                        Remove Assignment
                                      </Button>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>

                              {/* Confirm Assign Dialog */}
                              <Dialog
                                open={confirmAssignOpen}
                                onOpenChange={setConfirmAssignOpen}
                              >
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Confirm Assignment</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 py-2">
                                    <p>
                                      Assign <strong>{pendingAssign?.className}</strong> to{" "}
                                      <strong>{pendingAssign?.teacherName}</strong>?
                                    </p>
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="secondary"
                                        onClick={() => {
                                          setConfirmAssignOpen(false);
                                          setPendingAssign(null);
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button onClick={confirmAssign}>
                                        Confirm
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(cls)}
                                className="hover:bg-blue-50"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(cls)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default ClassesPage;
