import PageHeader from "@/components/dashboard/PageHeader";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  useStudents,
  useDormitories,
  useUpdateStudent,
  useDeleteStudent,
  useCreateStudent,
} from "@/hooks/useDatabase";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Student } from "@/lib/types";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import DataTable from "@/components/dashboard/DataTable";
import { toast } from "sonner";

export default function AssignStudents() {
  const navigate = useNavigate();
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const createStudent = useCreateStudent();
  const deleteStudent = useDeleteStudent();
  const { data: dormitories = [], isLoading: loadingDorms } = useDormitories();
  const updateStudent = useUpdateStudent();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedDorm, setSelectedDorm] = useState<string | null>(null);

  // new student form
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState<
    Omit<Student, "id" | "createdAt" | "updatedAt">
  >({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "male",
    class_id: "",
    admission_number: "",
    enrollment_date: "",
    status: "active",
  });

  // dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [pendingStudent, setPendingStudent] = useState<any | null>(null);
  const [bedInput, setBedInput] = useState("");

  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
  const [pendingUnassignId, setPendingUnassignId] = useState<string | null>(null);

  const canAssign =
    user && (user.role === "admin" || user.role === "dormitory");

  const filtered = (students || []).filter((s: any) => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    return name.includes(query.toLowerCase());
  });

  const columns = [
    { key: "first_name", label: "First Name" },
    { key: "last_name", label: "Last Name" },
    { key: "gender", label: "Gender" },
    { key: "class_name", label: "Class" },
    {
      key: "dormitory_id",
      label: "Dormitory",
      render: (val: any, row: any) =>
        dormitories.find((d: any) => (d.id || d._id) === val)?.dormitory_name || "",
    },
    { key: "bed_number", label: "Bed" },
  ];

  const assignedCount = useMemo(() => {
    if (!selectedDorm) return 0;
    return (students || []).filter((s: any) => s.dormitory_id === selectedDorm).length;
  }, [students, selectedDorm]);

  const openAssignDialog = (student: any) => {
    if (!canAssign || !selectedDorm) return;
    setPendingStudent(student);
    setBedInput(student?.bed_number || "");
    setAssignDialogOpen(true);
  };

  const handleConfirmAssign = () => {
    if (!pendingStudent || !selectedDorm) return;
    const updates: any = { dormitory_id: selectedDorm };
    if (bedInput.trim()) updates.bed_number = bedInput.trim();
    updateStudent.mutate(
      { id: pendingStudent.id || pendingStudent._id, updates },
      {
        onSuccess: () => {
          toast.success("Student assigned successfully");
        },
        onError: () => {
          toast.error("Failed to assign student");
        },
      }
    );
    setAssignDialogOpen(false);
    setPendingStudent(null);
    setBedInput("");
  };

  const handleStartUnassign = (studentId: string) => {
    if (!canAssign) return;
    setPendingUnassignId(studentId);
    setUnassignDialogOpen(true);
  };

  const handleConfirmUnassign = () => {
    if (!pendingUnassignId) return;
    updateStudent.mutate(
      { id: pendingUnassignId, updates: { dormitory_id: null, bed_number: null } },
      {
        onSuccess: () => toast.success("Student unassigned"),
        onError: () => toast.error("Failed to unassign student"),
      }
    );
    setUnassignDialogOpen(false);
    setPendingUnassignId(null);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Assign Students"
        description="Assign students to dormitory rooms and beds"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Students</h3>
            <div className="flex items-center gap-2">
              <div className="w-64">
                <Input
                  placeholder="Search students here!"
                  value={query}
                  onChange={(e: any) => setQuery(e.target.value)}
                />
              </div>
              <Button size="sm" onClick={() => setAddDialogOpen(true)}>Add Student</Button>
            </div>
          </div>

          {loadingStudents ? (
            <div className="text-muted-foreground">Loading......</div>
          ) : (
            <DataTable
              columns={columns}
              data={filtered.map((s: any) => ({
                ...s,
                dormitory_id: s.dormitory_id,
                bed_number: s.bed_number,
                actions: (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => openAssignDialog(s)}
                      disabled={!canAssign || !selectedDorm}
                    >
                      {s.dormitory_id ? "Edit" : "Assign"}
                    </Button>
                    {s.dormitory_id && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStartUnassign(s.id || s._id)}
                        disabled={!canAssign}
                      >
                        Unassign
                      </Button>
                    )}
                  </div>
                ),
              }))}
              isLoading={loadingStudents}
              onView={(row: any) => {
                toast.info(`${row.first_name} ${row.last_name}`);
              }}
              onEdit={(row: any) => openAssignDialog(row)}
              onDelete={(row: any) => deleteStudent.mutate(row.id || row._id)}
            />
          )}
        </div>

      {/* add student dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(o) => setAddDialogOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>First Name</Label>
              <Input
                value={newStudent.first_name}
                onChange={(e:any) => setNewStudent({...newStudent, first_name: e.target.value})}
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                value={newStudent.last_name}
                onChange={(e:any) => setNewStudent({...newStudent, last_name: e.target.value})}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={newStudent.email}
                onChange={(e:any) => setNewStudent({...newStudent, email: e.target.value})}
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select
                value={newStudent.gender}
                onValueChange={(v: "male" | "female") => setNewStudent({...newStudent, gender: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={newStudent.phone}
                onChange={(e:any) => setNewStudent({...newStudent, phone: e.target.value})}
              />
            </div>
            <div>
              <Label>Date of birth</Label>
              <Input
                type="date"
                value={newStudent.date_of_birth}
                onChange={(e:any) => setNewStudent({...newStudent, date_of_birth: e.target.value})}
              />
            </div>
            <div>
              <Label>Class</Label>
              <Input
                value={newStudent.class_id}
                onChange={(e:any) => setNewStudent({...newStudent, class_id: e.target.value})}
              />
            </div>
            <div>
              <Label>Admission #</Label>
              <Input
                value={newStudent.admission_number}
                onChange={(e:any) => setNewStudent({...newStudent, admission_number: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => {
                setAddDialogOpen(false);
                setNewStudent({
                  first_name: "",
                  last_name: "",
                  email: "",
                  phone: "",
                  date_of_birth: "",
                  gender: "male",
                  class_id: "",
                  admission_number: "",
                  enrollment_date: "",
                  status: "active",
                });
              }}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (!newStudent.first_name || !newStudent.last_name || !newStudent.email) {
                  toast.error('Name and email required');
                  return;
                }
                createStudent.mutate({
                  ...newStudent,
                  enrollment_date: new Date().toISOString(),
                  status: 'active',
                });
                setAddDialogOpen(false);
                setNewStudent({
                  first_name: "",
                  last_name: "",
                  email: "",
                  phone: "",
                  date_of_birth: "",
                  gender: "male",
                  class_id: "",
                  admission_number: "",
                  enrollment_date: "",
                  status: "active",
                });
              }}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-lg font-semibold mb-4">Assignment</h3>
          {!canAssign && (
            <div className="text-sm text-muted-foreground mb-2">
              You do not have permission to assign students.
            </div>
          )}
          <div className="space-y-3">
            <div>
              <Label>Select Dormitory</Label>
              <Select onValueChange={(v) => setSelectedDorm(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose dormitory" />
                </SelectTrigger>
                <SelectContent>
                  {(dormitories || []).map((d: any) => (
                    <SelectItem key={d.id || d._id} value={d.id || d._id}>
                      {d.dormitory_name} ({d.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Selected Dorm</Label>
              <div className="text-sm">
                {(dormitories || []).find(
                  (d: any) => (d.id || d._id) === selectedDorm
                )?.dormitory_name || "None"}
              </div>
              {selectedDorm && (
                <div className="text-xs text-muted-foreground mt-1">
                  {assignedCount} student(s) currently assigned
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* assignment modal */}
      <Dialog
        open={assignDialogOpen}
        onOpenChange={(open) => {
          setAssignDialogOpen(open);
          if (!open) {
            setPendingStudent(null);
            setBedInput("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingStudent
                ? `Assign ${pendingStudent.first_name} ${pendingStudent.last_name}`
                : 'Assign Student'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Selected Dorm</Label>
              <div className="text-sm font-medium">
                {(dormitories || []).find(
                  (d: any) => (d.id || d._id) === selectedDorm
                )?.dormitory_name || ''}
              </div>
            </div>
            <div>
              <Label>Bed number (optional)</Label>
              <Input
                value={bedInput}
                onChange={(e: any) => setBedInput(e.target.value)}
                placeholder="e.g. 12A"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setAssignDialogOpen(false);
                  setPendingStudent(null);
                  setBedInput("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmAssign}>Confirm</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* unassign confirmation */}
      <Dialog
        open={unassignDialogOpen}
        onOpenChange={(open) => {
          setUnassignDialogOpen(open);
          if (!open) setPendingUnassignId(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Unassign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p>Are you sure you want to remove this student's dorm assignment?</p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setUnassignDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmUnassign}>
                Unassign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
