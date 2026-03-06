import PageHeader from "@/components/dashboard/PageHeader";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDormitories, useOccupancySnapshots } from "@/hooks/useDatabase";
import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// build series from snapshot data for the last 6 months
// capacitySum is constant for the filtered dormitories (all or selected)
function buildMonthlySeriesFromSnapshots(
  snapshots: any[],
  capacitySum: number,
) {
  const now = new Date();
  const months: any[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = monthStart.toLocaleDateString("en-US", { month: "short" });
    const monthSnaps = snapshots.filter((s: any) => {
      const d = new Date(s.recorded_at);
      return (
        d.getFullYear() === monthStart.getFullYear() &&
        d.getMonth() === monthStart.getMonth()
      );
    });
    let occupancy = 0;
    if (monthSnaps.length > 0) {
      occupancy = monthSnaps[monthSnaps.length - 1].current_occupancy || 0;
    }
    const empty = Math.max(0, capacitySum - occupancy);
    months.push({ month: label, occupancy, empty });
  }
  return months;
}

// build multi‑dorm series; each dorm becomes its own line key
function buildMultiSeriesFromSnapshots(snapshots: any[], dormitories: any[]) {
  const now = new Date();
  const labels: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(monthStart.toLocaleDateString("en-US", { month: "short" }));
  }
  const names = dormitories.map((d: any) => d.dormitory_name);
  const series: any[] = [];
  labels.forEach((label) => {
    const entry: any = { month: label };
    names.forEach((n: string) => (entry[n] = 0));
    snapshots.forEach((s: any) => {
      const d = new Date(s.recorded_at);
      const m = d.toLocaleDateString("en-US", { month: "short" });
      if (m === label) {
        entry[s.dormitory_name] = s.current_occupancy || 0;
      }
    });
    series.push(entry);
  });
  return series;
}

