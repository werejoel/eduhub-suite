import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import PageHeader from "@/components/dashboard/PageHeader";
import { useNavigate } from "react-router-dom";
import { BookOpen, FileText, BarChart2, Users, File } from "lucide-react";
import { motion } from "framer-motion";
import { useClasses, useTeachers, useMarks } from "@/hooks/useDatabase";
import { useMemo } from "react";

const DosDashboard = () => {
  const navigate = useNavigate();
  const { data: classes = [] } = useClasses();
  const { data: teachers = [] } = useTeachers();
  const { data: marks = [] } = useMarks();

  const stats = useMemo(
    () => [
      {
        title: "Classes",
        value: classes.length.toString(),
        change: `${teachers.length} teachers assigned`,
        changeType: "positive" as const,
        icon: BookOpen,
        iconColor: "bg-primary",
      },
      {
        title: "Notes",
        value: "Saved",
        change: "Manage class notes",
        changeType: "neutral" as const,
        icon: FileText,
        iconColor: "bg-secondary",
      },
      {
        title: "Exam Records",
        value: marks.length.toString(),
        change: `Total marks recorded`,
        changeType: "positive" as const,
        icon: BarChart2,
        iconColor: "bg-success",
      },
      {
        title: "Teachers",
        value: teachers.length.toString(),
        change: `Active staff`,
        changeType: "positive" as const,
        icon: Users,
        iconColor: "bg-warning",
      },
    ],
    [classes.length, teachers.length, marks.length]
  );

  return (
    <DashboardLayout>
      <PageHeader
        title="Director of Studies"
        description="Manage classes, notes, reports and teacher monitoring."
        icon={BookOpen}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((s: any, i: number) => (
          <StatCard key={s.title} {...s} delay={i * 0.1} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <h3 className="text-lg font-semibold">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <button
            onClick={() => navigate("/dos/classes")}
            className="p-6 bg-card rounded-2xl border border-border hover:shadow transition"
          >
            <div className="flex items-center gap-4">
              <div className="bg-primary p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-medium">Manage Classes</p>
                <p className="text-sm text-muted-foreground">
                  Create and assign classes
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/dos/notes")}
            className="p-6 bg-card rounded-2xl border border-border hover:shadow transition"
          >
            <div className="flex items-center gap-4">
              <div className="bg-secondary p-3 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-medium">Brief Notes</p>
                <p className="text-sm text-muted-foreground">
                  Add short notes about classes
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/dos/reports")}
            className="p-6 bg-card rounded-2xl border border-border hover:shadow transition"
          >
            <div className="flex items-center gap-4">
              <div className="bg-success p-3 rounded-lg">
                <BarChart2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-medium">Termly Reports</p>
                <p className="text-sm text-muted-foreground">
                  Generate reports after exams
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/dos/teachers")}
            className="p-6 bg-card rounded-2xl border border-border hover:shadow transition"
          >
            <div className="flex items-center gap-4">
              <div className="bg-warning p-3 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-medium">Monitor Teachers</p>
                <p className="text-sm text-muted-foreground">
                  View duties and performance
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/dos/circulars")}
            className="p-6 bg-card rounded-2xl border border-border hover:shadow transition"
          >
            <div className="flex items-center gap-4">
              <div className="bg-indigo-500 p-3 rounded-lg">
                <File className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-medium">Circulars</p>
                <p className="text-sm text-muted-foreground">
                  Upload PDF & Word documents
                </p>
              </div>
            </div>
          </button>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default DosDashboard;
