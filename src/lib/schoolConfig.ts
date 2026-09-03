import { StudentRequirement } from "./types";

/** Fee amounts in UGX */
export const FEE_STRUCTURE = {
  day_baby_top: 100_000,
  day_p1_p3: 120_000,
  boarding_p4_p7: 300_000,
  registration: 50_000,
} as const;

export const BOARDING_STORE_REQUIREMENTS: StudentRequirement[] = [
  { id: "b1", name: "Posho — 20 kgs", completed: false },
  { id: "b2", name: "Beans — 10 kgs", completed: false },
  { id: "b3", name: "Sugar — 4 kgs", completed: false },
  { id: "b4", name: "Gnuts — 4 kgs", completed: false },
  { id: "b5", name: "Tissues — 4 Rolls", completed: false },
  { id: "b6", name: "Broom — 1", completed: false },
  { id: "b7", name: "Squeezer — 1", completed: false },
];

export const DAY_STORE_REQUIREMENTS: StudentRequirement[] = [
  { id: "d1", name: "Sugar — 2 kgs", completed: false },
  { id: "d2", name: "Tissues — 2 Rolls", completed: false },
];

export const EXAM_TERMS = [
  "Beginning of Term",
  "Mid Term",
  "End of Term",
] as const;

export type ExamTerm = (typeof EXAM_TERMS)[number];

export const CLASS_LEVELS = {
  baby_top: ["Baby", "Top", "BABY", "TOP"],
  p1_p7: ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P.1", "P.2", "P.3", "P.4", "P.5", "P.6", "P.7"],
} as const;

export function normalizeClassName(className: string): string {
  return className.toUpperCase().replace(/\./g, "").replace(/\s/g, "").trim();
}

export function isBabyTopClass(className: string): boolean {
  const n = normalizeClassName(className);
  return n === "BABY" || n === "TOP";
}

export function isP1P3Class(className: string): boolean {
  const n = normalizeClassName(className);
  return ["P1", "P2", "P3"].includes(n);
}

export function isP4P7Class(className: string): boolean {
  const n = normalizeClassName(className);
  return ["P4", "P5", "P6", "P7"].includes(n);
}

export function getClassGroup(className: string): "baby_top" | "p1_p7" | "other" {
  if (isBabyTopClass(className)) return "baby_top";
  if (isP1P3Class(className) || isP4P7Class(className)) return "p1_p7";
  return "other";
}

/** Returns expected term fee based on class and day/boarding section */
export function getExpectedFee(
  className: string,
  boardingStatus: "day" | "boarding" = "day",
): number {
  if (isBabyTopClass(className)) {
    return FEE_STRUCTURE.day_baby_top;
  }
  if (isP1P3Class(className) && boardingStatus === "day") {
    return FEE_STRUCTURE.day_p1_p3;
  }
  if (isP4P7Class(className) && boardingStatus === "boarding") {
    return FEE_STRUCTURE.boarding_p4_p7;
  }
  if (boardingStatus === "boarding") {
    return FEE_STRUCTURE.boarding_p4_p7;
  }
  if (isP1P3Class(className)) {
    return FEE_STRUCTURE.day_p1_p3;
  }
  return FEE_STRUCTURE.day_baby_top;
}

/** Returns store checklist items based on day/boarding section */
export function getStoreRequirements(
  boardingStatus: "day" | "boarding" = "day",
): StudentRequirement[] {
  return boardingStatus === "boarding"
    ? BOARDING_STORE_REQUIREMENTS.map((r) => ({ ...r }))
    : DAY_STORE_REQUIREMENTS.map((r) => ({ ...r }));
}

/** Burser weekly report fee reference per class row */
export const BURSER_FEE_REFERENCE: Record<string, { day?: number; boarding?: number }> = {
  BABY: { day: FEE_STRUCTURE.day_baby_top },
  TOP: { day: FEE_STRUCTURE.day_baby_top },
  "P.1": { day: FEE_STRUCTURE.day_p1_p3 },
  "P.2": { day: FEE_STRUCTURE.day_p1_p3 },
  "P.3": { day: FEE_STRUCTURE.day_p1_p3 },
  "P.4": { boarding: FEE_STRUCTURE.boarding_p4_p7 },
  "P.5": { boarding: FEE_STRUCTURE.boarding_p4_p7 },
  "P.6": { boarding: FEE_STRUCTURE.boarding_p4_p7 },
  "P.7": { boarding: FEE_STRUCTURE.boarding_p4_p7 },
};
