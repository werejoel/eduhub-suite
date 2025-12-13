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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Search, BedDouble, Users } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import StatCard from "@/components/dashboard/StatCard";

interface DormitoryRecord {
  id: string;
  studentName: string;
  class: string;
  roomNumber: string;
  building: string;
  bedNumber: string;
  checkInDate: string;
  status: string;
}

const initialRecords: DormitoryRecord[] = [
  { id: "1", studentName: "Alice Johnson", class: "Grade 10A", roomNumber: "101", building: "Block A", bedNumber: "A1", checkInDate: "2024-01-15", status: "Occupied" },
  { id: "2", studentName: "Bob Smith", class: "Grade 9B", roomNumber: "102", building: "Block A", bedNumber: "B2", checkInDate: "2024-01-12", status: "Occupied" },
  { id: "3", studentName: "Carol Williams", class: "Grade 11A", roomNumber: "201", building: "Block B", bedNumber: "A1", checkInDate: "2024-01-10", status: "Occupied" },
  { id: "4", studentName: "David Brown", class: "Grade 8C", roomNumber: "103", building: "Block A", bedNumber: "C3", checkInDate: "2024-01-08", status: "Checked Out" },
  { id: "5", studentName: "Eva Martinez", class: "Grade 12A", roomNumber: "301", building: "Block C", bedNumber: "A1", checkInDate: "2024-01-05", status: "Occupied" },
];

const columns = [
  { key: "studentName", label: "Student" },
  { key: "class", label: "Class" },
  { key: "building", label: "Building" },
  { key: "roomNumber", label: "Room" },
  { key: "bedNumber", label: "Bed" },
  { key: "checkInDate", label: "Check-in Date" },
  {
    key: "status",
    label: "Status",
    render: (value: string) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          value === "Occupied"
            ? "bg-success/10 text-success"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {value}
      </span>
    ),
  },
];

export default function DormitoryPage() {
  const [records, setRecords] = useState<DormitoryRecord[]>(initialRecords);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBuilding, setFilterBuilding] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredRecords = records.filter((record) => {
    const matchesSearch = record.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBuilding = filterBuilding === "all" || record.building === filterBuilding;
    return matchesSearch && matchesBuilding;
  });

  const totalBeds = 200;
  const occupiedBeds = records.filter((r) => r.status === "Occupied").length;
  const availableBeds = totalBeds - occupiedBeds;
  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);

  const uniqueBuildings = [...new Set(records.map((r) => r.building))];

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <PageHeader
        title="Dormitory Management"
        description="Manage student accommodation and room assignments"
        icon={Building2}
        action={{
          label: "Assign Room",
          onClick: () => setDialogOpen(true),
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Capacity"
          value={totalBeds}
          change="beds available"
          icon={BedDouble}
          iconColor="bg-primary"
          delay={0}
        />
        <StatCard
          title="Occupied Beds"
          value={occupiedBeds}
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
              placeholder="Search by student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterBuilding} onValueChange={setFilterBuilding}>
            <SelectTrigger className="w-full sm:w-48">
              <Building2 className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by building" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Buildings</SelectItem>
              {uniqueBuildings.map((building) => (
                <SelectItem key={building} value={building}>
                  {building}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredRecords}
        onEdit={(row) => toast.info(`Edit ${row.studentName}'s room assignment`)}
        onView={(row) => toast.info(`View ${row.studentName}'s details`)}
        onDelete={(row) => {
          setRecords(records.filter((r) => r.id !== row.id));
          toast.success("Room assignment removed");
        }}
      />

      {/* Dialog would go here for assigning rooms */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Room</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new1">New Student 1</SelectItem>
                  <SelectItem value="new2">New Student 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Building</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select building" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Block A">Block A</SelectItem>
                    <SelectItem value="Block B">Block B</SelectItem>
                    <SelectItem value="Block C">Block C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Room Number</Label>
                <Input placeholder="e.g. 101" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bed Number</Label>
              <Input placeholder="e.g. A1" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => { setDialogOpen(false); toast.success("Room assigned successfully"); }}>
              Assign Room
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
