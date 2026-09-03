import { useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  GraduationCap,
  Search,
  Filter,
  Loader,
  BookOpen,
  Edit2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
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

function TeachersPage() {
  const { data: teachers, isLoading } = useTeachers();
  const { data: classes = [] } = useClasses();
  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher();
  const deleteMutation = useDeleteTeacher();
  const assignClassMutation = useAssignClassToTeacher();
  const unassignClassMutation = useUnassignClassFromTeacher();
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [confirmAssignOpen, setConfirmAssignOpen] = useState(false);
  const [pendingAssign, setPendingAssign] = useState<{
    teacherId: string;
    teacherName: string;
    classId: string;
  } | null>(null);
  const [unassignConfirmOpen, setUnassignConfirmOpen] = useState(false);
  const [unassignClassId, setUnassignClassId] = useState<string | null>(null);

  const [newTeacher, setNewTeacher] = useState<Partial<
    Omit<Teacher, "id" | "createdAt" | "updatedAt">
  >>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    subject: "",
    qualification: "",
    employee_id: "",
  });

  const getTeacherClasses = (teacherId: string) =>
    classes.filter((c) => String(c.teacher_id) === String(teacherId));

  const filteredTeachers = (teachers || []).filter((teacher) => {
    const fullName = `${teacher.first_name} ${teacher.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject =
      filterSubject === "all" || teacher.subject === filterSubject;
    return matchesSearch && matchesSubject;
  });

  const uniqueSubjects = [
    ...new Set((teachers || []).map((t) => t.subject)),
  ].filter(Boolean);

  const stats = useMemo(
    () => ({
      totalTeachers: teachers?.length || 0,
      withClasses: (teachers || []).filter(
        (t) => getTeacherClasses(t.id).length > 0
      ).length,
      unassignedClasses: classes.filter((c) => !c.teacher_id).length,
    }),
    [teachers, classes]
  );

  const handleAddTeacher = async () => {
    if (
      !newTeacher.first_name ||
      !newTeacher.last_name ||
      !newTeacher.email ||
      !newTeacher.subject
    ) {
      toast.error("All required fields must be completed.");
      return;
    }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          updates: {
            first_name: newTeacher.first_name,
            last_name: newTeacher.last_name,
            email: newTeacher.email,
            phone: newTeacher.phone,
            subject: newTeacher.subject,
            qualification: newTeacher.qualification,
            employee_id: newTeacher.employee_id,
          },
        });
      } else {
        await createMutation.mutateAsync({
          first_name: newTeacher.first_name,
          last_name: newTeacher.last_name,
          email: newTeacher.email,
          phone: newTeacher.phone,
          subject: newTeacher.subject,
          qualification: newTeacher.qualification,
          employee_id: newTeacher.employee_id,
          employment_date: new Date().toISOString(),
          status: "active",
          role: "teacher",
          email_confirmed: false,
        });
      }
      setNewTeacher({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        subject: "",
        qualification: "",
        employee_id: "",
      });
      setEditingId(null);
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (teacher: Teacher) => {
    try {
      await deleteMutation.mutateAsync(teacher.id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingId(teacher.id);
    setNewTeacher({
      first_name: teacher.first_name || "",
      last_name: teacher.last_name || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      subject: teacher.subject || "",
      qualification: teacher.qualification || "",
      employee_id: teacher.employee_id || "",
    });
    setDialogOpen(true);
  };

  const openAssignDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setSelectedClassId("");
    setAssignDialogOpen(true);
  };

  const handleAssignClass = () => {
    if (!selectedTeacher || !selectedClassId) return;
    setPendingAssign({
      teacherId: selectedTeacher.id,
      teacherName: `${selectedTeacher.first_name} ${selectedTeacher.last_name}`,
      classId: selectedClassId,
    });
    setConfirmAssignOpen(true);
  };

  const confirmAssign = async () => {
    if (!pendingAssign) return;
    const { teacherId, classId } = pendingAssign;
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
      toast.success("Class assigned to teacher");
    } catch (err) {
      if (prevClasses) queryClient.setQueryData(["classes"], prevClasses);
      toast.error("Failed to assign class");
      console.error(err);
    } finally {
      setConfirmAssignOpen(false);
      setPendingAssign(null);
      setSelectedClassId("");
    }
  };

  const handleUnassignClass = (classId: string) => {
    setUnassignClassId(classId);
    setUnassignConfirmOpen(true);
  };

  const confirmUnassign = async () => {
    if (!unassignClassId) return;
    try {
      await unassignClassMutation.mutateAsync(unassignClassId);
      toast.success("Class unassigned");
    } catch (err) {
      console.error(err);
    } finally {
      setUnassignConfirmOpen(false);
      setUnassignClassId(null);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Teachers Management"
        description="Manage teachers and assign multiple classes"
        icon={GraduationCap}
        action={{
          label: "Add Teacher",
          onClick: () => {
            setEditingId(null);
            setNewTeacher({
              first_name: "",
              last_name: "",
              email: "",
              phone: "",
              subject: "",
              qualification: "",
              employee_id: "",
            });
            setDialogOpen(true);
          },
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-sm text-muted-foreground">Total Teachers</p>
          <p className="text-2xl font-bold">{stats.totalTeachers}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-sm text-muted-foreground">With Class Assignments</p>
          <p className="text-2xl font-bold">{stats.withClasses}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-sm text-muted-foreground">Unassigned Classes</p>
          <p className="text-2xl font-bold">{stats.unassignedClasses}</p>
        </div>
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border overflow-hidden shadow-md"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Subject</TableHead>
                  <TableHead className="font-semibold">Classes</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No teachers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeachers.map((teacher) => {
                    const teacherClasses = getTeacherClasses(teacher.id);
                    return (
                      <TableRow key={teacher.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {teacher.first_name} {teacher.last_name}
                        </TableCell>
                        <TableCell>{teacher.email}</TableCell>
                        <TableCell>{teacher.subject || "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {teacherClasses.length > 0 ? (
                              teacherClasses.map((cls) => (
                                <Badge key={cls.id} variant="outline">
                                  {cls.class_name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Unassigned
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              teacher.status === "active"
                                ? "bg-success/10 text-success"
                                : "bg-warning/10 text-warning"
                            }`}
                          >
                            {teacher.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Assign classes"
                              onClick={() => openAssignDialog(teacher)}
                            >
                              <BookOpen className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Edit teacher"
                              onClick={() => handleEdit(teacher)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              title="Delete teacher"
                              onClick={() => handleDelete(teacher)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </motion.div>

          {/* Add/Edit Teacher Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Edit Teacher" : "Add New Teacher"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={newTeacher.first_name}
                      onChange={(e) =>
                        setNewTeacher({ ...newTeacher, first_name: e.target.value })
                      }
                      placeholder="First name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={newTeacher.last_name}
                      onChange={(e) =>
                        setNewTeacher({ ...newTeacher, last_name: e.target.value })
                      }
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newTeacher.email}
                    onChange={(e) =>
                      setNewTeacher({ ...newTeacher, email: e.target.value })
                    }
                    placeholder="teacher@school.edu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    value={newTeacher.employee_id}
                    onChange={(e) =>
                      setNewTeacher({ ...newTeacher, employee_id: e.target.value })
                    }
                    placeholder="EMP-001"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={newTeacher.subject}
                      onChange={(e) =>
                        setNewTeacher({ ...newTeacher, subject: e.target.value })
                      }
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newTeacher.phone}
                      onChange={(e) =>
                        setNewTeacher({ ...newTeacher, phone: e.target.value })
                      }
                      placeholder="+256..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input
                    id="qualification"
                    value={newTeacher.qualification}
                    onChange={(e) =>
                      setNewTeacher({
                        ...newTeacher,
                        qualification: e.target.value,
                      })
                    }
                    placeholder="e.g., Bachelor of Science"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddTeacher}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingId
                      ? "Update Teacher"
                      : "Add Teacher"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Assign Class Dialog */}
          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Classes</DialogTitle>
                <DialogDescription>
                  {selectedTeacher &&
                    `Assign classes to ${selectedTeacher.first_name} ${selectedTeacher.last_name}. A teacher can be assigned to multiple classes.`}
                </DialogDescription>
              </DialogHeader>
              {selectedTeacher && (
                <div className="space-y-4">
                  <div>
                    <Label>Select Class</Label>
                    <Select
                      value={selectedClassId}
                      onValueChange={setSelectedClassId}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Choose a class to assign" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes
                          .filter((c) => {
                            if (!c.teacher_id) return true;
                            return String(c.teacher_id) === String(selectedTeacher.id);
                          })
                          .map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.class_name} (Cap: {cls.capacity})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Current Classes</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {getTeacherClasses(selectedTeacher.id).length > 0 ? (
                        getTeacherClasses(selectedTeacher.id).map((cls) => (
                          <div key={cls.id} className="flex items-center gap-1">
                            <Badge>{cls.class_name}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnassignClass(cls.id)}
                              className="h-5 px-1 text-xs hover:bg-destructive/10"
                            >
                              ✕
                            </Button>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No classes assigned
                        </span>
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
              )}
            </DialogContent>
          </Dialog>

          <AlertDialog open={confirmAssignOpen} onOpenChange={setConfirmAssignOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Assignment</AlertDialogTitle>
                <AlertDialogDescription>
                  Assign this class to {pendingAssign?.teacherName}?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex justify-end gap-2">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmAssign}>Assign</AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={unassignConfirmOpen} onOpenChange={setUnassignConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Unassign Class</AlertDialogTitle>
                <AlertDialogDescription>
                  Remove this class from the teacher?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex justify-end gap-2">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmUnassign}>Unassign</AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </DashboardLayout>
  );
}

export default TeachersPage;
