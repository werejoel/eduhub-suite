import PageHeader from '@/components/dashboard/PageHeader';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useDormitories } from '@/hooks/useDatabase';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

function buildMonthlySeries(dormitories:any[]) {
  // Simple placeholder: produce last 6 months occupancy totals using current occupancy
  const now = new Date();
  const months = [] as any[];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const totalOcc = dormitories.reduce((s:any, dr:any) => s + (dr.current_occupancy||0), 0);
    months.push({ month: label, occupancy: totalOcc });
  }
  return months;
}

export default function OccupancyReport() {
  const { data: dormitories = [], isLoading } = useDormitories();
  const series = buildMonthlySeries(dormitories || []);

  return (
    <DashboardLayout>
      <PageHeader title="Occupancy Report" description="Detailed occupancy and trends" />
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="text-lg font-semibold mb-4">Occupancy Trend (Last 6 months)</h3>
        {isLoading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="occupancy" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
