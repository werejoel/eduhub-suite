import { StudentRequirement } from "./types";

/** Fee amounts in UGX */
export const FEE_STRUCTURE = {
  day_baby_top: 100_000,
  day_p1_p3: 120_000,
  boarding_p4_p7: 300_000,
  registration: 50_000,
} as const;

function req(
  id: string,
  name: string,
  requiredQuantity: number,
  unit: string,
): StudentRequirement {
  return {
    id,
    name,
    completed: false,
    requiredQuantity,
    broughtQuantity: 0,
    unit,
  };
}

export const BOARDING_STORE_REQUIREMENTS: StudentRequirement[] = [
  req("b1", "Posho", 20, "kgs"),
  req("b2", "Beans", 10, "kgs"),
  req("b3", "Sugar", 4, "kgs"),
  req("b4", "Gnuts", 4, "kgs"),
  req("b5", "Tissues", 4, "rolls"),
  req("b6", "Broom", 1, "pcs"),
  req("b7", "Squeezer", 1, "pcs"),
];

export const DAY_STORE_REQUIREMENTS: StudentRequirement[] = [
  req("d1", "Sugar", 2, "kgs"),
  req("d2", "Tissues", 2, "rolls"),
];

export const COMMON_STUDENT_REQUIREMENTS: StudentRequirement[] = [
  req("church-fee", "Church fee", 5000, "UGX"),
  req("medical-fees", "Medical fees", 10_000, "UGX"),
  req("holiday-package", "Holiday package", 5000, "UGX"),
  req("hair-trimming", "Hair trimming", 3000, "UGX"),
];

/** Default student tracking checklist (number + items) */
export const DEFAULT_TRACKING_CHECKLIST = [
  { id: "trk-1", label: "Admission file opened", done: false },
  { id: "trk-2", label: "Requirements verified", done: false },
  { id: "trk-3", label: "Fees / registration cleared", done: false },
  { id: "trk-4", label: "Store items received", done: false },
  { id: "trk-5", label: "Uniform issued", done: false },
  { id: "trk-6", label: "Parent contact confirmed", done: false },
] as const;

export const PRIMARY_UNIFORM_REQUIREMENTS: StudentRequirement[] = [
  { id: "uniform", name: "Uniform — UGX 40,000", completed: false },
  {
    id: "casual-uniform",
    name: "Casual uniform — UGX 28,000",
    completed: false,
  },
  { id: "sports-wear", name: "Sports wear — UGX 50,000", completed: false },
  {
    id: "sunday-uniform",
    name: "Sunday uniform — UGX 30,000",
    completed: false,
  },
  { id: "sweater", name: "Sweater — UGX 30,000", completed: false },
  {
    id: "white-stocking",
    name: "White stockings — 2 pairs, UGX 7,000",
    completed: false,
  },
];

export const EXAM_TERMS = [
  "Beginning of Term",
  "Mid Term",
  "End of Term",
] as const;

export type ExamTerm = (typeof EXAM_TERMS)[number];

/** Standard Kabale classes — use when seeding or quick-add */
export const SCHOOL_CLASS_PRESETS = [
  { class_name: "Baby", class_code: "BABY", form_number: 0 },
  { class_name: "Top Class", class_code: "TOP", form_number: 0 },
  { class_name: "P.1", class_code: "P1", form_number: 1 },
  { class_name: "P.2", class_code: "P2", form_number: 2 },
  { class_name: "P.3", class_code: "P3", form_number: 3 },
  { class_name: "P.4", class_code: "P4", form_number: 4 },
  { class_name: "P.5", class_code: "P5", form_number: 5 },
  { class_name: "P.6", class_code: "P6", form_number: 6 },
  { class_name: "P.7", class_code: "P7", form_number: 7 },
] as const;

/** Dropdown catalog for store / requirements (admin can still type custom items) */
export const STORE_ITEM_CATALOG = [
  { key: "posho", label: "Posho", unit: "kgs", defaultRequired: 20 },
  { key: "beans", label: "Beans", unit: "kgs", defaultRequired: 10 },
  { key: "sugar", label: "Sugar", unit: "kgs", defaultRequired: 2 },
  { key: "gnuts", label: "Gnuts", unit: "kgs", defaultRequired: 4 },
  { key: "tissues", label: "Tissues", unit: "rolls", defaultRequired: 2 },
  { key: "broom", label: "Broom", unit: "pcs", defaultRequired: 1 },
  { key: "squeezer", label: "Squeezer", unit: "pcs", defaultRequired: 1 },
  { key: "uniform", label: "Uniform", unit: "set", defaultRequired: 1 },
  { key: "church-fee", label: "Church fee", unit: "UGX", defaultRequired: 5000 },
] as const;

