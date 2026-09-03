import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { BarChart2, Download, Search } from "lucide-react";
import { useMarks, useClasses, useStudents } from "@/hooks/useDatabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { exportToExcel } from "@/lib/exportToExcel";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { EXAM_TERMS } from "@/lib/schoolConfig";

export default function ReportsPage() {
  const { data: marks = [] } = useMarks();
  const { data: classes = [] } = useClasses();
  const { data: students = [] } = useStudents();
  const [classId, setClassId] = useState("");
  const [term, setTerm] = useState("");
  const [examType, setExamType] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const filtered = useMemo(() => {
    let result = [...marks];
    if (classId) result = result.filter((m: any) => m.class_id === classId);
    if (term) result = result.filter((m: any) => m.term === term);
    if (examType)
      result = result.filter(
        (m: any) =>
          m.exam_type?.toLowerCase().includes(examType.toLowerCase()) ||
          m.exam_type === examType,
      );
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      result = result.filter((m: any) => {
        const student = students.find((s: any) => s.id === m.student_id);
        if (!student) return false;
        const name =
          `${student.first_name} ${student.other_names || ""} ${student.last_name}`.toLowerCase();
        return (
          name.includes(q) ||
          (student.admission_number || "").toLowerCase().includes(q)
        );
      });
    }
    return result;
  }, [marks, classId, term, examType, studentSearch, students]);

  const stats = useMemo(() => {
    const totalMarks = filtered.reduce(
      (sum: number, m: any) => sum + (m.marks_obtained || 0),
      0,
    );
    const avgMarks =
      filtered.length > 0 ? (totalMarks / filtered.length).toFixed(2) : 0;
    const uniqueStudents = new Set(filtered.map((m: any) => m.student_id)).size;
    return { total: filtered.length, avg: avgMarks, students: uniqueStudents };
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
        student_name: student
          ? `${student.first_name} ${student.other_names || ""} ${student.last_name}`.trim()
          : "Unknown",
        admission_number: student?.admission_number || "N/A",
        class: cls?.class_name || "Unknown",
        section: student?.boarding_status === "boarding" ? "Boarding" : "Day",
        subject: m.subject,
        exam_type: m.exam_type,
        marks_obtained: m.marks_obtained,
        total_marks: m.total_marks,
        percentage: ((m.marks_obtained / m.total_marks) * 100).toFixed(1),
        term: m.term,
        academic_year: m.academic_year,
      };
    });

    exportToExcel(
      enriched,
      `general_results_report_${classId || "all"}_${new Date().getTime()}`,
    );
    toast.success("General results report exported successfully");
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="General Results Report"
        description="View and export student results by term and exam period"
        icon={BarChart2}
      />

      <div className="space-y-6">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-md">
          <h3 className="font-semibold mb-4">Filter Report</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm mb-2">Search Student</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Name or admission no."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-2">Class</label>
              <select
                className="w-full px-3 py-2 border rounded-md bg-background"
                value={classId}
                onChange={(e: any) => setClassId(e.target.value)}
              >
                <option value="">All Classes</option>
                {classes.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.class_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2">Term</label>
              <select
                className="w-full px-3 py-2 border rounded-md bg-background"
                value={term}
                onChange={(e: any) => setTerm(e.target.value)}
              >
                <option value="">All Terms</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2">Exam Period</label>
              <select
                className="w-full px-3 py-2 border rounded-md bg-background"
                value={examType}
                onChange={(e: any) => setExamType(e.target.value)}
              >
                <option value="">All Periods</option>
                {EXAM_TERMS.map((t) => (
                  <option key={t} value={t}>
                    {t} Results
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={generateExcel}
                disabled={filtered.length === 0}
                className="w-full gap-2"
              >
                <Download className="w-4 h-4" /> Export Excel
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-md">
            <p className="text-sm text-muted-foreground mb-1">Total Records</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-6 shadow-md">
            <p className="text-sm text-muted-foreground mb-1">Students</p>
            <p className="text-3xl font-bold">{stats.students}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-6 shadow-md">
            <p className="text-sm text-muted-foreground mb-1">Average Marks</p>
            <p className="text-3xl font-bold">{stats.avg}</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-md">
          <h3 className="font-semibold mb-4">
            Results Preview ({filtered.length} records)
          </h3>
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No results match your filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Student</th>
                    <th className="text-left p-2">Class</th>
                    <th className="text-left p-2">Subject</th>
                    <th className="text-left p-2">Exam Period</th>
                    <th className="text-left p-2">Marks</th>
                    <th className="text-left p-2">Term</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 15).map((m: any, i: number) => {
                    const student = students.find(
                      (s: any) => s.id === m.student_id,
                    );
                    const cls = classes.find((c: any) => c.id === m.class_id);
                    return (
                      <tr key={i} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          {student
                            ? `${student.first_name} ${student.last_name}`
                            : "Unknown"}
                        </td>
                        <td className="p-2">{cls?.class_name || "—"}</td>
                        <td className="p-2">{m.subject}</td>
                        <td className="p-2">{m.exam_type}</td>
                        <td className="p-2">
                          {m.marks_obtained}/{m.total_marks}
                        </td>
                        <td className="p-2">{m.term}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length > 15 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Showing 15 of {filtered.length} records. Export to see all.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
