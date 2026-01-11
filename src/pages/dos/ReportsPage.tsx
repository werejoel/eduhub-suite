import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { BarChart2, Download } from "lucide-react";
import { useMarks, useClasses, useStudents } from "@/hooks/useDatabase";
import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/lib/exportToExcel";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function ReportsPage() {
  const { data: marks = [] } = useMarks();
  const { data: classes = [] } = useClasses();
  const { data: students = [] } = useStudents();
  const [classId, setClassId] = useState("");
  const [term, setTerm] = useState("");

  const filtered = useMemo(() => {
    let result = [...marks];
    if (classId) result = result.filter((m: any) => m.class_id === classId);
    if (term) result = result.filter((m: any) => m.term === term);
    return result;
  }, [marks, classId, term]);

  const stats = useMemo(() => {
    const totalMarks = filtered.reduce((sum: number, m: any) => sum + (m.marks_obtained || 0), 0);
    const avgMarks = filtered.length > 0 ? (totalMarks / filtered.length).toFixed(2) : 0;
    return { total: filtered.length, avg: avgMarks };
  }, [filtered]);

  const generateExcel = () => {
    if (filtered.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    const enriched = filtered.map((m: any) => {
      const student = students.find((s: any) => s.id === m.student_id);
      const cls = classes.find((c: any) => c.id === m.class_id);
      return {
        student_name: student ? `${student.first_name} ${student.last_name}` : "Unknown",
        class: cls?.class_name || "Unknown",
        subject: m.subject,
        exam_type: m.exam_type,
        marks_obtained: m.marks_obtained,
        total_marks: m.total_marks,
        percentage: ((m.marks_obtained / m.total_marks) * 100).toFixed(1),
        term: m.term,
        academic_year: m.academic_year,
      };
    });
    
    exportToExcel(enriched, `termly_report_${classId || 'all'}_${new Date().getTime()}`);
    toast.success("Report exported successfully");
  };

  return (
    <DashboardLayout>
      <PageHeader title="Termly Reports" description="Generate and export exam reports" icon={BarChart2} />

      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-md">
          <h3 className="font-semibold mb-4">Filter Report</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-2">Class</label>
              <select className="w-full px-3 py-2 border rounded" value={classId} onChange={(e: any) => setClassId(e.target.value)}>
                <option value="">All Classes</option>
                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.class_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2">Term</label>
              <select className="w-full px-3 py-2 border rounded" value={term} onChange={(e: any) => setTerm(e.target.value)}>
                <option value="">All Terms</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={generateExcel} disabled={filtered.length === 0} className="w-full gap-2">
                <Download className="w-4 h-4" /> Export Excel
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-md">
            <p className="text-sm text-muted-foreground mb-1">Total Records</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-6 shadow-md">
            <p className="text-sm text-muted-foreground mb-1">Average Marks</p>
            <p className="text-3xl font-bold">{stats.avg}</p>
          </div>
        </div>

        {/* Data Preview */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-md">
          <h3 className="font-semibold mb-4">Data Preview ({filtered.length} records)</h3>
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No data available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Student</th>
                    <th className="text-left p-2">Subject</th>
                    <th className="text-left p-2">Exam</th>
                    <th className="text-left p-2">Marks</th>
                    <th className="text-left p-2">Term</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 10).map((m: any, i: number) => {
                    const student = students.find((s: any) => s.id === m.student_id);
                    return (
                      <tr key={i} className="border-b hover:bg-muted/50">
                        <td className="p-2">{student ? `${student.first_name} ${student.last_name}` : "Unknown"}</td>
                        <td className="p-2">{m.subject}</td>
                        <td className="p-2">{m.exam_type}</td>
                        <td className="p-2">{m.marks_obtained}/{m.total_marks}</td>
                        <td className="p-2">{m.term}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length > 10 && <p className="text-xs text-muted-foreground mt-2">Showing 10 of {filtered.length} records. Export to see all.</p>}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
