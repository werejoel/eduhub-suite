import { useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users,
  Search,
  Filter,
  Loader,
  CheckCircle2,
  ClipboardList,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  useStudents,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  useClasses,
} from "@/hooks/useDatabase";
import { Student, StudentRequirement } from "@/lib/types";
import {
  getStoreRequirements,
  getStudentRequirements,
  getExpectedFee,
  getClassGroup,
  FEE_STRUCTURE,
} from "@/lib/schoolConfig";

const StudentsPage = () => {
  const { data: students, isLoading } = useStudents();
  const { data: classes = [] } = useClasses();
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const deleteMutation = useDeleteStudent();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterBoardingStatus, setFilterBoardingStatus] =
    useState<string>("all");
  const [filterClassGroup, setFilterClassGroup] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [requirementsDialogOpen, setRequirementsDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentRequirements, setStudentRequirements] = useState<
    StudentRequirement[]
  >([]);
  const [activeTab, setActiveTab] = useState("all");
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    first_name: "",
    last_name: "",
    other_names: "",
    date_of_birth: "",
    gender: "male",
    class_id: "",
    admission_number: "",
    boarding_status: "day",
    registration_fee: FEE_STRUCTURE.registration,
    parents_names: "",
    contact: "",
  });
  const [editForm, setEditForm] = useState({
    class_id: "",
    boarding_status: "day" as "day" | "boarding",
    status: "active" as "active" | "inactive" | "graduated",
    other_names: "",
    parents_names: "",
    contact: "",
    registration_fee: 0,
    date_of_birth: "",
  });

  const getClassName = (classId: string) =>
    classes.find((c) => c.id === classId)?.class_name ||
    classId ||
    "Unassigned";

  const getSectionLabel = (student: Student) => {
    const className = getClassName(student.class_id);
    const type = student.boarding_status === "boarding" ? "Boarding" : "Day";
    return `${className} (${type})`;
  };

  const filteredStudents = (students || []).filter((student) => {
    const fullName =
      `${student.first_name} ${student.other_names || ""} ${student.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      (student.admission_number || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (student.contact || "").includes(searchQuery);
    const matchesClass =
      filterClass === "all" || student.class_id === filterClass;
    const boarding = student.boarding_status || "day";
    const matchesBoardingStatus =
      filterBoardingStatus === "all" || boarding === filterBoardingStatus;
    const className = getClassName(student.class_id);
    const classGroup = getClassGroup(className);
    const matchesClassGroup =
      filterClassGroup === "all" ||
      (filterClassGroup === "baby_top" && classGroup === "baby_top") ||
      (filterClassGroup === "p1_p7" && classGroup === "p1_p7");
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "day" && boarding === "day") ||
      (activeTab === "boarding" && boarding === "boarding");
    return (
      matchesSearch &&
      matchesClass &&
      matchesBoardingStatus &&
      matchesClassGroup &&
      matchesTab
    );
  });

  const dayStudents = (students || []).filter(
    (s) => (s.boarding_status || "day") === "day",
  );
  const boardingStudents = (students || []).filter(
    (s) => s.boarding_status === "boarding",
  );

  const handleOpenEdit = (student: Student) => {
    setSelectedStudent(student);
    setEditForm({
      class_id: student.class_id,
      boarding_status: student.boarding_status || "day",
      status: student.status,
      other_names: student.other_names || "",
      parents_names: student.parents_names || "",
      contact: student.contact || "",
      registration_fee: student.registration_fee || FEE_STRUCTURE.registration,
      date_of_birth: student.date_of_birth || "",
    });
    setEditDialogOpen(true);
  };

  const handleOpenRequirements = (student: Student) => {
    setSelectedStudent(student);
    setStudentRequirements(
      student.requirements_checklist ||
        getStoreRequirements(student.boarding_status || "day"),
    );
    setRequirementsDialogOpen(true);
  };

  const handleDelete = async (student: Student) => {
    try {
      await deleteMutation.mutateAsync(student.id);
    } catch (error) {
      console.error(error);
    }
  };

  const tableData = useMemo(
    () =>
      filteredStudents.map((student) => {
        const checklist =
          student.requirements_checklist ||
          getStoreRequirements(student.boarding_status || "day");
        const completed = checklist.filter((r) => r.completed).length;
        const total = checklist.length;
        return {
          ...student,
          class_id: getClassName(student.class_id),
          section: getSectionLabel(student),
          requirements_progress: `${completed}/${total}`,
          actions: (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="View"
                onClick={() =>
                  toast.info(
                    `Viewing record for ${student.first_name} ${student.last_name}`,
                  )
                }
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Edit student"
                onClick={() => handleOpenEdit(student)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Requirements checklist"
                onClick={() => handleOpenRequirements(student)}
              >
                <ClipboardList className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                title="Delete"
                onClick={() => handleDelete(student)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredStudents, classes],
  );

  const columns = [
    { key: "first_name", label: "First Name" },
    { key: "other_names", label: "Other Names" },
    { key: "last_name", label: "Last Name" },
    { key: "section", label: "Section" },
    { key: "parents_names", label: "Parents" },
    { key: "contact", label: "Contact" },
    { key: "gender", label: "Gender" },
    {
      key: "boarding_status",
      label: "Type",
      render: (value: string) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            value === "boarding"
              ? "bg-blue/10 text-blue"
              : "bg-amber/10 text-amber"
          }`}
        >
          {value === "boarding" ? "Boarding" : "Day"}
        </span>
      ),
    },
    {
      key: "requirements_progress",
      label: "Requirements",
      render: (
        value: string,
        row: Student & { requirements_progress?: string },
      ) => {
        const checklist =
          row.requirements_checklist ||
          getStoreRequirements(row.boarding_status || "day");
        const completed = checklist.filter((r) => r.completed).length;
        const total = checklist.length;
        const allDone = completed === total;
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              allDone
                ? "bg-success/10 text-success"
                : "bg-warning/10 text-warning"
            }`}
          >
            {value}
          </span>
        );
      },
    },
    { key: "enrollment_date", label: "Enrollment Date" },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            value === "active"
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {value}
        </span>
      ),
    },
  ];

  const handleSaveEdit = async () => {
    if (!selectedStudent) return;
    if (!editForm.class_id) {
      toast.error("Please select a class.");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: selectedStudent.id,
        updates: {
          class_id: editForm.class_id,
          boarding_status: editForm.boarding_status,
          status: editForm.status,
          other_names: editForm.other_names,
          parents_names: editForm.parents_names,
          contact: editForm.contact,
          registration_fee: editForm.registration_fee,
          date_of_birth: editForm.date_of_birth,
        },
      });
      setEditDialogOpen(false);
      toast.success("Student updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update student");
    }
  };

  const handleToggleRequirement = (requirementId: string) => {
    setStudentRequirements((prevRequirements) =>
      prevRequirements.map((req) =>
        req.id === requirementId
          ? {
              ...req,
              completed: !req.completed,
              completedDate: !req.completed
                ? new Date().toISOString()
                : undefined,
            }
          : req,
      ),
    );
  };

  const handleSaveRequirements = async () => {
    if (!selectedStudent) return;
    try {
      await updateMutation.mutateAsync({
        id: selectedStudent.id,
        updates: { requirements_checklist: studentRequirements },
      });
      setRequirementsDialogOpen(false);
      toast.success("Requirements updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update requirements");
    }
  };

  const handleAddStudent = async () => {
    if (isAddingStudent) return;
    if (
      !newStudent.first_name ||
      !newStudent.last_name ||
      !newStudent.class_id ||
      !newStudent.admission_number
    ) {
      toast.error(
        "First name, last name, admission number, and class are required.",
      );
      return;
    }
    setIsAddingStudent(true);
    try {
      const boardingStatus = newStudent.boarding_status || "day";
      const className = getClassName(newStudent.class_id!);
      await createMutation.mutateAsync({
        first_name: newStudent.first_name,
        last_name: newStudent.last_name,
        other_names: newStudent.other_names,
        date_of_birth: newStudent.date_of_birth,
        gender: newStudent.gender,
        class_id: newStudent.class_id,
        admission_number: newStudent.admission_number,
        boarding_status: boardingStatus,
        registration_fee:
          newStudent.registration_fee || FEE_STRUCTURE.registration,
        parents_names: newStudent.parents_names,
        contact: newStudent.contact,
        requirements_checklist: getStudentRequirements(
          boardingStatus,
          className,
        ),
        enrollment_date: new Date().toISOString(),
        status: "active",
      });
      setNewStudent({
        first_name: "",
        last_name: "",
        other_names: "",
        date_of_birth: "",
        gender: "male",
        class_id: "",
        admission_number: "",
        boarding_status: "day",
        registration_fee: FEE_STRUCTURE.registration,
        parents_names: "",
        contact: "",
      });
      setDialogOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to add student");
    } finally {
      setIsAddingStudent(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Students Management"
        description="Manage student records, day/boarding sections, and requirements"
        icon={Users}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-[#800020] p-3 shadow-lg sm:flex-row sm:items-center">
                <Button
                  type="button"
                  onClick={() => setDialogOpen(true)}
                  className="h-11 shrink-0 gap-2 bg-emerald-600 px-5 font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  <Users className="h-4 w-4" />
                  Add New Student
                </Button>
                <TabsList className="grid h-auto flex-1 grid-cols-3 gap-1 bg-transparent p-0">
                <TabsTrigger
                  value="all"
                  className="h-11 rounded-lg bg-primary px-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 data-[state=active]:ring-2 data-[state=active]:ring-white sm:text-sm"
                >
                  All Students ({students?.length || 0})
                </TabsTrigger>
                <TabsTrigger
                  value="day"
                  className="h-11 rounded-lg bg-yellow-500 px-2 text-xs font-semibold text-yellow-950 hover:bg-yellow-600 data-[state=active]:ring-2 data-[state=active]:ring-white sm:text-sm"
                >
                  Day Students ({dayStudents.length})
                </TabsTrigger>
                <TabsTrigger
                  value="boarding"
                  className="h-11 rounded-lg bg-primary px-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 data-[state=active]:ring-2 data-[state=active]:ring-white sm:text-sm"
                >
                  Boarding Students ({boardingStudents.length})
                </TabsTrigger>
                </TabsList>
              </div>

              <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-md">
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
                  <Select value={filterClass} onValueChange={setFilterClass}>
                    <SelectTrigger className="w-full sm:w-48">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.class_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterBoardingStatus}
                    onValueChange={setFilterBoardingStatus}
                  >
                    <SelectTrigger className="w-full sm:w-48">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Day / Boarding" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      <SelectItem value="day">Day Students</SelectItem>
                      <SelectItem value="boarding">
                        Boarding Students
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterClassGroup}
                    onValueChange={setFilterClassGroup}
                  >
                    <SelectTrigger className="w-full sm:w-48">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Class level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="baby_top">Baby / Top</SelectItem>
                      <SelectItem value="p1_p7">P1 – P7</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TabsContent value={activeTab} className="space-y-4">
                <div className="flex justify-end mb-4">
                  <p className="text-sm text-muted-foreground">
                    {filteredStudents.length} student(s) found
                  </p>
                </div>
                <DataTable columns={columns} data={tableData} actions={true} />
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Add Student Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={newStudent.first_name}
                      onChange={(e) =>
                        setNewStudent({
                          ...newStudent,
                          first_name: e.target.value,
                        })
                      }
                      placeholder="First name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={newStudent.last_name}
                      onChange={(e) =>
                        setNewStudent({
                          ...newStudent,
                          last_name: e.target.value,
                        })
                      }
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherNames">Other Names</Label>
                  <Input
                    id="otherNames"
                    value={newStudent.other_names || ""}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        other_names: e.target.value,
                      })
                    }
                    placeholder="Middle or other names"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentsNames">Parents Names</Label>
                  <Input
                    id="parentsNames"
                    value={newStudent.parents_names || ""}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        parents_names: e.target.value,
                      })
                    }
                    placeholder="Father and/or mother names"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admission">Admission Number *</Label>
                  <Input
                    id="admission"
                    value={newStudent.admission_number}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        admission_number: e.target.value,
                      })
                    }
                    placeholder="KPS-001"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="class">Class *</Label>
                    <Select
                      value={newStudent.class_id}
                      onValueChange={(value) =>
                        setNewStudent({ ...newStudent, class_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.class_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="boardingStatus">Section *</Label>
                    <Select
                      value={newStudent.boarding_status}
                      onValueChange={(value: "day" | "boarding") =>
                        setNewStudent({ ...newStudent, boarding_status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Day or Boarding" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="boarding">Boarding</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={newStudent.gender}
                      onValueChange={(value: "male" | "female") =>
                        setNewStudent({ ...newStudent, gender: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={newStudent.date_of_birth}
                      onChange={(e) =>
                        setNewStudent({
                          ...newStudent,
                          date_of_birth: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact</Label>
                    <Input
                      id="contact"
                      value={newStudent.contact || ""}
                      onChange={(e) =>
                        setNewStudent({
                          ...newStudent,
                          contact: e.target.value,
                        })
                      }
                      placeholder="+256..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationFee">
                      Registration Fees (UGX)
                    </Label>
                    <Input
                      id="registrationFee"
                      type="number"
                      value={
                        newStudent.registration_fee ||
                        FEE_STRUCTURE.registration
                      }
                      onChange={(e) =>
                        setNewStudent({
                          ...newStudent,
                          registration_fee: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                {newStudent.class_id && (
                  <div className="bg-muted/50 p-3 rounded-lg text-sm">
                    <p className="font-medium">
                      Expected Term Fee: UGX{" "}
                      {getExpectedFee(
                        getClassName(newStudent.class_id),
                        newStudent.boarding_status || "day",
                      ).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAddStudent}
                  disabled={isAddingStudent}
                >
                  {isAddingStudent ? "Adding..." : "Add Student"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Student Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  Edit Student
                  {selectedStudent &&
                    ` — ${selectedStudent.first_name} ${selectedStudent.last_name}`}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Other Names</Label>
                    <Input
                      value={editForm.other_names}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          other_names: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={editForm.date_of_birth}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          date_of_birth: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Parents Names</Label>
                    <Input
                      value={editForm.parents_names}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          parents_names: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact</Label>
                    <Input
                      value={editForm.contact}
                      onChange={(e) =>
                        setEditForm({ ...editForm, contact: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Registration Fees (UGX)</Label>
                  <Input
                    type="number"
                    value={editForm.registration_fee}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        registration_fee: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Select
                    value={editForm.class_id}
                    onValueChange={(value) =>
                      setEditForm({ ...editForm, class_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.class_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section (Day / Boarding) *</Label>
                  <Select
                    value={editForm.boarding_status}
                    onValueChange={(value: "day" | "boarding") =>
                      setEditForm({ ...editForm, boarding_status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="boarding">Boarding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(
                      value: "active" | "inactive" | "graduated",
                    ) => setEditForm({ ...editForm, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="graduated">Graduated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Requirements Checklist Dialog */}
          <Dialog
            open={requirementsDialogOpen}
            onOpenChange={setRequirementsDialogOpen}
          >
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {selectedStudent
                    ? `Requirements — ${selectedStudent.first_name} ${selectedStudent.last_name}`
                    : "Requirements Checklist"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {studentRequirements.map((requirement) => (
                    <div
                      key={requirement.id}
                      className="flex items-center space-x-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <Checkbox
                        id={requirement.id}
                        checked={requirement.completed}
                        onCheckedChange={() =>
                          handleToggleRequirement(requirement.id)
                        }
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={requirement.id}
                          className={`cursor-pointer font-medium transition-colors ${
                            requirement.completed
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {requirement.name}
                        </label>
                        {requirement.completedDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed:{" "}
                            {new Date(
                              requirement.completedDate,
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {requirement.completed && (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="bg-primary/10 p-3 rounded-lg text-sm">
                  <p className="font-medium text-primary">
                    Progress:{" "}
                    {studentRequirements.filter((r) => r.completed).length} of{" "}
                    {studentRequirements.length} completed
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setRequirementsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveRequirements}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Requirements"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
};
export default StudentsPage;