export const CLASS_LEVELS = {
  baby_top: ["Baby", "Top Class", "Top", "BABY", "TOP", "TOPCLASS"],
  p1_p7: [
    "P1",
    "P2",
    "P3",
    "P4",
    "P5",
    "P6",
    "P7",
    "P.1",
    "P.2",
    "P.3",
    "P.4",
    "P.5",
    "P.6",
    "P.7",
  ],
} as const;

export function normalizeClassName(className: string): string {
  return className.toUpperCase().replace(/\./g, "").replace(/\s/g, "").trim();
}

export function isBabyTopClass(className: string): boolean {
  const n = normalizeClassName(className);
  return n === "BABY" || n === "TOP" || n === "TOPCLASS";
}

export function isP1P3Class(className: string): boolean {
  const n = normalizeClassName(className);
  return ["P1", "P2", "P3"].includes(n);
}

export function isP4P7Class(className: string): boolean {
  const n = normalizeClassName(className);
  return ["P4", "P5", "P6", "P7"].includes(n);
}

export function getClassGroup(
  className: string,
): "baby_top" | "p1_p7" | "other" {
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

export function getStudentRequirements(
  boardingStatus: "day" | "boarding" = "day",
  className = "",
  existingRequirements: StudentRequirement[] = [],
): StudentRequirement[] {
  const defaults = [
    ...getStoreRequirements(boardingStatus),
    ...COMMON_STUDENT_REQUIREMENTS,
    ...(isP1P3Class(className) || isP4P7Class(className)
      ? PRIMARY_UNIFORM_REQUIREMENTS
      : []),
  ];
  const existingById = new Map(
    existingRequirements.map((requirement) => [requirement.id, requirement]),
  );
  return defaults.map((requirement) => {
    const existing = existingById.get(requirement.id);
    if (!existing) return { ...requirement };
    const required =
      existing.requiredQuantity ?? requirement.requiredQuantity ?? 0;
    const brought = existing.broughtQuantity ?? 0;
    return {
      ...requirement,
      ...existing,
      requiredQuantity: required,
      broughtQuantity: brought,
      completed:
        required > 0 ? brought >= required : Boolean(existing.completed),
    };
  }).concat(
    existingRequirements.filter(
      (existing) => !defaults.some((requirement) => requirement.id === existing.id),
    ),
  );
}

export function getRequirementRemaining(requirement: StudentRequirement): number {
  const required = requirement.requiredQuantity ?? 0;
  const brought = requirement.broughtQuantity ?? 0;
  if (required <= 0) return requirement.completed ? 0 : 1;
  return Math.max(0, required - brought);
}

export function getRequirementsProgress(requirements: StudentRequirement[]) {
  let requiredTotal = 0;
  let broughtTotal = 0;
  let completedCount = 0;
  requirements.forEach((r) => {
    const reqQty = r.requiredQuantity ?? 0;
    const brought = r.broughtQuantity ?? 0;
    if (reqQty > 0) {
      requiredTotal += reqQty;
      broughtTotal += Math.min(brought, reqQty);
      if (brought >= reqQty) completedCount += 1;
    } else if (r.completed) {
      completedCount += 1;
      requiredTotal += 1;
      broughtTotal += 1;
    } else {
      requiredTotal += 1;
    }
  });
  return {
    completedCount,
    totalCount: requirements.length,
    requiredTotal,
    broughtTotal,
    remainingTotal: Math.max(0, requiredTotal - broughtTotal),
    label:
      requiredTotal > 0
        ? `${broughtTotal}/${requiredTotal} units`
        : `${completedCount}/${requirements.length}`,
  };
}

/** Rebuild checklist when class or boarding section changes */
export function refreshStudentRequirements(
  boardingStatus: "day" | "boarding",
  className: string,
  existing: StudentRequirement[] = [],
): StudentRequirement[] {
  return getStudentRequirements(boardingStatus, className, existing);
}

/** Burser weekly report fee reference per class row */
export const BURSER_FEE_REFERENCE: Record<
  string,
  { day?: number; boarding?: number }
> = {
  BABY: { day: FEE_STRUCTURE.day_baby_top },
  TOP: { day: FEE_STRUCTURE.day_baby_top },
  TOPCLASS: { day: FEE_STRUCTURE.day_baby_top },
  "P.1": { day: FEE_STRUCTURE.day_p1_p3 },
  "P.2": { day: FEE_STRUCTURE.day_p1_p3 },
  "P.3": { day: FEE_STRUCTURE.day_p1_p3 },
  "P.4": { boarding: FEE_STRUCTURE.boarding_p4_p7 },
  "P.5": { boarding: FEE_STRUCTURE.boarding_p4_p7 },
  "P.6": { boarding: FEE_STRUCTURE.boarding_p4_p7 },
  "P.7": { boarding: FEE_STRUCTURE.boarding_p4_p7 },
};
