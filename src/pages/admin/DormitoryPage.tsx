import { useState } from "react";
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
  Building2,
  Search,
  BedDouble,
  Users,
  Plus,
  Loader,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import StatCard from "@/components/dashboard/StatCard";
import {
  useDormitories,
  useCreateDormitory,
  useUpdateDormitory,
  useDeleteDormitory,
} from "@/hooks/useDatabase";
import { Dormitory } from "@/lib/types";

const columns = [
  { key: "dormitory_name", label: "Dormitory Name" },
  { key: "dormitory_type", label: "Type" },
  { key: "capacity", label: "Capacity" },
  { key: "current_occupancy", label: "Current Occupancy" },
  { key: "location", label: "Location" },
];

function DormitoryPage() {
  const { data: dormitories, isLoading } = useDormitories();
  const createMutation = useCreateDormitory();
  const updateMutation = useUpdateDormitory();
  const deleteMutation = useDeleteDormitory();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDormitory, setNewDormitory] = useState({
    dormitory_name: "",
    dormitory_type: "boys" as const,
    capacity: 0,
    current_occupancy: 0,
    location: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredDormitories = (dormitories || []).filter((dorm) => {
    const matchesSearch = dorm.dormitory_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === "all" || dorm.dormitory_type === filterType;
    return matchesSearch && matchesType;
  });

  const totalCapacity = (dormitories || []).reduce(
    (sum, d) => sum + d.capacity,
    0
  );
  const totalOccupancy = (dormitories || []).reduce(
    (sum, d) => sum + d.current_occupancy,
    0
  );
  const availableBeds = totalCapacity - totalOccupancy;
  const occupancyRate =
    totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  const handleAddDormitory = async () => {
    if (!newDormitory.dormitory_name || newDormitory.capacity <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          updates: {
            dormitory_name: newDormitory.dormitory_name,
            dormitory_type: newDormitory.dormitory_type,
            capacity: newDormitory.capacity,
            current_occupancy: newDormitory.current_occupancy,
            location: newDormitory.location,
          },
        });
      } else {
        await createMutation.mutateAsync({
          dormitory_name: newDormitory.dormitory_name,
          dormitory_type: newDormitory.dormitory_type,
          capacity: newDormitory.capacity,
          current_occupancy: newDormitory.current_occupancy,
          location: newDormitory.location,
        });
      }
      setNewDormitory({
        dormitory_name: "",
        dormitory_type: "boys",
        capacity: 0,
        current_occupancy: 0,
        location: "",
      });
      setEditingId(null);
      setDialogOpen(false);
    } catch (error) {
      console.error(
        editingId ? "Error updating dormitory:" : "Error creating dormitory:",
        error
      );
    }
  };

  const handleEdit = (dorm: Dormitory) => {
    setEditingId(dorm.id as string);
    setNewDormitory({
      dormitory_name: dorm.dormitory_name || "",
      dormitory_type: (dorm.dormitory_type as any) || "boys",
      capacity: dorm.capacity || 0,
      current_occupancy: dorm.current_occupancy || 0,
      location: dorm.location || "",
    });
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this dormitory?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Dormitory Management"
        description="Manage student accommodation and room assignments"
        icon={Building2}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Capacity"
          value={totalCapacity}
          change="beds available"
          icon={BedDouble}
          iconColor="bg-primary"
          delay={0}
        />
        <StatCard
          title="Occupied Beds"
          value={totalOccupancy}
          change={`${occupancyRate}% occupancy`}
          changeType="neutral"
          icon={Users}
          iconColor="bg-success"
          delay={0.1}
        />
        <StatCard
          title="Available Beds"
          value={availableBeds}
          change="ready to assign"
          icon={Building2}
          iconColor="bg-secondary"
          delay={0.2}
        />
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-4 border border-border shadow-md mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search dormitory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48">
              <Building2 className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="boys">Boys</SelectItem>
              <SelectItem value="girls">Girls</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Dormitory
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Edit Dormitory" : "Create New Dormitory"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dorm_name">Dormitory Name</Label>
                  <Input
                    id="dorm_name"
                    placeholder="e.g., Block A"
                    value={newDormitory.dormitory_name}
                    onChange={(e) =>
                      setNewDormitory({
                        ...newDormitory,
                        dormitory_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="dorm_type">Type</Label>
                  <Select
                    value={newDormitory.dormitory_type}
                    onValueChange={(value: any) =>
                      setNewDormitory({
                        ...newDormitory,
                        dormitory_type: value,
                      })
                    }
                  >
                    <SelectTrigger id="dorm_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boys">Boys</SelectItem>
                      <SelectItem value="girls">Girls</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="e.g., 50"
                    value={newDormitory.capacity}
                    onChange={(e) =>
                      setNewDormitory({
                        ...newDormitory,
                        capacity: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Campus East"
                    value={newDormitory.location}
                    onChange={(e) =>
                      setNewDormitory({
                        ...newDormitory,
                        location: e.target.value,
                      })
                    }
                  />
                </div>
                <Button
                  onClick={handleAddDormitory}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="w-full"
                >
                  {editingId
                    ? updateMutation.isPending
                      ? "Saving..."
                      : "Save Changes"
                    : createMutation.isPending
                    ? "Creating..."
                    : "Create Dormitory"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-6 shadow-md"
      >
        <DataTable
          columns={columns}
          data={(filteredDormitories || []).map((dorm) => ({
            ...dorm,
            actions: (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(dorm)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(dorm.id)}
                >
                  Delete
                </Button>
              </div>
            ),
          }))}
          isLoading={isLoading}
        />
      </motion.div>
    </DashboardLayout>
  );
}
export default DormitoryPage;
