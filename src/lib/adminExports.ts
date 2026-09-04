import { Student, Fee, User, Class } from "./types";
import { exportToExcel, exportToCSV } from "./exportToExcel";
import { getExpectedFee } from "./schoolConfig";

type ExportFormat = "excel" | "csv";

const doExport = (data: Record<string, unknown>[], fileName: string, format: ExportFormat) => {
  if (format === "excel") {
    exportToExcel(data, fileName);
  } else {
    exportToCSV(data, fileName);
  }
};

export const exportStudents = (
  students: Student[],
  classes: Class[],
  format: ExportFormat,
) => {
  const getClassName = (classId: string) =>
    classes.find((c) => c.id === classId)?.class_name || "Unassigned";

  const data = students.map((s) => ({
    "Admission No.": s.admission_number,
    "First Name": s.first_name,
    "Last Name": s.last_name,
    "Other Names": s.other_names || "",
    Class: getClassName(s.class_id),
    Gender: s.gender,
    Section: s.boarding_status === "boarding" ? "Boarding" : "Day",
    Status: s.status,
    "Date of Birth": s.date_of_birth,
    "Enrollment Date": s.enrollment_date,
    Parents: s.parents_names || "",
    Contact: s.contact || "",
    "Registration Fee": s.registration_fee || 0,
    "Expected Term Fee": getExpectedFee(
      getClassName(s.class_id),
      s.boarding_status || "day",
    ),
  }));

  doExport(data, `Students_${new Date().toISOString().split("T")[0]}`, format);
};

export const exportFees = (
  fees: Fee[],
  students: Student[],
  format: ExportFormat,
) => {
  const data = fees.map((f) => {
    const student = students.find((s) => s.id === f.student_id);
    return {
      Student: student
        ? `${student.first_name} ${student.last_name}`
        : "Unknown",
      "Admission No.": student?.admission_number || "",
      Amount: f.amount,
      Term: f.term,
      "Academic Year": f.academic_year,
      Status: f.payment_status,
      "Due Date": f.due_date,
      "Paid Date": f.paid_date || "",
    };
  });

  doExport(data, `Fees_${new Date().toISOString().split("T")[0]}`, format);
};

export const exportUsers = (users: User[], format: ExportFormat) => {
  const data = users.map((u) => ({
    Name: `${u.first_name} ${u.last_name}`,
    Email: u.email,
    Role: u.role,
    "Email Confirmed": u.email_confirmed ? "Yes" : "No",
    "Account Status": u.account_status || "active",
    Phone: u.phone || "",
    Registered: u.createdAt
      ? new Date(u.createdAt).toLocaleDateString()
      : "",
  }));

  doExport(data, `Users_${new Date().toISOString().split("T")[0]}`, format);
};

export const exportOutstandingFees = (
  students: Student[],
  fees: Fee[],
  classes: Class[],
  format: ExportFormat,
) => {
  const getClassName = (classId: string) =>
    classes.find((c) => c.id === classId)?.class_name || "Unassigned";

  const data = students
    .filter((s) => s.status === "active")
    .map((s) => {
      const className = getClassName(s.class_id);
      const expected = getExpectedFee(className, s.boarding_status || "day");
      const paid = fees
        .filter((f) => f.student_id === s.id && f.payment_status === "paid")
        .reduce((sum, f) => sum + (f.amount || 0), 0);
      const balance = Math.max(0, expected - paid);
      return {
        Student: `${s.first_name} ${s.last_name}`,
        "Admission No.": s.admission_number,
        Class: className,
        Section: s.boarding_status === "boarding" ? "Boarding" : "Day",
        "Expected Fee": expected,
        Paid: paid,
        Balance: balance,
        "Fully Paid": balance === 0 ? "Yes" : "No",
      };
    })
    .filter((row) => row.Balance > 0);

  doExport(
    data,
    `Outstanding_Fees_${new Date().toISOString().split("T")[0]}`,
    format,
  );
};
