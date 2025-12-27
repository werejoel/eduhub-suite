import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Search, Save, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface StudentMark {
  id: string;
  studentName: string;
  class: string;
  subject: string;
  exam: string;
  marks: number;
  maxMarks: number;
  grade: string;
}

const initialMarks: StudentMark[] = [
  { id: "1", studentName: "Alice Johnson", class: "Grade 10A", subject: "Mathematics", exam: "Mid-Term", marks: 85, maxMarks: 100, grade: "A" },
  { id: "2", studentName: "Bob Smith", class: "Grade 10A", subject: "Mathematics", exam: "Mid-Term", marks: 72, maxMarks: 100, grade: "B" },
  { id: "3", studentName: "Carol Williams", class: "Grade 10A", subject: "Mathematics", exam: "Mid-Term", marks: 91, maxMarks: 100, grade: "A" },
  { id: "4", studentName: "David Brown", class: "Grade 10A", subject: "Mathematics", exam: "Mid-Term", marks: 65, maxMarks: 100, grade: "C" },
  { id: "5", studentName: "Eva Martinez", class: "Grade 10A", subject: "Mathematics", exam: "Mid-Term", marks: 78, maxMarks: 100, grade: "B" },
  { id: "6", studentName: "Frank Wilson", class: "Grade 10A", subject: "Mathematics", exam: "Mid-Term", marks: 88, maxMarks: 100, grade: "A" },
];

const calculateGrade = (marks: number, maxMarks: number) => {
  const percentage = (marks / maxMarks) * 100;
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  if (percentage >= 60) return "D";
  return "F";
};

export default function MarksPage() {
  const [marks, setMarks] = useState<StudentMark[]>(initialMarks);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("Grade 10A");
  const [selectedExam, setSelectedExam] = useState("Mid-Term");
  const [editDialog, setEditDialog] = useState<StudentMark | null>(null);
  const [editMarks, setEditMarks] = useState(0);

  const filteredMarks = marks.filter((mark) => {
    const matchesSearch = mark.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = mark.class === selectedClass;
    const matchesExam = mark.exam === selectedExam;
    return matchesSearch && matchesClass && matchesExam;
  });

  const handleSaveMarks = () => {
    if (editDialog) {
      setMarks(
        marks.map((m) =>
          m.id === editDialog.id
            ? { ...m, marks: editMarks, grade: calculateGrade(editMarks, m.maxMarks) }
            : m
        )
      );
      setEditDialog(null);
      toast.success("Marks updated successfully");
    }
  };

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      A: "bg-success/10 text-success",
      B: "bg-primary/10 text-primary",
      C: "bg-secondary/10 text-secondary-foreground",
      D: "bg-warning/10 text-warning",
      F: "bg-destructive/10 text-destructive",
    };
    return colors[grade] || "bg-muted text-muted-foreground";
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Marks Management"
        description="Add, edit and manage student marks"
        icon={FileText}
      />

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-4 border border-border shadow-md mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Grade 10A">Grade 10A</SelectItem>
              <SelectItem value="Grade 11B">Grade 11B</SelectItem>
              <SelectItem value="Grade 9A">Grade 9A</SelectItem>
              <SelectItem value="Grade 12A">Grade 12A</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedExam} onValueChange={setSelectedExam}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select exam" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mid-Term">Mid-Term</SelectItem>
              <SelectItem value="Final">Final Exam</SelectItem>
              <SelectItem value="Quiz 1">Quiz 1</SelectItem>
              <SelectItem value="Quiz 2">Quiz 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Marks Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl border border-border shadow-md overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold">Student Name</th>
                <th className="text-left p-4 font-semibold">Subject</th>
                <th className="text-center p-4 font-semibold">Marks</th>
                <th className="text-center p-4 font-semibold">Grade</th>
                <th className="text-right p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMarks.map((mark) => (
                <tr key={mark.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{mark.studentName}</td>
                  <td className="p-4 text-muted-foreground">{mark.subject}</td>
                  <td className="p-4 text-center">
                    <span className="font-semibold">{mark.marks}</span>
                    <span className="text-muted-foreground">/{mark.maxMarks}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(mark.grade)}`}>
                      {mark.grade}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditDialog(mark);
                        setEditMarks(mark.marks);
                      }}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Marks</DialogTitle>
          </DialogHeader>
          {editDialog && (
            <div className="space-y-4 py-4">
              <div className="bg-muted rounded-xl p-4">
                <p className="text-sm text-muted-foreground">Student</p>
                <p className="font-semibold">{editDialog.studentName}</p>
                <p className="text-sm text-muted-foreground mt-2">Exam</p>
                <p className="font-medium">{editDialog.exam} - {editDialog.subject}</p>
              </div>
              <div className="space-y-2">
                <Label>Marks (out of {editDialog.maxMarks})</Label>
                <Input
                  type="number"
                  min={0}
                  max={editDialog.maxMarks}
                  value={editMarks}
                  onChange={(e) => setEditMarks(Number(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Grade: <span className="font-semibold">{calculateGrade(editMarks, editDialog.maxMarks)}</span>
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditDialog(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveMarks}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Marks
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