export default function OccupancyReport() {
  const { data: dormitories = [], isLoading: dormLoading } = useDormitories();
  const [selectedDorm, setSelectedDorm] = useState<string | null>(null);
  const ALL_KEY = "__all";
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // always fetch full snapshot list; we apply dorm/date filters on client
  const { data: snapshots = [], isLoading: snapsLoading } =
    useOccupancySnapshots();

  const loading = dormLoading || snapsLoading;

  // filter snapshots by dorm and date range
  const filteredSnapshots = useMemo(() => {
    let arr = snapshots || [];
    if (selectedDorm) {
      arr = arr.filter(
        (s: any) => (s.dormitory_id || s.dormitory) === selectedDorm,
      );
    }
    if (startDate) {
      arr = arr.filter(
        (s: any) => new Date(s.recorded_at) >= new Date(startDate),
      );
    }
    if (endDate) {
      arr = arr.filter(
        (s: any) => new Date(s.recorded_at) <= new Date(endDate),
      );
    }
    return arr;
  }, [snapshots, selectedDorm, startDate, endDate]);

  // compute capacity total for current filter
  const capacityTotal = useMemo(() => {
    if (selectedDorm) {
      const d = dormitories.find((d: any) => (d.id || d._id) === selectedDorm);
      return d ? d.capacity || 0 : 0;
    }
    return dormitories.reduce((s: number, d: any) => s + (d.capacity || 0), 0);
  }, [dormitories, selectedDorm]);

  // overall stats
  const currentData = useMemo(() => {
    if (selectedDorm) {
      const d = dormitories.find((d: any) => (d.id || d._id) === selectedDorm);
      return d
        ? { capacity: d.capacity || 0, occupancy: d.current_occupancy || 0 }
        : { capacity: 0, occupancy: 0 };
    }
    const capacity = dormitories.reduce(
      (s: number, d: any) => s + (d.capacity || 0),
      0,
    );
    const occupancy = dormitories.reduce(
      (s: number, d: any) => s + (d.current_occupancy || 0),
      0,
    );
    return { capacity, occupancy };
  }, [dormitories, selectedDorm]);

  const utilization = currentData.capacity
    ? Math.round((currentData.occupancy / currentData.capacity) * 100)
    : 0;

  // compute chart series from filtered snapshots
  const series = useMemo(() => {
    if ((filteredSnapshots || []).length === 0) {
      // fallback to current occupancy numbers
      const now = new Date();
      const months: any[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = monthStart.toLocaleDateString("en-US", {
          month: "short",
        });
        const occ = currentData.occupancy;
        const emp = Math.max(0, capacityTotal - occ);
        months.push({ month: label, occupancy: occ, empty: emp });
      }
      return months;
    }
    return buildMonthlySeriesFromSnapshots(filteredSnapshots, capacityTotal);
  }, [filteredSnapshots, capacityTotal, currentData]);

  // when no dorm selected, build multi‑line series
  const multiSeries = useMemo(() => {
    if (selectedDorm) return [];
    if ((filteredSnapshots || []).length === 0) {
      // each dorm constant line from current occupancy
      const now = new Date();
      const labels: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(monthStart.toLocaleDateString("en-US", { month: "short" }));
      }
      return labels.map((label) => {
        const entry: any = { month: label };
        dormitories.forEach((d: any) => {
          entry[d.dormitory_name] = d.current_occupancy || 0;
        });
        return entry;
      });
    }
    return buildMultiSeriesFromSnapshots(filteredSnapshots, dormitories);
  }, [filteredSnapshots, dormitories, selectedDorm]);

  // table data
  const tableRows = useMemo(() => {
    return dormitories.map((d: any) => ({
      id: d.id || d._id,
      name: d.dormitory_name,
      occupancy: d.current_occupancy || 0,
      capacity: d.capacity || 0,
    }));
  }, [dormitories]);

  // recent list reflects the current filters (dorm and date range)
  const recentSnapshots = useMemo(() => {
    return [...filteredSnapshots]
      .sort(
        (a: any, b: any) =>
          new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
      )
      .slice(0, 10);
  }, [filteredSnapshots]);

  return (
    <DashboardLayout>
      <PageHeader
        title="Occupancy Report"
        description="Detailed occupancy and trends"
      />
      <div className="space-y-6">
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 space-y-2 sm:space-y-0">
            <h3 className="text-lg font-semibold">
              Occupancy Trend (Last 6 months)
            </h3>
            <div className="flex flex-wrap gap-2 items-center">
              {/* sentinel value avoids empty-string*/}
              <Select
                value={selectedDorm ?? ALL_KEY}
                onValueChange={(v) => setSelectedDorm(v === ALL_KEY ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All dorms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_KEY}>All dorms</SelectItem>
                  {dormitories.map((d: any) => (
                    <SelectItem key={d.id || d._id} value={d.id || d._id}>
                      {d.dormitory_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-1">
                <label className="text-sm">From</label>
                <Input
                  type="date"
                  value={startDate || ""}
                  onChange={(e) => setStartDate(e.target.value || null)}
                  className="h-8"
                />
              </div>
              <div className="flex items-center space-x-1">
                <label className="text-sm">To</label>
                <Input
                  type="date"
                  value={endDate || ""}
                  onChange={(e) => setEndDate(e.target.value || null)}
                  className="h-8"
                />
              </div>
              <Button
                size="sm"
                onClick={() => {
                  const rows = filteredSnapshots.map(
                    (s: any) =>
                      `${s.recorded_at},${s.dormitory_name || ""},${s.current_occupancy || 0},${s.capacity || 0}`,
                  );
                  const csv = [
                    "recorded_at,dormitory_name,current_occupancy,capacity",
                    ...rows,
                  ].join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "occupancy_export.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export CSV
              </Button>
            </div>
          </div>
          {loading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {selectedDorm ? (
                  <BarChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="empty" stackId="a" fill="#ef4444" />
                    <Bar dataKey="occupancy" stackId="a" fill="#10b981" />
                  </BarChart>
                ) : (
                  <LineChart data={multiSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    {dormitories.map((d: any, idx: number) => (
                      <Line
                        key={idx}
                        type="monotone"
                        dataKey={d.dormitory_name}
                        stroke={
                          ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"][idx % 4]
                        }
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* summary stats */}
        <div className="bg-card rounded-2xl p-6 border border-border flex justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Capacity</div>
            <div className="text-xl font-semibold">{currentData.capacity}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Occupied</div>
            <div className="text-xl font-semibold">{currentData.occupancy}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Utilization</div>
            <div className="text-xl font-semibold">{utilization}%</div>
          </div>
        </div>

        {/* dorm table */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-lg font-semibold mb-4">Dormitory Breakdown</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Occupancy</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Utilization</TableCell>
              </TableRow>
            </TableHeader>
            <tbody>
              {tableRows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.occupancy}</TableCell>
                  <TableCell>{r.capacity}</TableCell>
                  <TableCell>
                    {r.capacity
                      ? Math.round((r.occupancy / r.capacity) * 100)
                      : 0}
                    %
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </div>

        {/* recent snapshots */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-lg font-semibold mb-4">
            Recent Occupancy Snapshots
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Dormitory</TableCell>
                <TableCell>Occupancy</TableCell>
                <TableCell>Capacity</TableCell>
              </TableRow>
            </TableHeader>
            <tbody>
              {recentSnapshots.map((s: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>
                    {new Date(s.recorded_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{s.dormitory_name || "All"}</TableCell>
                  <TableCell>{s.current_occupancy || 0}</TableCell>
                  <TableCell>{s.capacity || 0}</TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
