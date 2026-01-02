import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { useDormitories, useStudents } from "@/hooks/useDatabase";
import { Building2 } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function DormitoryDashboard() {
  const navigate = useNavigate();
  const { data: dormitories = [], isLoading } = useDormitories();

  const { data: students = [] } = useStudents();

  const stats = useMemo(() => {
    const totalDorms = (dormitories || []).length;
    const totalBeds = (dormitories || []).reduce((s, d) => s + (d.capacity || 0), 0);
    const totalOccupied = (dormitories || []).reduce((s, d) => s + (d.current_occupancy || 0), 0);
    const totalEmpty = Math.max(0, totalBeds - totalOccupied);

    // Students assigned to dorms (handles possible fields `dormitory_id` or `dormitory` on student)
    const assignedStudents = (students || []).filter((s: any) => s.dormitory_id || s.dormitory).length;
    const maleCount = (students || []).filter((s: any) => (s.gender || '').toLowerCase() === 'male').length;
    const femaleCount = (students || []).filter((s: any) => (s.gender || '').toLowerCase() === 'female').length;

    return [
      { title: "Beds", value: totalBeds.toString(), change: `${totalDorms} dorms`, changeType: "neutral" as const, icon: Building2, iconColor: "bg-primary" },
      { title: "Occupied", value: totalOccupied.toString(), change: `${Math.round((totalOccupied/Math.max(1,totalBeds))*100)}%`, changeType: "neutral" as const, icon: Building2, iconColor: "bg-success" },
      { title: "Empty", value: totalEmpty.toString(), change: "Available beds", changeType: "neutral" as const, icon: Building2, iconColor: "bg-warning" },
      { title: "Students", value: assignedStudents.toString(), change: `B:${maleCount} • G:${femaleCount}`, changeType: "neutral" as const, icon: Building2, iconColor: "bg-secondary" },
    ];
  }, [dormitories, students]);

  return (
    <DashboardLayout>
      <PageHeader title="Dormitory Dashboard" description="Dormitory occupancy overview" icon={Building2} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {isLoading
              ? Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-2xl p-6 border border-border animate-pulse" />
                ))
              : stats.map((s) => <StatCard key={s.title} {...s} />)}
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border shadow-md">
            <h3 className="text-lg font-semibold mb-4">Dormitories</h3>
            {dormitories.length === 0 ? (
              <div className="text-muted-foreground">No dormitories configured</div>
            ) : (
              <div className="space-y-3">
                {dormitories.map((d: any) => (
                  <div key={d.id ?? d._id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{d.dormitory_name}</div>
                      <div className="text-sm text-muted-foreground">{d.current_occupancy} / {d.capacity} occupied</div>
                    </div>
                    <div className="w-40">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-2 bg-success" style={{ width: `${Math.round(((d.current_occupancy||0)/(d.capacity||1))*100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-md">
          <h3 className="text-lg font-semibold mb-4">Occupancy Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-56">
              {dormitories.length === 0 ? (
                <div className="text-muted-foreground">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={
                        (() => {
                          const totalCap = (dormitories || []).reduce((s: number, d: any) => s + (d.capacity || 0), 0);
                          const totalOcc = (dormitories || []).reduce((s: number, d: any) => s + (d.current_occupancy || 0), 0);
                          return [
                            { name: 'Occupied', value: totalOcc },
                            { name: 'Available', value: Math.max(0, totalCap - totalOcc) },
                          ];
                        })()
                      }
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      <Cell key="occupied" fill="#10b981" />
                      <Cell key="available" fill="#94a3b8" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="h-56">
              <h4 className="text-sm font-medium mb-2">Gender Breakdown</h4>
              {/** Gender donut chart */}
              {(function () {
                const male = (students || []).filter((s: any) => (s.gender || '').toLowerCase() === 'male').length;
                const female = (students || []).filter((s: any) => (s.gender || '').toLowerCase() === 'female').length;
                const data = [ { name: 'Male', value: male }, { name: 'Female', value: female } ];
                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie dataKey="value" data={data} cx="50%" cy="50%" innerRadius={30} outerRadius={60} label>
                        <Cell key="male" fill="#3b82f6" />
                        <Cell key="female" fill="#ec4899" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          </div>

          <div className="mt-4 text-right">
            <div className="flex justify-end gap-3">
              <button onClick={() => navigate('/dormitory/details')} className="text-primary underline text-sm">Details</button>
              <button onClick={() => navigate('/dormitory/occupancy')} className="text-primary underline text-sm">Report</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
 
