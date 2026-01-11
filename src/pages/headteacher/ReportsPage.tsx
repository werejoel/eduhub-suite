import { useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { FileText, Download, Loader } from "lucide-react";
import { useMarks, useStudents, useClasses } from "@/hooks/useDatabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { calculateGrade, exportToExcel, exportToPDF } from "@/lib/exportUtils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const EXAM_TYPES = ["Beginning-of-Term", "Mid-Term", "Final", "Quiz", "Monthly"];
const COLORS = ["#0066CC", "#00CC66", "#FFAA00", "#FF6666", "#6600FF"];

const HeadteacherReportsPage = () => {
  const { data: marks = [], isLoading: marksLoading } = useMarks();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: classes = [], isLoading: classesLoading } = useClasses();

  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const loading = marksLoading || studentsLoading || classesLoading;

  // Aggregate reports data
  const aggregateReportData = useMemo(() => {
    // Overall statistics
    const totalMarks = marks.length;
    const totalStudents = students.length;
    const totalClasses = classes.length;

    // Class-wise performance
    const classPerformance = classes.map((cls) => {
      const classMarks = marks.filter((m) => m.class_id === cls.id);
      const classStudents = students.filter((s) => s.class_id === cls.id);

      if (classMarks.length === 0) return null;

      const validMarks = classMarks.filter((m) => m.exam_type !== "Quiz");
      const totalObtained = validMarks.reduce((sum, m) => sum + m.marks_obtained, 0);
      const totalPossible = validMarks.reduce((sum, m) => sum + m.total_marks, 0);
      const percentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;

      return {
        name: cls.class_name,
        classId: cls.id,
        percentage: Math.round(percentage),
        studentCount: classStudents.length,
        marksCount: classMarks.length,
      };
    }).filter(Boolean);

    // Exam-wise summary
    const examSummary = EXAM_TYPES.map((exam) => {
      const examMarks = marks.filter((m) => m.exam_type === exam);
      if (examMarks.length === 0) return null;

      const totalObtained = examMarks.reduce((sum, m) => sum + m.marks_obtained, 0);
      const totalPossible = examMarks.reduce((sum, m) => sum + m.total_marks, 0);
      const percentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;

      return {
        exam,
        percentage: Math.round(percentage),
        marksCount: examMarks.length,
        studentCount: new Set(examMarks.map((m) => m.student_id)).size,
      };
    }).filter(Boolean);

    // Grade distribution across all classes
    const allStudentGrades = classes.map((cls) => {
      const classStudents = students.filter((s) => s.class_id === cls.id);
      const classMarks = marks.filter((m) => m.class_id === cls.id);

      return classStudents.map((student) => {
        const studentMarks = classMarks.filter((m) => m.student_id === student.id && m.exam_type !== "Quiz");
        if (studentMarks.length === 0) return null;

        const totalObtained = studentMarks.reduce((sum, m) => sum + m.marks_obtained, 0);
        const totalPossible = studentMarks.reduce((sum, m) => sum + m.total_marks, 0);
        return calculateGrade(totalObtained, totalPossible);
      }).filter(Boolean);
    }).flat();

    const gradeDistribution = {
      A: allStudentGrades.filter((g) => g === "A").length,
      B: allStudentGrades.filter((g) => g === "B").length,
      C: allStudentGrades.filter((g) => g === "C").length,
      D: allStudentGrades.filter((g) => g === "D").length,
      F: allStudentGrades.filter((g) => g === "F").length,
    };

    return {
      totalMarks,
      totalStudents,
      totalClasses,
      classPerformance,
      examSummary,
      gradeDistribution,
    };
  }, [marks, students, classes]);

  const selectedClassReport = useMemo(() => {
    if (!selectedClassId) return null;

    const selectedClass = classes.find((c) => c.id === selectedClassId);
    const classMarks = marks.filter((m) => m.class_id === selectedClassId);
    const classStudents = students.filter((s) => s.class_id === selectedClassId);

    if (classMarks.length === 0) return null;

    const studentPerformance = classStudents.map((student) => {
      const studentMarks = classMarks.filter((m) => m.student_id === student.id && m.exam_type !== "Quiz");
      if (studentMarks.length === 0) return null;

      const totalObtained = studentMarks.reduce((sum, m) => sum + m.marks_obtained, 0);
      const totalPossible = studentMarks.reduce((sum, m) => sum + m.total_marks, 0);
      const percentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;

      return {
        name: `${student.first_name} ${student.last_name}`,
        marks: totalObtained,
        total: totalPossible,
        percentage: Math.round(percentage),
        grade: calculateGrade(totalObtained, totalPossible),
      };
    }).filter(Boolean);

    return {
      className: selectedClass?.class_name,
      studentPerformance,
      totalStudents: classStudents.length,
      totalMarksRecorded: classMarks.length,
    };
  }, [selectedClassId, classes, marks, students]);

  const handleExportSchoolReport = () => {
    exportToExcel({
      filename: `School_Report_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheets: [
        {
          name: "Summary",
          data: [
            ["School Academic Report"],
            ["Total Classes", aggregateReportData.totalClasses],
            ["Total Students", aggregateReportData.totalStudents],
            ["Total Marks Recorded", aggregateReportData.totalMarks],
            [],
            ["Grade Distribution"],
            ["Grade", "Count"],
            ...Object.entries(aggregateReportData.gradeDistribution).map(([grade, count]) => [
              grade,
              count,
            ]),
          ],
        },
        {
          name: "Class Performance",
          data: [
            ["Class Performance Summary"],
            ["Class Name", "Average %", "Students", "Marks Count"],
            ...aggregateReportData.classPerformance.map((cls) => [
              cls.name,
              `${cls.percentage}%`,
              cls.studentCount,
              cls.marksCount,
            ]),
          ],
        },
        {
          name: "Exam Summary",
          data: [
            ["Exam Performance Summary"],
            ["Exam Type", "Average %", "Students", "Marks Count"],
            ...aggregateReportData.examSummary.map((exam) => [
              exam.exam,
              `${exam.percentage}%`,
              exam.studentCount,
              exam.marksCount,
            ]),
          ],
        },
      ],
    });
  };

  const handleExportSchoolPDF = () => {
    exportToPDF({
      filename: `School_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      title: "School Academic Report",
      summaryItems: [
        { label: "Total Classes", value: aggregateReportData.totalClasses },
        { label: "Total Students", value: aggregateReportData.totalStudents },
        { label: "Total Marks Recorded", value: aggregateReportData.totalMarks },
      ],
      tableTitle: "Class Performance Summary",
      tableHeaders: ["Class Name", "Average %", "Students", "Marks Count"],
      tableData: aggregateReportData.classPerformance.map((cls) => [
        cls.name,
        `${cls.percentage}%`,
        cls.studentCount,
        cls.marksCount,
      ]),
    });
  };

  const handleExportClassReport = () => {
    if (!selectedClassReport) return;

    exportToExcel({
      filename: `Class_Report_${selectedClassReport.className}_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheets: [
        {
          name: "Summary",
          data: [
            ["Class Report"],
            ["Class Name", selectedClassReport.className],
            ["Total Students", selectedClassReport.totalStudents],
            ["Marks Recorded", selectedClassReport.totalMarksRecorded],
          ],
        },
        {
          name: "Student Performance",
          data: [
            ["Student Performance"],
            ["Student Name", "Marks Obtained", "Total Marks", "Percentage", "Grade"],
            ...selectedClassReport.studentPerformance.map((student) => [
              student.name,
              student.marks,
              student.total,
              `${student.percentage}%`,
              student.grade,
            ]),
          ],
        },
      ],
    });
  };

  const handleExportClassPDF = () => {
    if (!selectedClassReport) return;

    exportToPDF({
      filename: `Class_Report_${selectedClassReport.className}_${new Date().toISOString().split('T')[0]}.pdf`,
      title: "Class Report",
      summaryItems: [
        { label: "Class Name", value: selectedClassReport.className || "N/A" },
        { label: "Total Students", value: selectedClassReport.totalStudents },
        { label: "Marks Recorded", value: selectedClassReport.totalMarksRecorded },
      ],
      tableTitle: "Student Performance",
      tableHeaders: ["Student Name", "Marks", "Percentage", "Grade"],
      tableData: selectedClassReport.studentPerformance.map((student) => [
        student.name,
        `${student.marks}/${student.total}`,
        `${student.percentage}%`,
        student.grade,
      ]),
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Reports"
          description="View and export academic reports"
          icon={FileText}
        />
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="School Reports"
        description="View and export comprehensive academic reports"
        icon={FileText}
      />

      {/* School Overview Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        <Card className="p-6 border border-border">
          <div className="text-sm text-muted-foreground mb-1">Total Classes</div>
          <div className="text-3xl font-bold text-primary">{aggregateReportData.totalClasses}</div>
        </Card>
        <Card className="p-6 border border-border">
          <div className="text-sm text-muted-foreground mb-1">Total Students</div>
          <div className="text-3xl font-bold text-secondary">{aggregateReportData.totalStudents}</div>
        </Card>
        <Card className="p-6 border border-border">
          <div className="text-sm text-muted-foreground mb-1">Marks Recorded</div>
          <div className="text-3xl font-bold text-success">{aggregateReportData.totalMarks}</div>
        </Card>
        <Card className="p-6 border border-border">
          <div className="text-sm text-muted-foreground mb-1">Average Grade</div>
          <div className="text-3xl font-bold text-amber-600">
            {aggregateReportData.gradeDistribution.A > 0 ? "A" : "B"}
          </div>
        </Card>
      </motion.div>

      {/* School Report Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid lg:grid-cols-2 gap-6 mb-6"
      >
        <div className="bg-card rounded-2xl p-6 border border-border shadow-md">
          <h3 className="text-lg font-semibold mb-4">Class Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregateReportData.classPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="percentage" fill="#0066CC" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-md">
          <h3 className="text-lg font-semibold mb-4">Grade Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(aggregateReportData.gradeDistribution).map(([grade, count]) => ({
                    name: `Grade ${grade}`,
                    value: count,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.keys(aggregateReportData.gradeDistribution).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* School Report Export */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card rounded-2xl p-6 border border-border shadow-md mb-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Export School Report</h3>
          <div className="flex gap-2">
            <Button onClick={handleExportSchoolReport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button onClick={handleExportSchoolPDF} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Download comprehensive school-wide academic report with class and exam performance summaries.
        </p>
      </motion.div>

      {/* Class-specific Report */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl p-6 border border-border shadow-md"
      >
        <h3 className="text-lg font-semibold mb-4">Class-specific Report</h3>
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">Select Class</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="">Choose a class...</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.class_name}
              </option>
            ))}
          </select>
        </div>

        {selectedClassReport && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card className="p-4 border border-border">
                <div className="text-sm text-muted-foreground">Total Students</div>
                <div className="text-2xl font-bold">{selectedClassReport.totalStudents}</div>
              </Card>
              <Card className="p-4 border border-border">
                <div className="text-sm text-muted-foreground">Marks Recorded</div>
                <div className="text-2xl font-bold">{selectedClassReport.totalMarksRecorded}</div>
              </Card>
              <div className="flex gap-2 items-end">
                <Button onClick={handleExportClassReport} variant="default" size="sm" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button onClick={handleExportClassPDF} variant="default" size="sm" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-semibold">Student Name</th>
                    <th className="text-center p-3 font-semibold">Marks</th>
                    <th className="text-center p-3 font-semibold">Percentage</th>
                    <th className="text-center p-3 font-semibold">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedClassReport.studentPerformance.map((student, idx) => (
                    <tr key={idx} className="border-t border-border hover:bg-muted/30">
                      <td className="p-3 font-medium">{student.name}</td>
                      <td className="p-3 text-center text-muted-foreground">
                        {student.marks}/{student.total}
                      </td>
                      <td className="p-3 text-center font-medium">{student.percentage}%</td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            student.grade === "A"
                              ? "bg-green-100 text-green-800"
                              : student.grade === "B"
                              ? "bg-blue-100 text-blue-800"
                              : student.grade === "C"
                              ? "bg-yellow-100 text-yellow-800"
                              : student.grade === "D"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {student.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default HeadteacherReportsPage;