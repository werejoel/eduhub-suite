import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { FileText } from "lucide-react";
import { useMarks, useStudents } from "@/hooks/useDatabase";

export default function ReportsPage() {
  const { data: marks = [], isLoading: marksLoading } = useMarks();
  const { data: students = [], isLoading: studentsLoading } = useStudents();

  return (
    <DashboardLayout>
      <PageHeader
        title="Reports"
        description="Generate academic and administrative reports"
        icon={FileText}
      />

      <div className="bg-card rounded-2xl p-6 border border-border shadow-md">
        {marksLoading || studentsLoading ? (
          <p className="text-muted-foreground">Loading report data...</p>
        ) : (
          <div>
            <p className="text-lg font-semibold">Marks records: {marks.length}</p>
            <p className="text-lg font-semibold mt-2">Students: {students.length}</p>
            <p className="text-muted-foreground mt-4">Use these datasets to build exports and analytics.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
