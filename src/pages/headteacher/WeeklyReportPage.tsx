import { useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { FileText, Download, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useStudents,
  useFees,
  useAttendance,
  useClasses,
} from "@/hooks/useDatabase";
import { formatUGX } from "@/lib/utils";
import { getExpectedFee } from "@/lib/schoolConfig";
import { exportToExcel } from "@/lib/exportToExcel";
import { toast } from "sonner";

const CHECKLIST_ITEMS = [
  { key: "staff_meeting", label: "Staff meeting held" },
  { key: "class_visits", label: "Class visits completed" },
  { key: "discipline", label: "Discipline cases reviewed" },
  { key: "fees_followup", label: "Fees follow-up done" },
  { key: "parent_calls", label: "Parent calls / meetings" },
  { key: "safety", label: "Safety & welfare check" },
] as const;

export default function HeadteacherWeeklyReportPage() {
  const { data: students = [], isLoading: sLoading } = useStudents();
  const { data: fees = [], isLoading: fLoading } = useFees();
  const { data: attendance = [], isLoading: aLoading } = useAttendance();
  const { data: classes = [] } = useClasses();

  const [weekEnding, setWeekEnding] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [preparedBy, setPreparedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  const className = (classId: string) =>
    classes.find((c) => c.id === classId)?.class_name || "—";

  const summary = useMemo(() => {
    const active = students.filter((s) => s.status === "active");
    const dayCount = active.filter(
      (s) => (s.boarding_status || "day") === "day",
    ).length;
    const boardingCount = active.filter(
      (s) => s.boarding_status === "boarding",
    ).length;

    let expectedTuition = 0;
    let expectedOther = 0;
    active.forEach((s) => {
      expectedTuition += getExpectedFee(
        className(s.class_id),
        s.boarding_status || "day",
      );
      expectedOther += Number(s.other_fees || 0);
    });

    const collected = fees
      .filter((f) => f.payment_status === "paid")
      .reduce((sum, f) => sum + Number(f.amount || 0), 0);

    const weekStart = new Date(weekEnding);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekAttendance = attendance.filter((a) => {
      const d = new Date(a.attendance_date);
      return d >= weekStart && d <= new Date(weekEnding);
    });
    const present = weekAttendance.filter((a) => a.status === "present").length;
    const absent = weekAttendance.filter((a) => a.status === "absent").length;
    const late = weekAttendance.filter((a) => a.status === "late").length;

    const trackingPending = active.filter((s) => {
      const list = s.tracking_checklist || [];
      if (list.length === 0) return Boolean(s.tracking_number);
      return !list.every((i) => i.done);
    }).length;

    return {
      active: active.length,
      dayCount,
      boardingCount,
      expectedTuition,
      expectedOther,
      expectedTotal: expectedTuition + expectedOther,
      collected,
      outstanding: Math.max(0, expectedTuition + expectedOther - collected),
      present,
      absent,
      late,
      trackingPending,
    };
  }, [students, fees, attendance, classes, weekEnding]);

  const exportReport = () => {
    exportToExcel(
      [
        {
          "Week ending": weekEnding,
          "Active students": summary.active,
          "Day students": summary.dayCount,
          "Boarding students": summary.boardingCount,
          "Expected tuition (UGX)": summary.expectedTuition,
          "Other fees expected (UGX)": summary.expectedOther,
          "Total expected (UGX)": summary.expectedTotal,
          "Fees collected (UGX)": summary.collected,
          "Outstanding (UGX)": summary.outstanding,
          "Attendance present": summary.present,
          "Attendance absent": summary.absent,
          "Attendance late": summary.late,
          "Tracking incomplete": summary.trackingPending,
          "Prepared by": preparedBy,
          Notes: notes,
        },
      ],
      `Headteacher_Weekly_${weekEnding}`,
    );
    toast.success("Weekly report exported");
  };

  const loading = sLoading || fLoading || aLoading;

  return (
    <DashboardLayout>
      <PageHeader
        title="Weekly Report"
        description="Head teacher summary — fees, attendance, tracking checklist"
        icon={FileText}
        action={{ label: "Export Excel", onClick: exportReport }}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Students (active)</p>
              <p className="text-2xl font-bold">{summary.active}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Day {summary.dayCount} · Boarding {summary.boardingCount}
              </p>
            </div>
            <div className="bg-card rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Fees collected</p>
              <p className="text-2xl font-bold text-emerald-700">
                {formatUGX(summary.collected)}
              </p>
            </div>
            <div className="bg-card rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Total expected</p>
              <p className="text-2xl font-bold">
                {formatUGX(summary.expectedTotal)}
              </p>
              <p className="text-xs text-muted-foreground">
                incl. other fees {formatUGX(summary.expectedOther)}
              </p>
            </div>
            <div className="bg-card rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-2xl font-bold text-rose-700">
                {formatUGX(summary.outstanding)}
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border p-6 space-y-4">
              <h3 className="font-semibold">Attendance (this week)</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-emerald-50 p-3">
                  <p className="text-2xl font-bold text-emerald-700">
                    {summary.present}
                  </p>
                  <p className="text-xs">Present</p>
                </div>
                <div className="rounded-lg bg-rose-50 p-3">
                  <p className="text-2xl font-bold text-rose-700">
                    {summary.absent}
                  </p>
                  <p className="text-xs">Absent</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3">
                  <p className="text-2xl font-bold text-amber-700">
                    {summary.late}
                  </p>
                  <p className="text-xs">Late</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Students with incomplete tracking checklist:{" "}
                <span className="font-semibold text-foreground">
                  {summary.trackingPending}
                </span>
              </p>
            </div>

            <div className="bg-card rounded-2xl border p-6 space-y-4">
              <h3 className="font-semibold">Weekly checklist</h3>
              <div className="space-y-3">
                {CHECKLIST_ITEMS.map((item) => (
                  <div key={item.key} className="flex items-center gap-3">
                    <Checkbox
                      id={item.key}
                      checked={Boolean(checklist[item.key])}
                      onCheckedChange={(checked) =>
                        setChecklist((prev) => ({
                          ...prev,
                          [item.key]: Boolean(checked),
                        }))
                      }
                    />
                    <label htmlFor={item.key} className="text-sm cursor-pointer">
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Completed:{" "}
                {CHECKLIST_ITEMS.filter((i) => checklist[i.key]).length} /{" "}
                {CHECKLIST_ITEMS.length}
              </p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Week ending</Label>
                <Input
                  type="date"
                  value={weekEnding}
                  onChange={(e) => setWeekEnding(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Prepared by</Label>
                <Input
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  placeholder="Head teacher name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Remarks / recommendations</Label>
              <Textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button onClick={exportReport} className="gap-2">
              <Download className="w-4 h-4" />
              Download weekly report (Excel)
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
