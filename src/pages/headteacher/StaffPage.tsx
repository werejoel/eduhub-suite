import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { 
  GraduationCap, 
  Search, 
  Filter, 
  Loader, 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  BookOpen, 
  Award 
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
import {
  useTeachers,
  useCreateTeacher,
  useUpdateTeacher,
  useDeleteTeacher,
  useClasses,
  useAssignClassToTeacher,
  useUnassignClassFromTeacher,
} from "@/hooks/useDatabase";
import { Teacher } from "@/lib/types";

const StaffPage = () => {
  const { data: teachers = [], isLoading } = useTeachers();
  const { data: classes = [] } = useClasses();
  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher();
  const deleteMutation = useDeleteTeacher();
  const assignClassMutation = useAssignClassToTeacher();
  const unassignClassMutation = useUnassignClassFromTeacher();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [selectedTeacherForClass, setSelectedTeacherForClass] = useState<Teacher | null>(null);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [form, setForm] = useState<any>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    subject: "",
    qualification: "",
    status: "active",
  });

  const filtered = (teachers || []).filter((t: any) => {
    const q = searchQuery.toLowerCase();
    const matchesSubject = filterSubject === "all" || t.subject === filterSubject;
    return (
      matchesSubject && (
        `${t.first_name} ${t.last_name}`.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        (t.subject || "").toLowerCase().includes(q)
      )
    );
  });

  const handleAdd = () => {
    setEditing(null);
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      subject: "",
      qualification: "",
      status: "active",
    });
    setDialogOpen(true);
  };

  const handleEdit = (row: any) => {
    setEditing(row);
    setForm({ ...row });
    setDialogOpen(true);
  };

  const handleDelete = async (row: any) => {
    if (!window.confirm("Delete this staff member?")) return;
    try {
      await deleteMutation.mutateAsync(row.id || row._id);
    } catch (err) {
      console.error(err);
    }
  };

  const submit = async () => {
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

  const handleAssignClass = async () => {
    if (!selectedTeacherForClass || !selectedClassId) return;

    try {
      await assignClassMutation.mutateAsync({
        classId: selectedClassId,
        teacherId: selectedTeacherForClass.id,
      });
      setAssignDialogOpen(false);
      setSelectedClassId("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnassignClass = async (classId: string) => {
    if (window.confirm("Remove this class assignment?")) {
      try {
        await unassignClassMutation.mutateAsync(classId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getTeacherClasses = (teacherId: string) => {
    return classes.filter((c: any) => c.teacher_id === teacherId);
  };

  const uniqueSubjects = [
    ...new Set((teachers || []).map((t: any) => t.subject)),
  ].filter(Boolean);

  const stats = useMemo(() => {
    return {
      totalTeachers: teachers.length,
      activeTeachers: teachers.filter((t: any) => t.status !== "inactive").length,
      assignedClasses: classes.filter((c: any) => c.teacher_id).length,
      unassignedClasses: classes.filter((c: any) => !c.teacher_id).length,
    };
  }, [teachers, classes]);

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
          title="Staff Management"
          description="Manage teachers, assign classes, duties, and ratings"
          icon={GraduationCap}
        />

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Users}
            label="Total Teachers"
            value={stats.totalTeachers}
            color="bg-gradient-to-br from-blue-50 to-blue-100"
          />
          <StatCard
            icon={Users}
            label="Active Teachers"
            value={stats.activeTeachers}
            color="bg-gradient-to-br from-green-50 to-green-100"
          />
          <StatCard
            icon={BookOpen}
            label="Assigned Classes"
            value={stats.assignedClasses}
            color="bg-gradient-to-br from-purple-50 to-purple-100"
          />
          <StatCard
            icon={BookOpen}
            label="Unassigned Classes"
            value={stats.unassignedClasses}
            color="bg-gradient-to-br from-yellow-50 to-yellow-100"
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
                    placeholder="Search staff..."
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
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleAdd} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Staff
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editing ? "✏️ Edit Staff" : "➕ Add Staff"}
                      </DialogTitle>
                      <DialogDescription>
                        {editing ? "Update staff information" : "Add a new teacher to the system"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>First Name</Label>
                          <Input
                            value={form.first_name}
                            onChange={(e) =>
                              setForm({ ...form, first_name: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Last Name</Label>
                          <Input
                            value={form.last_name}
                            onChange={(e) =>
                              setForm({ ...form, last_name: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={form.email}
                          onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Subject</Label>
                          <Input
                            value={form.subject}
                            onChange={(e) =>
                              setForm({ ...form, subject: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input
                            value={form.phone}
                            onChange={(e) =>
                              setForm({ ...form, phone: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Qualification</Label>
                        <Input
                          value={form.qualification}
                          onChange={(e) =>
                            setForm({ ...form, qualification: e.target.value })
                          }
                        />
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
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Subject</TableHead>
                      <TableHead className="font-semibold">Classes</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2 text-gray-500">
                            <Users className="w-8 h-8 opacity-30" />
                            <p>No teachers found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((teacher: any, idx: number) => {
                        const teacherClasses = getTeacherClasses(teacher.id);
                        return (
                          <motion.tr
                            key={teacher.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="hover:bg-blue-50 border-b transition-colors"
                          >
                            <TableCell className="font-medium">
                              {teacher.first_name} {teacher.last_name}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {teacher.email}
                            </TableCell>
                            <TableCell className="text-sm">
                              {teacher.subject || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {teacherClasses.length > 0 ? (
                                  teacherClasses.slice(0, 2).map((cls: any) => (
                                    <Badge key={cls.id} variant="outline">
                                      {cls.class_name}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-500">Unassigned</span>
                                )}
                                {teacherClasses.length > 2 && (
                                  <Badge variant="outline">
                                    +{teacherClasses.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  teacher.status === "inactive"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-green-100 text-green-800"
                                }
                              >
                                {teacher.status || "active"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Dialog open={assignDialogOpen && selectedTeacherForClass?.id === teacher.id} onOpenChange={setAssignDialogOpen}>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedTeacherForClass(teacher)}
                                      className="hover:bg-blue-50"
                                    >
                                      <BookOpen className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Assign Class</DialogTitle>
                                      <DialogDescription>
                                        Assign a class to {teacher.first_name} {teacher.last_name}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label>Select Class</Label>
                                        <Select
                                          value={selectedClassId}
                                          onValueChange={setSelectedClassId}
                                        >
                                          <SelectTrigger className="mt-1.5">
                                            <SelectValue placeholder="Choose class" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {classes
                                              .filter(
                                                (c: any) =>
                                                  !c.teacher_id ||
                                                  c.teacher_id === teacher.id
                                              )
                                              .map((cls: any) => (
                                                <SelectItem
                                                  key={cls.id}
                                                  value={cls.id}
                                                >
                                                  {cls.class_name} (Cap: {cls.capacity})
                                                </SelectItem>
                                              ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Current Classes</Label>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {teacherClasses.length > 0 ? (
                                            teacherClasses.map((cls: any) => (
                                              <div key={cls.id} className="flex items-center gap-2">
                                                <Badge>{cls.class_name}</Badge>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => handleUnassignClass(cls.id)}
                                                  className="h-5 px-1 text-xs hover:bg-red-100"
                                                >
                                                  ✕
                                                </Button>
                                              </div>
                                            ))
                                          ) : (
                                            <span className="text-xs text-gray-500">No classes assigned</span>
                                          )}
                                        </div>
                                      </div>
                                      <Button
                                        onClick={handleAssignClass}
                                        disabled={assignClassMutation.isPending || !selectedClassId}
                                        className="w-full"
                                      >
                                        Assign Class
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(teacher)}
                                  className="hover:bg-blue-50"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>

                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(teacher)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => window.location.href = "/headteacher/duties"}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-6 h-6 text-orange-500" />
                  <h3 className="font-semibold text-gray-900">Assign Duties</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Manage teacher duties and assignments
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => window.location.href = "/headteacher/ratings"}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-6 h-6 text-yellow-500" />
                  <h3 className="font-semibold text-gray-900">Rate Teachers</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Evaluate teacher performance and duties
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => window.location.href = "/headteacher/classes"}
              >
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-6 h-6 text-blue-500" />
                  <h3 className="font-semibold text-gray-900">Manage Classes</h3>
                </div>
                <p className="text-sm text-gray-600">
                  View and manage school classes
                </p>
              </motion.div>
            </div>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
};
export default StaffPage;
