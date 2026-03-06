import PageHeader from "@/components/dashboard/PageHeader";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  useStudents,
  useDormitories,
  useUpdateStudent,
} from "@/hooks/useDatabase";
import { useState, useMemo } from "react";
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
import { toast } from "sonner";

export default function AssignStudents() {
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: dormitories = [], isLoading: loadingDorms } = useDormitories();
  const updateStudent = useUpdateStudent();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedDorm, setSelectedDorm] = useState<string | null>(null);

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
            <div className="w-64">
              <Input
                placeholder="Search students here!"
                value={query}
                onChange={(e: any) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {loadingStudents ? (
            <div className="text-muted-foreground">Loading......</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((s: any) => {
                const dormName =
                  dormitories.find(
                    (d: any) => (d.id || d._id) === s.dormitory_id
                  )?.dormitory_name;

                return (
                  <div
                    key={s.id || s._id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">
                        {s.first_name} {s.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {s.gender} • {s.class_name || ""}
                        {s.dormitory_id && (
                          <>
                            {' • '}
                            {dormName || 'Unknown dorm'}
                            {s.bed_number ? ` (Bed ${s.bed_number})` : ''}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => openAssignDialog(s)}
                        disabled={!canAssign || !selectedDorm}
                      >
                        {s.dormitory_id ? 'Edit' : 'Assign'}
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
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
