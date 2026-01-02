import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { useDormitories } from "@/hooks/useDatabase";
import { Building2 } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function DormitoryDashboard() {
  const navigate = useNavigate();
  const { data: dormitories = [], isLoading } = useDormitories();

  const stats = useMemo(() => {
    const totalDorms = (dormitories || []).length;
    const totalCapacity = (dormitories || []).reduce((s, d) => s + (d.capacity || 0), 0);
    const totalOccupancy = (dormitories || []).reduce((s, d) => s + (d.current_occupancy || 0), 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;
    return [
      { title: "Dormitories", value: totalDorms.toString(), change: `${totalCapacity} capacity`, changeType: "neutral" as const, icon: Building2, iconColor: "bg-primary" },
      { title: "Occupancy", value: `${occupancyRate}%`, change: `${totalOccupancy} occupied`, changeType: "neutral" as const, icon: Building2, iconColor: "bg-success" },
    ];
  }, [dormitories]);

  return (
    <DashboardLayout>
      <PageHeader title="Dormitory Dashboard" description="Dormitory occupancy overview" icon={Building2} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
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
          <div className="mt-4 text-right">
            <button onClick={() => navigate('/admin/dormitory')} className="text-primary underline text-sm">Manage</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
 
