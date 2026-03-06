import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDormitories, useStudents } from "@/hooks/useDatabase";
import {
  Building2,
  Users,
  AlertCircle,
  TrendingUp,
  Search,
  MoreVertical,
  Eye,
  FileText,
  Loader,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Bed
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, BarChart, Bar } from "recharts";
import { motion } from "framer-motion";





function DormitoryDashboard() {
  const navigate = useNavigate();
  const { data: dormitories = [], isLoading } = useDormitories();
  const { data: students = [] } = useStudents();
  const [searchQuery, setSearchQuery] = useState("");
 //const [filterGender, setFilterGender] = useState<string>("all");
  const [selectedDorm, setSelectedDorm] = useState<any>(null);

  const stats = useMemo(() => {
    const totalDorms = (dormitories || []).length;
    const totalBeds = (dormitories || []).reduce((s, d) => s + (d.capacity || 0), 0);
    const totalOccupied = (dormitories || []).reduce((s, d) => s + (d.current_occupancy || 0), 0);
    const totalEmpty = Math.max(0, totalBeds - totalOccupied);
    const occupancyRate = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0;

    const assignedStudents = (students || []).filter((s: any) => s.dormitory_id || s.dormitory).length;
    const maleCount = (students || []).filter((s: any) => (s.gender || "").toLowerCase() === "male").length;
    const femaleCount = (students || []).filter((s: any) => (s.gender || "").toLowerCase() === "female").length;

    const overfilledDorms = (dormitories || []).filter((d: any) => (d.current_occupancy || 0) > (d.capacity || 0)).length;

    return {
      totalDorms,
      totalBeds,
      totalOccupied,
      totalEmpty,
      occupancyRate,
      assignedStudents,
      maleCount,
      femaleCount,
      overfilledDorms,
    };
  }, [dormitories, students]);

  const statCards = useMemo(() => {
    const occupancyChangeType: "negative" | "positive" = stats.occupancyRate > 90 ? "negative" : "positive";
    const emptyBedsChangeType: "positive" | "negative" = stats.totalEmpty > 0 ? "positive" : "negative";

    return [
      {
        title: "Total Dormitories",
        value: stats.totalDorms.toString(),
        change: `${stats.totalBeds} total beds`,
        changeType: "neutral" as const,
        icon: Building2,
        iconColor: "bg-blue-500",
        delay: 0,
      },
      {
        title: "Occupancy Rate",
        value: `${stats.occupancyRate}%`,
        change: `${stats.totalOccupied}/${stats.totalBeds} beds`,
        changeType: occupancyChangeType,
        icon: TrendingUp,
        iconColor: "bg-green-500",
        delay: 0.1,
      },
      {
        title: "Empty Beds",
        value: stats.totalEmpty.toString(),
        change: "Available for assignment",
        changeType: emptyBedsChangeType,
        icon: Bed,
        iconColor: "bg-amber-500",
        delay: 0.2,
      },
      {
        title: "Assigned Students",
        value: stats.assignedStudents.toString(),
        change: `M:${stats.maleCount} • F:${stats.femaleCount}`,
        changeType: "neutral" as const,
        icon: Users,
        iconColor: "bg-purple-500",
        delay: 0.3,
      },
    ];
  }, [stats]);

  const filteredDorms = (dormitories || []).filter((d: any) => {
    const matchesSearch = d.dormitory_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const dormOccupancyData = (dormitories || [])
    .slice(0, 6)
    .map((d: any) => ({
      name: d.dormitory_name,
      occupied: d.current_occupancy || 0,
      available: Math.max(0, (d.capacity || 0) - (d.current_occupancy || 0)),
    }));

  const genderData = [
    { name: "Male", value: stats.maleCount, color: "#3b82f6" },
    { name: "Female", value: stats.femaleCount, color: "#ec4899" },
  ];

  const occupancyChartData = [
    { name: "Occupied", value: stats.totalOccupied, color: "#10b981" },
    { name: "Available", value: stats.totalEmpty, color: "#94a3b8" },
  ];

  const getOccupancyStatus = (occupied: number, capacity: number) => {
    const rate = capacity > 0 ? (occupied / capacity) * 100 : 0;
    if (rate >= 100) return { label: "Full", color: "bg-red-100 text-red-800", icon: AlertCircle };
    if (rate >= 90) return { label: "Nearly Full", color: "bg-amber-100 text-amber-800", icon: AlertTriangle };
    if (rate >= 50) return { label: "Good", color: "bg-green-100 text-green-800", icon: CheckCircle2 };
    return { label: "Available", color: "bg-blue-100 text-blue-800", icon: CheckCircle2 };
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

  return (
    <DashboardLayout>
      <PageHeader
        title="Dormitory Management"
        description="Monitor occupancy, manage assignments, and oversee student housing"
        icon={Building2}
      />

      {/* Alert Banner */}
      {stats.overfilledDorms > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6"
        >
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800">{stats.overfilledDorms} dormitory/ies are overfilled</h4>
              <p className="text-sm text-red-700">Some dormitories have exceeded their capacity. Review assignments immediately.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </motion.div>

      {/* Charts Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
      >
        {/* Occupancy Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              Dormitory Occupancy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dormOccupancyData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No dormitory data</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dormOccupancyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="occupied" stackId="a" fill="#10b981" name="Occupied" />
                  <Bar dataKey="available" stackId="a" fill="#94a3b8" name="Available" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-5 h-5" />
              Gender Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {genderData.every((d) => d.value === 0) ? (
              <div className="text-center py-8 text-muted-foreground">No student data</div>
            ) : (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie dataKey="value" data={genderData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} label>
                        {genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {genderData.map((item) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dormitories List with Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Dormitories Overview
              </CardTitle>
              <Button onClick={() => navigate("/dormitory/details")} size="sm" className="gap-2">
                <Eye className="w-4 h-4" />
                View Details
              </Button>
            </div>
            <div className="mt-4 flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search dormitories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {filteredDorms.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No dormitories found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDorms.map((dorm: any, index: number) => {
                  const status = getOccupancyStatus(dorm.current_occupancy || 0, dorm.capacity || 1);
                  const StatusIcon = status.icon;
                  const occupancyPercent = dorm.capacity > 0 ? Math.round(((dorm.current_occupancy || 0) / dorm.capacity) * 100) : 0;

                  return (
                    <motion.div
                      key={dorm.id ?? dorm._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{dorm.dormitory_name}</h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <MapPin className="w-3 h-3" />
                                {dorm.location || "Location not specified"}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                            <div className="bg-muted/50 rounded p-2">
                              <p className="text-xs text-muted-foreground">Total Beds</p>
                              <p className="font-bold text-base">{dorm.capacity}</p>
                            </div>
                            <div className="bg-muted/50 rounded p-2">
                              <p className="text-xs text-muted-foreground">Occupied</p>
                              <p className="font-bold text-base">{dorm.current_occupancy || 0}</p>
                            </div>
                            <div className="bg-muted/50 rounded p-2">
                              <p className="text-xs text-muted-foreground">Available</p>
                              <p className="font-bold text-base">{Math.max(0, (dorm.capacity || 0) - (dorm.current_occupancy || 0))}</p>
                            </div>
                            <div className="bg-muted/50 rounded p-2">
                              <p className="text-xs text-muted-foreground">Usage</p>
                              <p className="font-bold text-base text-primary">{occupancyPercent}%</p>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Occupancy Progress</span>
                              <Badge className={status.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {status.label}
                              </Badge>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className={`h-2 ${occupancyPercent >= 100 ? "bg-red-500" : occupancyPercent >= 90 ? "bg-amber-500" : "bg-success"}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedDorm(dorm)}
                                className="gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>{selectedDorm?.dormitory_name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Total Capacity</p>
                                    <p className="text-2xl font-bold">{selectedDorm?.capacity}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Currently Occupied</p>
                                    <p className="text-2xl font-bold text-primary">{selectedDorm?.current_occupancy || 0}</p>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Location</p>
                                  <p className="font-medium">{selectedDorm?.location || "Not specified"}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Description</p>
                                  <p className="text-sm">{selectedDorm?.description || "No description"}</p>
                                </div>
                                <Button onClick={() => navigate(`/dormitory/${selectedDorm?.id ?? selectedDorm?._id}`)} className="w-full">
                                  Manage Dormitory
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/dormitory/${dorm.id ?? dorm._id}`)}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8"
      >
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/dormitory/details")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold">Dormitory Details</h4>
                <p className="text-sm text-muted-foreground">View full dormitory information</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/dormitory/occupancy")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold">Occupancy Report</h4>
                <p className="text-sm text-muted-foreground">Generate detailed reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/students")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold">Manage Students</h4>
                <p className="text-sm text-muted-foreground">Assign & manage students</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
export default DormitoryDashboard;