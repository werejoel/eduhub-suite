import { getExpectedFee, normalizeClassName } from "./schoolConfig";
import type { Fee, Student } from "./types";

export const BURSER_REPORT_CLASS_ROWS = [
  "BABY",
  "TOP",
  "P.1",
  "P.2",
  "P.3",
  "P.4",
  "P.5",
  "P.6",
  "P.7",
] as const;

export function burserRowKeyForClass(className: string): string | null {
  const n = normalizeClassName(className);
  if (n === "BABY") return "BABY";
  if (n === "TOP" || n === "TOPCLASS") return "TOP";
  const match = n.match(/^P(\d)$/);
  if (match) return `P.${match[1]}`;
  return null;
}

/** Build weekly report field map (expected / received / balance) from live students & fees */
export function computeBurserWeeklyFeeFields(
  students: Student[],
  fees: Fee[],
  getClassName: (classId: string) => string,
): Record<string, string> {
  const active = students.filter((s) => s.status === "active");
  const paidByStudent: Record<string, number> = {};
  fees
    .filter((f) => f.payment_status === "paid")
    .forEach((f) => {
      paidByStudent[f.student_id] =
        (paidByStudent[f.student_id] || 0) + Number(f.amount || 0);
    });

  const result: Record<string, string> = {};
  let boardingTotalExp = 0;
  let boardingTotalRec = 0;
  let dayTotalExp = 0;
  let dayTotalRec = 0;

  for (const section of ["boarding", "day"] as const) {
    for (const cls of BURSER_REPORT_CLASS_ROWS) {
      const matched = active.filter((s) => {
        const boarding = s.boarding_status || "day";
        if (section === "boarding" && boarding !== "boarding") return false;
        if (section === "day" && boarding !== "day") return false;
        return burserRowKeyForClass(getClassName(s.class_id)) === cls;
      });
      const expected = matched.reduce(
        (sum, s) =>
          sum +
          getExpectedFee(
            getClassName(s.class_id),
            s.boarding_status || "day",
          ) +
          Number(s.other_fees || 0),
        0,
      );
      const received = matched.reduce(
        (sum, s) => sum + (paidByStudent[s.id] || 0),
        0,
      );
      const balance = Math.max(0, expected - received);
      const prefix = section === "boarding" ? "boarding" : "day";
      result[`${prefix}_${cls}_expected`] = String(expected);
      result[`${prefix}_${cls}_received`] = String(received);
      result[`${prefix}_${cls}_balance`] = String(balance);
      if (section === "boarding") {
        boardingTotalExp += expected;
        boardingTotalRec += received;
      } else {
        dayTotalExp += expected;
        dayTotalRec += received;
      }
    }
  }

  result.boarding_total_expected = String(boardingTotalExp);
  result.boarding_total_received = String(boardingTotalRec);
  result.boarding_total_balance = String(
    Math.max(0, boardingTotalExp - boardingTotalRec),
  );
  result.day_total_expected = String(dayTotalExp);
  result.day_total_received = String(dayTotalRec);
  result.day_total_balance = String(Math.max(0, dayTotalExp - dayTotalRec));
  result.grand_total_expected = String(boardingTotalExp + dayTotalExp);
  result.grand_total_received = String(boardingTotalRec + dayTotalRec);
  result.grand_total_balance = String(
    Math.max(0, boardingTotalExp + dayTotalExp - boardingTotalRec - dayTotalRec),
  );
  return result;
}
