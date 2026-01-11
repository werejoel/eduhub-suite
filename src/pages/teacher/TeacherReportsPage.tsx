import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Loader, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  useClasses,
  useStudents,
  useMarks,
} from "@/hooks/useDatabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { calculateGrade, exportToExcel, exportToPDF } from "@/lib/exportUtils";

const EXAM_TYPES = [
  "Beginning-of-Term",
  "Mid-Term",
  "Final",
  "Quiz",
  "Monthly",
];

function TeacherReportsPage() {
  const { user } = useAuth();
  const { data: classes = [], isLoading: classesLoading, isError: classesError } = useClasses();
  const { data: students = [], isLoading: studentsLoading, isError: studentsError } = useStudents();
  const { data: allMarks = [], isLoading: marksLoading, isError: marksError } = useMarks();

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [searchParams] = useSearchParams();
  const [reportType, setReportType] = useState<"class" | "student">("class");

  const loading = classesLoading || studentsLoading || marksLoading;
  const anyError = classesError || studentsError || marksError;

  const teacherClasses = useMemo(() => {
    if (!user) return [];
    return classes.filter((c) => c.teacher_id === user.id);
  }, [classes, user]);

  useEffect(() => {
    const classFromParam = searchParams.get("classId");
    if (classFromParam) {
      setSelectedClassId(classFromParam);
    } else if (selectedClassId === "" && teacherClasses.length > 0) {
      setSelectedClassId(teacherClasses[0].id);
    }
  }, [teacherClasses, selectedClassId, searchParams]);

  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter((s) => s.class_id === selectedClassId);
  }, [students, selectedClassId]);

  const classMarks = useMemo(() => {
    if (!selectedClassId) return [];
    return allMarks.filter((m) => m.class_id === selectedClassId);
  }, [allMarks, selectedClassId]);

  // Student report data
  const studentReportData = useMemo(() => {
    if (!selectedStudentId) return null;
    
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return null;

    const studentMarks = allMarks.filter((m) => m.student_id === selectedStudentId);
    
    // Group marks by exam type
    const marksByExam: Record<string, typeof studentMarks> = {};
    EXAM_TYPES.forEach((exam) => {
      marksByExam[exam] = studentMarks.filter((m) => m.exam_type === exam);
    });

    // Calculate totals for each exam
    const examSummary = EXAM_TYPES.map((exam) => {
      const marks = marksByExam[exam];
      if (marks.length === 0) return null;
      
      const total = marks.reduce((sum, m) => sum + m.marks_obtained, 0);
      const maxTotal = marks.reduce((sum, m) => sum + m.total_marks, 0);
      const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
      const grade = calculateGrade(total, maxTotal);
      
      return {
        exam,
        marks: total,
        total: maxTotal,
        percentage: Math.round(percentage),
        grade,
        subjects: marks.length,
      };
    }).filter(Boolean);

    // Overall statistics
    const allStudentMarks = studentMarks.filter((m) => m.exam_type !== "Quiz");
    const totalMarksObtained = allStudentMarks.reduce((sum, m) => sum + m.marks_obtained, 0);
    const totalPossible = allStudentMarks.reduce((sum, m) => sum + m.total_marks, 0);
    const overallPercentage = totalPossible > 0 ? (totalMarksObtained / totalPossible) * 100 : 0;
    const overallGrade = calculateGrade(totalMarksObtained, totalPossible);

    return {
      student,
      examSummary,
      totalMarksObtained,
      totalPossible,
      overallPercentage: Math.round(overallPercentage),
      overallGrade,
      examCount: examSummary.length,
      subjectCount: new Set(studentMarks.map((m) => m.subject)).size,
    };
  }, [selectedStudentId, students, allMarks]);

  // Class report data
  const classReportData = useMemo(() => {
    if (!selectedClassId) return null;

    const classStudentsList = classStudents;
    const marks = classMarks;

    // Student performance summary
    const studentPerformance = classStudentsList.map((student) => {
      const studentMarks = marks.filter((m) => m.student_id === student.id && m.exam_type !== "Quiz");
      if (studentMarks.length === 0) return null;

      const totalObtained = studentMarks.reduce((sum, m) => sum + m.marks_obtained, 0);
      const totalPossible = studentMarks.reduce((sum, m) => sum + m.total_marks, 0);
      const percentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;
      const grade = calculateGrade(totalObtained, totalPossible);

      return {
        name: `${student.first_name} ${student.last_name}`,
        studentId: student.id,
        marks: totalObtained,
        total: totalPossible,
        percentage: Math.round(percentage),
        grade,
      };
    }).filter(Boolean);

    // Exam type summary
    const examTypeSummary = EXAM_TYPES.map((exam) => {
      const examMarks = marks.filter((m) => m.exam_type === exam);
      if (examMarks.length === 0) return null;

      const totalObtained = examMarks.reduce((sum, m) => sum + m.marks_obtained, 0);
      const totalPossible = examMarks.reduce((sum, m) => sum + m.total_marks, 0);
      const studentCount = new Set(examMarks.map((m) => m.student_id)).size;
      const percentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;

      return {
        exam,
        percentage: Math.round(percentage),
        studentCount,
        marksCount: examMarks.length,
      };
    }).filter(Boolean);

    // Grade distribution
    const gradeDistribution = {
      A: studentPerformance.filter((p) => p.grade === "A").length,
      B: studentPerformance.filter((p) => p.grade === "B").length,
      C: studentPerformance.filter((p) => p.grade === "C").length,
      D: studentPerformance.filter((p) => p.grade === "D").length,
      F: studentPerformance.filter((p) => p.grade === "F").length,
    };

    const classInfo = classes.find((c) => c.id === selectedClassId);
    const averagePercentage = studentPerformance.length > 0
      ? Math.round(studentPerformance.reduce((sum, p) => sum + p.percentage, 0) / studentPerformance.length)
      : 0;

    return {
      classInfo,
      studentPerformance,
      examTypeSummary,
      gradeDistribution,
      studentCount: classStudentsList.length,
      averagePercentage,
      totalMarksRecorded: marks.length,
    };
  }, [selectedClassId, classStudents, classMarks, classes]);

  const handleExportExcel = () => {
    const selectedClass = classes.find((c) => c.id === selectedClassId);
    
    if (reportType === "class" && classReportData) {
      exportToExcel({
        filename: `Class_Report_${selectedClass?.class_name}_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheets: [
          {
            name: "Summary",
            data: [
              ["Class Report Summary"],
              ["Class Name", selectedClass?.class_name || "N/A"],
              ["Total Students", classReportData.studentCount],
              ["Marks Recorded", classReportData.totalMarksRecorded],
              ["Class Average", `${classReportData.averagePercentage}%`],
              ["Exams Recorded", classReportData.examTypeSummary.length],
              [],
              ["Grade Distribution"],
              ["Grade", "Count"],
              ...Object.entries(classReportData.gradeDistribution).map(([grade, count]) => [
                grade,
                count,
              ]),
            ],
          },
          {
            name: "Student Performance",
            data: [
              ["Student Performance"],
              ["Student Name", "Marks Obtained", "Total Marks", "Percentage", "Grade"],
              ...classReportData.studentPerformance.map((student) => [
                student.name,
                student.marks,
                student.total,
                `${student.percentage}%`,
                student.grade,
              ]),
            ],
          },
          {
            name: "Exam Performance",
            data: [
              ["Exam Performance Summary"],
              ["Exam Type", "Average Percentage", "Students", "Marks Count"],
              ...classReportData.examTypeSummary.map((exam) => [
                exam.exam,
                `${exam.percentage}%`,
                exam.studentCount,
                exam.marksCount,
              ]),
            ],
          },
        ],
      });
    } else if (reportType === "student" && studentReportData) {
      exportToExcel({
        filename: `Student_Report_${studentReportData.student.first_name}_${studentReportData.student.last_name}_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheets: [
          {
            name: "Student Report",
            data: [
              ["Student Report"],
              ["Student Name", `${studentReportData.student.first_name} ${studentReportData.student.last_name}`],
              ["Total Marks", `${studentReportData.totalMarksObtained}/${studentReportData.totalPossible}`],
              ["Overall Percentage", `${studentReportData.overallPercentage}%`],
              ["Overall Grade", studentReportData.overallGrade],
              [],
              ["Exam-wise Performance"],
              ["Exam Type", "Marks Obtained", "Total Marks", "Percentage", "Grade", "Subjects"],
              ...studentReportData.examSummary.map((exam) => [
                exam.exam,
                exam.marks,
                exam.total,
                `${exam.percentage}%`,
                exam.grade,
                exam.subjects,
              ]),
            ],
          },
        ],
      });
    }
  };

  const handleExportPDF = () => {
    const selectedClass = classes.find((c) => c.id === selectedClassId);

    if (reportType === "class" && classReportData) {
      exportToPDF({
        filename: `Class_Report_${selectedClass?.class_name}_${new Date().toISOString().split('T')[0]}.pdf`,
        title: "Class Report",
        summaryItems: [
          { label: "Class", value: selectedClass?.class_name || "N/A" },
          { label: "Total Students", value: classReportData.studentCount },
          { label: "Class Average", value: `${classReportData.averagePercentage}%` },
          { label: "Marks Recorded", value: classReportData.totalMarksRecorded },
        ],
        tableTitle: "Student Performance",
        tableHeaders: ["Student Name", "Marks", "Percentage", "Grade"],
        tableData: classReportData.studentPerformance.map((student) => [
          student.name,
          `${student.marks}/${student.total}`,
          `${student.percentage}%`,
          student.grade,
        ]),
      });
    } else if (reportType === "student" && studentReportData) {
      exportToPDF({
        filename: `Student_Report_${studentReportData.student.first_name}_${studentReportData.student.last_name}_${new Date().toISOString().split('T')[0]}.pdf`,
        title: "Student Report",
        summaryItems: [
          { label: "Student", value: `${studentReportData.student.first_name} ${studentReportData.student.last_name}` },
          { label: "Total Marks", value: `${studentReportData.totalMarksObtained}/${studentReportData.totalPossible}` },
          { label: "Overall Percentage", value: `${studentReportData.overallPercentage}%` },
          { label: "Overall Grade", value: studentReportData.overallGrade },
        ],
        tableTitle: "Exam-wise Performance",
        tableHeaders: ["Exam Type", "Marks", "Percentage", "Grade", "Subjects"],
        tableData: studentReportData.examSummary.map((exam) => [
          exam.exam,
          `${exam.marks}/${exam.total}`,
          `${exam.percentage}%`,
          exam.grade,
          String(exam.subjects),
        ]),
      });
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Student Reports"
        description="Generate and view student performance reports"
        icon={FileText}
      />

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {anyError && (
        <div className="p-4 bg-red-50 rounded-md mb-4 text-sm text-red-700">
          Some data failed to load from the backend. Check your server or network and refresh.
        </div>
      )}

      {!loading && (
        <>
          {/* Report Type Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-6 border border-border shadow-md mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-sm font-medium mb-2 block">Report Type</label>
                <div className="flex gap-2">
                  <Button
                    variant={reportType === "class" ? "default" : "outline"}
                    onClick={() => setReportType("class")}
                    className="flex-1"
                  >
                    Class Report
                  </Button>
                  <Button
                    variant={reportType === "student" ? "default" : "outline"}
                    onClick={() => setReportType("student")}
                    className="flex-1"
                  >
                    Student Report
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Select Class</label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {reportType === "student" && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Student</label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {classStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.first_name} {student.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </motion.div>

          {/* Class Report */}
          {reportType === "class" && classReportData && (
            <>
              {/* Summary Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
              >
                <Card className="p-6 border border-border">
                  <div className="text-sm text-muted-foreground mb-1">Total Students</div>
                  <div className="text-3xl font-bold text-primary">{classReportData.studentCount}</div>
                </Card>
                <Card className="p-6 border border-border">
                  <div className="text-sm text-muted-foreground mb-1">Marks Recorded</div>
                  <div className="text-3xl font-bold text-primary">{classReportData.totalMarksRecorded}</div>
                </Card>
                <Card className="p-6 border border-border">
                  <div className="text-sm text-muted-foreground mb-1">Class Average</div>
                  <div className="text-3xl font-bold text-secondary">{classReportData.averagePercentage}%</div>
                </Card>
                <Card className="p-6 border border-border">
                  <div className="text-sm text-muted-foreground mb-1">Exams Recorded</div>
                  <div className="text-3xl font-bold text-success">{classReportData.examTypeSummary.length}</div>
                </Card>
              </motion.div>

              {/* Grade Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="grid lg:grid-cols-2 gap-6 mb-6"
              >
                <div className="bg-card rounded-2xl p-6 border border-border shadow-md">
                  <h3 className="text-lg font-semibold mb-4">Grade Distribution</h3>
                  <div className="space-y-3">
                    {Object.entries(classReportData.gradeDistribution).map(([grade, count]) => (
                      <div key={grade} className="flex items-center justify-between">
                        <span className="font-medium">Grade {grade}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${(count / classReportData.studentCount) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-6 border border-border shadow-md">
                  <h3 className="text-lg font-semibold mb-4">Exam Performance</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classReportData.examTypeSummary}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="exam" angle={-45} textAnchor="end" height={80} interval={0} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="percentage" fill="hsl(217, 91%, 35%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>

              {/* Student Performance Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-2xl border border-border shadow-md overflow-hidden"
              >
                <div className="p-6 border-b border-border flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Student Performance</h3>
                  <div className="flex gap-2">
                    <Button onClick={handleExportExcel} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export Excel
                    </Button>
                    <Button onClick={handleExportPDF} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-semibold">Student Name</th>
                        <th className="text-center p-4 font-semibold">Marks</th>
                        <th className="text-center p-4 font-semibold">Percentage</th>
                        <th className="text-center p-4 font-semibold">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classReportData.studentPerformance.map((student, idx) => (
                        <tr key={student.studentId} className="border-t border-border hover:bg-muted/30">
                          <td className="p-4 font-medium">{student.name}</td>
                          <td className="p-4 text-center text-muted-foreground">
                            {student.marks}/{student.total}
                          </td>
                          <td className="p-4 text-center font-medium">{student.percentage}%</td>
                          <td className="p-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
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
              </motion.div>
            </>
          )}

          {/* Student Report */}
          {reportType === "student" && studentReportData && (
            <>
              {/* Summary Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
              >
                <Card className="p-6 border border-border">
                  <div className="text-sm text-muted-foreground mb-1">Student Name</div>
                  <div className="font-bold">
                    {studentReportData.student.first_name} {studentReportData.student.last_name}
                  </div>
                </Card>
                <Card className="p-6 border border-border">
                  <div className="text-sm text-muted-foreground mb-1">Total Marks</div>
                  <div className="text-2xl font-bold text-primary">
                    {studentReportData.totalMarksObtained}/{studentReportData.totalPossible}
                  </div>
                </Card>
                <Card className="p-6 border border-border">
                  <div className="text-sm text-muted-foreground mb-1">Overall Percentage</div>
                  <div className="text-3xl font-bold text-secondary">
                    {studentReportData.overallPercentage}%
                  </div>
                </Card>
                <Card className="p-6 border border-border">
                  <div className="text-sm text-muted-foreground mb-1">Overall Grade</div>
                  <div
                    className={`text-3xl font-bold ${
                      studentReportData.overallGrade === "A"
                        ? "text-green-600"
                        : studentReportData.overallGrade === "B"
                        ? "text-blue-600"
                        : studentReportData.overallGrade === "C"
                        ? "text-yellow-600"
                        : studentReportData.overallGrade === "D"
                        ? "text-orange-600"
                        : "text-red-600"
                    }`}
                  >
                    {studentReportData.overallGrade}
                  </div>
                </Card>
              </motion.div>

              {/* Exam Performance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-card rounded-2xl p-6 border border-border shadow-md mb-6"
              >
                <h3 className="text-lg font-semibold mb-4">Exam-wise Performance</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={studentReportData.examSummary}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="exam" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="percentage"
                        stroke="hsl(217, 91%, 35%)"
                        name="Percentage"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Detailed Exam Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-2xl border border-border shadow-md overflow-hidden"
              >
                <div className="p-6 border-b border-border flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Detailed Exam Results</h3>
                  <div className="flex gap-2">
                    <Button onClick={handleExportExcel} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export Excel
                    </Button>
                    <Button onClick={handleExportPDF} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-semibold">Exam Type</th>
                        <th className="text-center p-4 font-semibold">Marks</th>
                        <th className="text-center p-4 font-semibold">Percentage</th>
                        <th className="text-center p-4 font-semibold">Grade</th>
                        <th className="text-center p-4 font-semibold">Subjects</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentReportData.examSummary.map((exam) => (
                        <tr key={exam.exam} className="border-t border-border hover:bg-muted/30">
                          <td className="p-4 font-medium">{exam.exam}</td>
                          <td className="p-4 text-center text-muted-foreground">
                            {exam.marks}/{exam.total}
                          </td>
                          <td className="p-4 text-center font-medium">{exam.percentage}%</td>
                          <td className="p-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                exam.grade === "A"
                                  ? "bg-green-100 text-green-800"
                                  : exam.grade === "B"
                                  ? "bg-blue-100 text-blue-800"
                                  : exam.grade === "C"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : exam.grade === "D"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {exam.grade}
                            </span>
                          </td>
                          <td className="p-4 text-center">{exam.subjects}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}

          {/* Empty State */}
          {!classReportData && !studentReportData && !loading && (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Select a class{reportType === "student" && " and student"} to generate a report</p>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

export default TeacherReportsPage;
