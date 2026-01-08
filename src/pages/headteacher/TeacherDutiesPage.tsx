import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, CheckCircle2, AlertCircle, Clock, Users } from "lucide-react";
import { useTeachers, useDuties, useCreateDuty, useUpdateDuty, useDeleteDuty } from "@/hooks/useDatabase";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { TeacherDuty } from "@/lib/types";

const TeacherDutiesPage = () => {
  const { user } = useAuth();
  const { data: teachers = [] } = useTeachers();
  const { data: duties = [] } = useDuties();
  const createDutyMutation = useCreateDuty();
  const updateDutyMutation = useUpdateDuty();
  const deleteDutyMutation = useDeleteDuty();

  const [isOpen, setIsOpen] = useState(false);
  const [editingDuty, setEditingDuty] = useState<TeacherDuty | null>(null);
  const [formData, setFormData] = useState({
    teacher_id: "",
    duty_name: "",
    description: "",
    start_date: "",
    end_date: "",
  });

  const statusColors: Record<string, string> = {
    assigned: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const handleOpenDialog = (duty?: TeacherDuty) => {
    if (duty) {
      setEditingDuty(duty);
      setFormData({
        teacher_id: duty.teacher_id,
        duty_name: duty.duty_name,
        description: duty.description,
        start_date: duty.start_date.split("T")[0],
        end_date: duty.end_date.split("T")[0],
      });
    } else {
      setEditingDuty(null);
      setFormData({
        teacher_id: "",
        duty_name: "",
        description: "",
        start_date: "",
        end_date: "",
      });
    }
    setIsOpen(true);
  };

  const handleSubmit = async () => {
    if (
      !formData.teacher_id ||
      !formData.duty_name ||
      !formData.start_date ||
      !formData.end_date
    ) {
      return;
    }

    const dutyData = {
      teacher_id: formData.teacher_id,
      duty_name: formData.duty_name,
      description: formData.description,
      assigned_date: new Date().toISOString(),
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
      status: editingDuty?.status || ("assigned" as const),
      assigned_by: user?.id || "",
    };

    if (editingDuty) {
      await updateDutyMutation.mutateAsync({
        id: editingDuty.id,
        updates: dutyData,
      });
    } else {
      await createDutyMutation.mutateAsync(dutyData);
    }

    setIsOpen(false);
    setEditingDuty(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this duty?")) {
      await deleteDutyMutation.mutateAsync(id);
    }
  };

  const teacherMap = useMemo(
    () =>
      Object.fromEntries(
        teachers.map((t) => [t.id, `${t.first_name} ${t.last_name}`])
      ),
    [teachers]
  );

  // Analytics calculations
  const analytics = useMemo(() => {
    const assigned = duties.filter(d => d.status === "assigned").length;
    const inProgress = duties.filter(d => d.status === "in_progress").length;
    const completed = duties.filter(d => d.status === "completed").length;
    const cancelled = duties.filter(d => d.status === "cancelled").length;
    
    const today = new Date();
    const upcoming = duties.filter(d => new Date(d.start_date) > today).length;
    const overdue = duties.filter(d => new Date(d.end_date) < today && d.status !== "completed").length;
    
    return {
      total: duties.length,
      assigned,
      inProgress,
      completed,
      cancelled,
      upcoming,
      overdue,
      completionRate: duties.length > 0 ? Math.round((completed / duties.length) * 100) : 0,
    };
  }, [duties]);

  const StatCard = ({ icon: Icon, label, value, color, trend }: any) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-lg border border-gray-200 p-4 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && <p className="text-xs text-gray-500 mt-1">{trend}</p>}
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
          title="Assign Teacher Duties"
          description="Manage and assign duties to teachers"
        />

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Users}
            label="Total Duties"
            value={analytics.total}
            color="bg-gradient-to-br from-blue-50 to-blue-100"
          />
          <StatCard
            icon={Clock}
            label="Assigned"
            value={analytics.assigned}
            color="bg-gradient-to-br from-purple-50 to-purple-100"
          />
          <StatCard
            icon={AlertCircle}
            label="In Progress"
            value={analytics.inProgress}
            color="bg-gradient-to-br from-yellow-50 to-yellow-100"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={analytics.completed}
            color="bg-gradient-to-br from-green-50 to-green-100"
          />
        </div>

        {/* Additional Stats */}
        {analytics.overdue > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900">{analytics.overdue} overdue duties</p>
              <p className="text-sm text-red-700">Some duties have passed their end date</p>
            </div>
          </motion.div>
        )}

        <div className="mb-6">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                Assign New Duty
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingDuty ? "✏️ Edit Duty" : "➕ Assign New Duty"}
                </DialogTitle>
                <DialogDescription>
                  {editingDuty
                    ? "Update the duty details below"
                    : "Create a new duty assignment for a teacher"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <Label className="font-semibold">Teacher</Label>
                  <Select
                    value={formData.teacher_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, teacher_id: value })
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.first_name} {teacher.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-semibold">Duty Name</Label>
                  <Input
                    placeholder="e.g., Exam Invigilation"
                    value={formData.duty_name}
                    onChange={(e) =>
                      setFormData({ ...formData, duty_name: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="font-semibold">Description</Label>
                  <Textarea
                    placeholder="Detailed description of the duty"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="mt-1.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Start Date</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, start_date: e.target.value })
                      }
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="font-semibold">End Date</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, end_date: e.target.value })
                      }
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={createDutyMutation.isPending || updateDutyMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold"
                >
                  {editingDuty ? "Update Duty" : "Assign Duty"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Duty Assignments</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow className="hover:bg-gray-50 border-b-2">
                  <TableHead className="font-semibold">Teacher</TableHead>
                  <TableHead className="font-semibold">Duty Name</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold">Start Date</TableHead>
                  <TableHead className="font-semibold">End Date</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Clock className="w-8 h-8 opacity-30" />
                        <p>No duties assigned yet</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  duties.map((duty, idx) => (
                    <motion.tr
                      key={duty.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-blue-50 border-b transition-colors"
                    >
                      <TableCell className="font-medium">
                        {teacherMap[duty.teacher_id] || "Unknown"}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {duty.duty_name}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs">
                        {duty.description.substring(0, 50)}...
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(duty.start_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(duty.end_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[duty.status]}>
                          {duty.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(duty)}
                            className="hover:bg-blue-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(duty.id)}
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

        {duties.length === 0 && (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Clock className="w-8 h-8 opacity-30" />
              <p>No duties assigned yet</p>
            </div>
          </Card>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default TeacherDutiesPage;
