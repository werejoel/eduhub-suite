/** Letter grade from percentage (Kabale primary scale) */
export function calculateGrade(marks: number, totalMarks: number): string {
  if (!totalMarks || totalMarks <= 0) return "—";
  const percentage = (marks / totalMarks) * 100;
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  if (percentage >= 60) return "D";
  return "F";
}

/** Uganda-style aggregate points (lower is better); maps letter grade to points */
export function gradeToAggregatePoint(grade: string): number {
  switch (grade.toUpperCase()) {
    case "A":
      return 1;
    case "B":
      return 2;
    case "C":
      return 3;
    case "D":
      return 4;
    case "F":
      return 9;
    default:
      return 9;
  }
}

export interface SubjectMarkSummary {
  subject: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  aggregatePoint: number;
}

export function summarizeSubjectMarks(
  marks: Array<{ subject: string; marks_obtained: number; total_marks: number }>,
): SubjectMarkSummary[] {
  const bySubject: Record<
    string,
    { marksObtained: number; totalMarks: number }
  > = {};
  marks.forEach((m) => {
    if (!bySubject[m.subject]) {
      bySubject[m.subject] = { marksObtained: 0, totalMarks: 0 };
    }
    bySubject[m.subject].marksObtained += m.marks_obtained;
    bySubject[m.subject].totalMarks += m.total_marks;
  });

  return Object.entries(bySubject).map(([subject, totals]) => {
    const percentage =
      totals.totalMarks > 0
        ? (totals.marksObtained / totals.totalMarks) * 100
        : 0;
    const grade = calculateGrade(totals.marksObtained, totals.totalMarks);
    return {
      subject,
      marksObtained: totals.marksObtained,
      totalMarks: totals.totalMarks,
      percentage: Math.round(percentage * 10) / 10,
      grade,
      aggregatePoint: gradeToAggregatePoint(grade),
    };
  });
}

/** Total marks, average percentage, overall grade, aggregate (sum of best 4 subject points) */
export function computeTermReport(
  marks: Array<{ subject: string; marks_obtained: number; total_marks: number }>,
) {
  const subjects = summarizeSubjectMarks(marks);
  const totalMarksObtained = subjects.reduce((s, x) => s + x.marksObtained, 0);
  const totalPossible = subjects.reduce((s, x) => s + x.totalMarks, 0);
  const average =
    subjects.length > 0
      ? subjects.reduce((s, x) => s + x.percentage, 0) / subjects.length
      : 0;
  const overallGrade = calculateGrade(totalMarksObtained, totalPossible);
  const sortedPoints = [...subjects]
    .map((s) => s.aggregatePoint)
    .sort((a, b) => a - b);
  const aggregate = sortedPoints
    .slice(0, 4)
    .reduce((sum, p) => sum + p, 0);

  return {
    subjects,
    totalMarksObtained,
    totalPossible,
    average: Math.round(average * 10) / 10,
    overallGrade,
    aggregate: subjects.length > 0 ? aggregate : 0,
  };
}
