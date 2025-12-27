import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraduationCap, Save, Calendar } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface AttendanceRecord {
  id: string;
  studentName: string;
  rollNumber: string;
  present: boolean;
}

const initialAttendance: AttendanceRecord[] = [
  { id: "1", studentName: "Alice Johnson", rollNumber: "10A-001", present: true },
  { id: "2", studentName: "Bob Smith", rollNumber: "10A-002", present: true },
  { id: "3", studentName: "Carol Williams", rollNumber: "10A-003", present: false },
  { id: "4", studentName: "David Brown", rollNumber: "10A-004", present: true },
  { id: "5", studentName: "Eva Martinez", rollNumber: "10A-005", present: true },
  { id: "6", studentName: "Frank Wilson", rollNumber: "10A-006", present: true },
];

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);
  const [selectedClass, setSelectedClass] = useState("Grade 10A");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const toggleAttendance = (id: string) => {
    setAttendance(
      attendance.map((a) => (a.id === id ? { ...a, present: !a.present } : a))
    );
  };

  const presentCount = attendance.filter((a) => a.present).length;
  const absentCount = attendance.length - presentCount;

  const handleSave = () => {
    toast.success("Attendance saved successfully");
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Attendance"
        description="Mark daily attendance for your classes"
        icon={GraduationCap}
      />

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-4 border border-border shadow-md mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
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
          <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none outline-none text-sm"
            />
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-4 text-sm">
            <span className="text-success font-medium">Present: {presentCount}</span>
            <span className="text-destructive font-medium">Absent: {absentCount}</span>
          </div>
        </div>
      </motion.div>

      {/* Attendance List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl border border-border shadow-md overflow-hidden"
      >
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="font-semibold">Student Attendance - {selectedClass}</h3>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Attendance
          </Button>
        </div>
        <div className="divide-y divide-border">
          {attendance.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  {record.studentName.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-medium">{record.studentName}</p>
                  <p className="text-sm text-muted-foreground">{record.rollNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    record.present
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {record.present ? "Present" : "Absent"}
                </span>
                <Checkbox
                  checked={record.present}
                  onCheckedChange={() => toggleAttendance(record.id)}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
