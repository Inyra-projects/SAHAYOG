import {
  type Entry,
  type Kra,
  type Role,
  type EvaluationStatus,
  type MonthlyEvaluation,
  type KpiResult,
  calculateKpiAchievement,
  calculateEvaluationScore,
  krasFor,
} from "./scoring";
import { getStoredUser, PRD_USERS, getAllStaffUsers, type PRDUser } from "./auth";

export type StaffRow = {
  id: string;
  name: string;
  phone: string;
  pin?: string;
  role: Role;
  center: string;
  active: boolean;
};

export type Rating = {
  id: string;
  from_id: string;
  to_id: string;
  stars: number;
  tag: string | null;
  comment: string | null;
  created_at: string;
};

export type LoginStat = {
  staff_id: string;
  last: string | null;
  days7: number;
  total7: number;
};

export type Bootstrap = {
  me: { id: string; name: string; role: Role; center: string };
  staff: StaffRow[];
  kras: Kra[];
  evaluations: MonthlyEvaluation[];
  entries: Entry[]; // Maintained for backwards-compatibility
  ratings: Rating[];
  logins: LoginStat[];
};

export const INITIAL_KRAS: Kra[] = [
  // Home-collection phlebotomist
  { id: "k1", role: "phlebo", name: "Home Visits", target: 160, unit: "visits", weight: 25, direction: "higher_better", sort: 1 },
  { id: "k2", role: "phlebo", name: "Callbacks Closed", target: 95, unit: "%", weight: 20, direction: "higher_better", sort: 2 },
  { id: "k3", role: "phlebo", name: "On-time %", target: 90, unit: "%", weight: 15, direction: "higher_better", sort: 3 },
  { id: "k4", role: "phlebo", name: "Diverted/Ignored Visits", target: 0, unit: "visits", weight: 25, direction: "lower_better", sort: 4 },
  { id: "k5", role: "phlebo", name: "Failed Visits", target: 8, unit: "visits", weight: 15, direction: "lower_better", sort: 5 },

  // Front desk / digital leads
  { id: "k6", role: "frontdesk", name: "Source Leads Tagged", target: 100, unit: "%", weight: 25, direction: "higher_better", sort: 6 },
  { id: "k7", role: "frontdesk", name: "Callbacks SLA", target: 90, unit: "%", weight: 25, direction: "higher_better", sort: 7 },
  { id: "k8", role: "frontdesk", name: "Bookings Done", target: 100, unit: "bookings", weight: 25, direction: "higher_better", sort: 8 },
  { id: "k9", role: "frontdesk", name: "Junk Flagged", target: 90, unit: "%", weight: 25, direction: "higher_better", sort: 9 },
];

export function buildKpiResults(
  kras: Kra[],
  actuals: Record<string, number | null | undefined>
): Record<string, KpiResult> {
  const map: Record<string, KpiResult> = {};
  for (const k of kras) {
    const rawVal = actuals[k.id];
    const actual = rawVal !== undefined && rawVal !== null && !Number.isNaN(rawVal) ? Number(rawVal) : null;
    const achievement = calculateKpiAchievement(k.target, actual, k.direction);
    map[k.id] = {
      target: k.target,
      actual,
      achievement,
      unit: k.unit,
      direction: k.direction,
    };
  }
  return map;
}

export function createEvaluationRecord(
  employeeId: string,
  month: string,
  role: Role,
  status: EvaluationStatus,
  actuals: Record<string, number | null | undefined>,
  feedback = "",
  reviewerId: string | null = null,
  timestamps?: Partial<MonthlyEvaluation["timestamps"]>
): MonthlyEvaluation {
  const ks = INITIAL_KRAS.filter((k) => k.role === role);
  const kpiResults = buildKpiResults(ks, actuals);
  const score = calculateEvaluationScore(ks, kpiResults);
  const now = new Date().toISOString();

  return {
    id: `eval-${employeeId}-${month}`,
    employee_id: employeeId,
    month,
    status,
    kpi_results: kpiResults,
    score,
    feedback,
    reviewer_id: reviewerId,
    timestamps: {
      createdAt: timestamps?.createdAt || now,
      updatedAt: timestamps?.updatedAt || now,
      submittedAt: timestamps?.submittedAt,
      reviewedAt: timestamps?.reviewedAt,
      finalizedAt: timestamps?.finalizedAt,
    },
  };
}

export const INITIAL_EVALUATIONS: MonthlyEvaluation[] = [
  // September 2026 (Completed / Reviewed / Finalized period)
  createEvaluationRecord("u-priya", "2026-09", "phlebo", "Locked/Finalized", { k1: 168, k2: 97, k3: 93, k4: 0, k5: 3 }, "Exceptional home collection volume and zero diverted visits.", "u-sheetal", { createdAt: "2026-09-28T09:00:00Z", submittedAt: "2026-09-30T17:00:00Z", finalizedAt: "2026-10-02T10:00:00Z" }),
  createEvaluationRecord("u-rohit", "2026-09", "phlebo", "Reviewed", { k1: 145, k2: 83, k3: 86, k4: 2, k5: 9 }, "Action plan agreed for SLA callbacks and reducing diverted visits.", "u-sandeep", { createdAt: "2026-09-28T09:00:00Z", submittedAt: "2026-09-30T18:00:00Z", reviewedAt: "2026-10-03T11:30:00Z" }),
  createEvaluationRecord("u-sneha", "2026-09", "phlebo", "Locked/Finalized", { k1: 162, k2: 96, k3: 91, k4: 0, k5: 4 }, "Met and exceeded targets across all parameters with positive patient feedback.", "u-sheetal", { createdAt: "2026-09-28T09:00:00Z", submittedAt: "2026-09-30T16:00:00Z", finalizedAt: "2026-10-02T10:30:00Z" }),
  createEvaluationRecord("u-amit", "2026-09", "phlebo", "Reviewed", { k1: 122, k2: 74, k3: 77, k4: 4, k5: 11 }, "Coaching scheduled on route planning and specimen transport to reduce failed visits.", "u-sandeep", { createdAt: "2026-09-28T09:00:00Z", submittedAt: "2026-09-30T19:00:00Z", reviewedAt: "2026-10-03T14:00:00Z" }),
  createEvaluationRecord("u-meera", "2026-09", "frontdesk", "Locked/Finalized", { k6: 100, k7: 95, k8: 112, k9: 92 }, "Superb digital lead turnaround and center bookings.", "u-sheetal", { createdAt: "2026-09-28T09:00:00Z", submittedAt: "2026-09-30T17:30:00Z", finalizedAt: "2026-10-02T11:00:00Z" }),
  createEvaluationRecord("u-nikhil", "2026-09", "frontdesk", "Reviewed", { k6: 72, k7: 77, k8: 68, k9: 64 }, "Lead tagging needs strict consistency. Source tagging was missing on 28% of leads.", "u-sandeep", { createdAt: "2026-09-28T09:00:00Z", submittedAt: "2026-09-30T18:30:00Z", reviewedAt: "2026-10-03T15:00:00Z" }),
  createEvaluationRecord("u-anjali", "2026-09", "frontdesk", "Locked/Finalized", { k6: 92, k7: 89, k8: 95, k9: 88 }, "Very steady performance across digital inquiries.", "u-sandeep", { createdAt: "2026-09-28T09:00:00Z", submittedAt: "2026-09-30T17:00:00Z", finalizedAt: "2026-10-02T11:30:00Z" }),

  // October 2026 (Current Active Period)
  createEvaluationRecord("u-priya", "2026-10", "phlebo", "Submitted for review", { k1: 156, k2: 96, k3: 92, k4: 0, k5: 2 }, "Covered weekend collections and emergency slots.", null, { createdAt: "2026-10-01T09:00:00Z", submittedAt: "2026-10-25T16:00:00Z" }),
  createEvaluationRecord("u-rohit", "2026-10", "phlebo", "In progress", { k1: 132, k2: 86, k3: 88, k4: 1, k5: null }, "", null, { createdAt: "2026-10-01T09:00:00Z" }),
  createEvaluationRecord("u-sneha", "2026-10", "phlebo", "Submitted for review", { k1: 158, k2: 95, k3: 91, k4: 0, k5: 4 }, "All home collections completed within designated time windows.", null, { createdAt: "2026-10-01T09:00:00Z", submittedAt: "2026-10-25T17:00:00Z" }),
  createEvaluationRecord("u-amit", "2026-10", "phlebo", "Not started", { k1: null, k2: null, k3: null, k4: null, k5: null }, "", null, { createdAt: "2026-10-01T09:00:00Z" }),
  createEvaluationRecord("u-meera", "2026-10", "frontdesk", "Submitted for review", { k6: 100, k7: 94, k8: 106, k9: 91 }, "Ready for manager sign-off.", null, { createdAt: "2026-10-01T09:00:00Z", submittedAt: "2026-10-26T10:00:00Z" }),
  createEvaluationRecord("u-nikhil", "2026-10", "frontdesk", "In progress", { k6: 82, k7: 84, k8: 75, k9: null }, "", null, { createdAt: "2026-10-01T09:00:00Z" }),
  createEvaluationRecord("u-anjali", "2026-10", "frontdesk", "Not started", { k6: null, k7: null, k8: null, k9: null }, "", null, { createdAt: "2026-10-01T09:00:00Z" }),
];

export const INITIAL_ENTRIES: Entry[] = [
  { staff_id: "u-priya", week_start: "2026-09-14", actuals: { k1: 40, k2: 96, k3: 91, k4: 0, k5: 1 } },
  { staff_id: "u-priya", week_start: "2026-09-21", actuals: { k1: 42, k2: 98, k3: 92, k4: 0, k5: 1 } },
  { staff_id: "u-priya", week_start: "2026-09-28", actuals: { k1: 42, k2: 98, k3: 92, k4: 0, k5: 1 } },
];

export const INITIAL_RATINGS: Rating[] = [
  { id: "r1", from_id: "u-meera", to_id: "u-priya", stars: 5, tag: "Patient handling", comment: null, created_at: new Date().toISOString() },
  { id: "r2", from_id: "u-sneha", to_id: "u-rohit", stars: 3, tag: "Handoffs", comment: null, created_at: new Date().toISOString() },
  { id: "r3", from_id: "u-anjali", to_id: "u-meera", stars: 4, tag: "Lead tagging", comment: null, created_at: new Date().toISOString() },
];

let memoryStore: Record<string, string> = {};

export function resetLocalStore(): void {
  memoryStore = {};
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("sahayog-kra-staff");
      localStorage.removeItem("sahayog-kra-kras");
      localStorage.removeItem("sahayog-kra-evaluations");
      localStorage.removeItem("sahayog-kra-entries");
      localStorage.removeItem("sahayog-kra-ratings");
    } catch {
      // ignore
    }
  }
}

export function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    const mem = memoryStore[key];
    return mem ? JSON.parse(mem) : fallback;
  }
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      memoryStore[key] = raw;
      return JSON.parse(raw);
    }
    delete memoryStore[key];
    return fallback;
  } catch {
    return fallback;
  }
}

export function setItem<T>(key: string, value: T): void {
  const str = JSON.stringify(value);
  memoryStore[key] = str;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, str);
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
}

export function getLocalEvaluations(): MonthlyEvaluation[] {
  return getItem<MonthlyEvaluation[]>("sahayog-kra-evaluations", INITIAL_EVALUATIONS);
}

export function getLocalEvaluation(staffId: string, month: string): MonthlyEvaluation | undefined {
  const evals = getLocalEvaluations();
  return evals.find((e) => e.employee_id === staffId && e.month === month);
}

export function saveLocalEvaluation(params: {
  employee_id: string;
  month: string;
  status: EvaluationStatus;
  actuals: Record<string, number | null | undefined>;
  feedback?: string;
  reviewer_id?: string | null;
}): MonthlyEvaluation {
  const evals = getLocalEvaluations();
  const kras = getItem<Kra[]>("sahayog-kra-kras", INITIAL_KRAS);
  const staffList = getItem<(StaffRow & { pin?: string })[]>("sahayog-kra-staff", PRD_USERS);
  const staff = staffList.find((s) => s.id === params.employee_id);
  const role = staff?.role || "phlebo";
  const ks = krasFor(kras, role);

  const idx = evals.findIndex((e) => e.employee_id === params.employee_id && e.month === params.month);
  const existing = idx >= 0 ? evals[idx] : undefined;

  // Build target snapshots from current or existing targets
  const kpiResults: Record<string, KpiResult> = {};
  for (const k of ks) {
    const rawVal = params.actuals ? params.actuals[k.id] : existing?.kpi_results[k.id]?.actual;
    const actual = rawVal !== undefined && rawVal !== null && !Number.isNaN(rawVal) ? Number(rawVal) : null;
    const existingSnap = existing?.kpi_results[k.id];
    const target = existingSnap?.target ?? k.target;
    const unit = existingSnap?.unit ?? k.unit;
    const direction = existingSnap?.direction ?? k.direction;
    const achievement = calculateKpiAchievement(target, actual, direction);

    kpiResults[k.id] = {
      target,
      actual,
      achievement,
      unit,
      direction,
    };
  }

  const score = calculateEvaluationScore(ks, kpiResults);
  const now = new Date().toISOString();

  const record: MonthlyEvaluation = {
    id: existing?.id || `eval-${params.employee_id}-${params.month}`,
    employee_id: params.employee_id,
    month: params.month,
    status: params.status,
    kpi_results: kpiResults,
    score,
    feedback: params.feedback !== undefined ? params.feedback : existing?.feedback || "",
    reviewer_id: params.reviewer_id !== undefined ? params.reviewer_id : existing?.reviewer_id || null,
    timestamps: {
      createdAt: existing?.timestamps.createdAt || now,
      updatedAt: now,
      submittedAt: params.status === "Submitted for review" ? (existing?.timestamps.submittedAt || now) : existing?.timestamps.submittedAt,
      reviewedAt: params.status === "Reviewed" ? (existing?.timestamps.reviewedAt || now) : existing?.timestamps.reviewedAt,
      finalizedAt: params.status === "Locked/Finalized" ? (existing?.timestamps.finalizedAt || now) : existing?.timestamps.finalizedAt,
    },
  };

  if (idx >= 0) {
    evals[idx] = record;
  } else {
    evals.push(record);
  }

  setItem("sahayog-kra-evaluations", evals);
  return record;
}

export function updateLocalEvaluationStatus(
  employeeId: string,
  month: string,
  status: EvaluationStatus,
  reviewerId?: string | null,
  feedback?: string
): MonthlyEvaluation {
  const evals = getLocalEvaluations();
  const existing = evals.find((e) => e.employee_id === employeeId && e.month === month);

  const actuals: Record<string, number | null> = {};
  if (existing) {
    for (const [k, v] of Object.entries(existing.kpi_results)) {
      actuals[k] = v.actual;
    }
  }

  return saveLocalEvaluation({
    employee_id: employeeId,
    month,
    status,
    actuals,
    feedback: feedback !== undefined ? feedback : existing?.feedback,
    reviewer_id: reviewerId !== undefined ? reviewerId : existing?.reviewer_id,
  });
}

export function getLocalBootstrap(token?: string): Bootstrap {
  const allUsers = getAllStaffUsers();
  const defaultMe = PRD_USERS[0]!;
  let meUser: PRDUser | null = null;

  if (token) {
    meUser = allUsers.find((u) => u.id === token) ?? null;
  }
  if (!meUser) {
    meUser = getStoredUser() || defaultMe;
  }

  const me = { id: meUser.id, name: meUser.name, role: meUser.role, center: meUser.center };

  const initialStaffList: (StaffRow & { pin?: string })[] = PRD_USERS.map((u) => ({
    id: u.id,
    name: u.name,
    phone: u.phone,
    pin: u.pin,
    role: u.role,
    center: u.center,
    active: u.active,
  }));

  const loadedStaff = getItem<(StaffRow & { pin?: string })[]>("sahayog-kra-staff", initialStaffList);
  const missing = initialStaffList.filter((init) => !loadedStaff.some((s) => s.id === init.id));
  const staffWithPins = missing.length > 0 ? [...loadedStaff, ...missing] : loadedStaff;

  const staff: StaffRow[] = staffWithPins.map((s) => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    role: s.role,
    center: s.center,
    active: s.active,
  }));

  const kras: Kra[] = getItem<Kra[]>("sahayog-kra-kras", INITIAL_KRAS);
  const evaluations: MonthlyEvaluation[] = getItem<MonthlyEvaluation[]>("sahayog-kra-evaluations", INITIAL_EVALUATIONS);
  const entries: Entry[] = getItem<Entry[]>("sahayog-kra-entries", INITIAL_ENTRIES);
  const ratings: Rating[] = getItem<Rating[]>("sahayog-kra-ratings", INITIAL_RATINGS);

  const isLead = meUser.role === "admin" || meUser.role === "manager";

  const logins: LoginStat[] = staff.map((s) => ({
    staff_id: s.id,
    last: new Date().toISOString(),
    days7: 5,
    total7: 7,
  }));

  // Preserve all staff for leads; regular staff see colleagues for peer review
  const filteredStaff = staff.map((s) => (meUser?.role === "admin" ? s : { ...s, phone: isLead ? s.phone : "" }));

  const filteredEvaluations = isLead ? evaluations : evaluations.filter((e) => e.employee_id === meUser.id);
  const filteredEntries = isLead ? entries : entries.filter((e) => e.staff_id === meUser.id);
  const filteredRatings = isLead ? ratings : ratings.filter((r) => r.from_id === meUser.id);

  return {
    me,
    staff: filteredStaff,
    kras,
    evaluations: filteredEvaluations,
    entries: filteredEntries,
    ratings: filteredRatings,
    logins,
  };
}

export function saveLocalEntry(staffId: string, weekStart: string, actuals: Record<string, number>): void {
  const entries = getItem<Entry[]>("sahayog-kra-entries", INITIAL_ENTRIES);
  const idx = entries.findIndex((e) => e.staff_id === staffId && e.week_start === weekStart);
  if (idx >= 0) {
    const item = entries[idx];
    if (item) item.actuals = actuals;
  } else {
    entries.push({ staff_id: staffId, week_start: weekStart, actuals });
  }
  setItem("sahayog-kra-entries", entries);
}

export function addLocalRating(fromId: string, toId: string, stars: number, tag?: string, comment?: string): void {
  const ratings = getItem<Rating[]>("sahayog-kra-ratings", INITIAL_RATINGS);
  ratings.unshift({
    id: `r-${Date.now()}`,
    from_id: fromId,
    to_id: toId,
    stars,
    tag: tag || null,
    comment: comment || null,
    created_at: new Date().toISOString(),
  });
  setItem("sahayog-kra-ratings", ratings);
}

export function upsertLocalStaff(data: {
  id?: string;
  name?: string;
  phone?: string;
  pin?: string;
  role?: Role;
  center?: string;
  active?: boolean;
}): { ok: boolean; staff?: StaffRow; error?: string } {
  const initialStaffList: (StaffRow & { pin?: string })[] = PRD_USERS.map((u) => ({
    id: u.id,
    name: u.name,
    phone: u.phone,
    pin: u.pin,
    role: u.role,
    center: u.center,
    active: u.active,
  }));

  const rawStaff = getItem<(StaffRow & { pin?: string })[]>("sahayog-kra-staff", initialStaffList);
  const staff = rawStaff.map((s) => ({ ...s }));

  if (data.id) {
    const idx = staff.findIndex((s) => s.id === data.id);
    if (idx >= 0 && staff[idx]) {
      const existing = staff[idx];
      staff[idx] = {
        ...existing,
        name: data.name ?? existing.name,
        phone: data.phone ?? existing.phone,
        role: data.role ?? existing.role,
        center: data.center ?? existing.center,
        active: data.active ?? existing.active,
        pin: data.pin || existing.pin || "1234",
      };
      setItem("sahayog-kra-staff", staff);
      return { ok: true, staff: staff[idx] };
    }
  }

  // Adding new staff: check for duplicate ID
  const newId = data.id || `u-${(data.name || "staff").toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now().toString().slice(-4)}`;
  const duplicate = staff.some((s) => s.id === newId);
  if (duplicate) {
    return { ok: false, error: "Employee ID already exists. Please choose a unique identifier." };
  }

  const newStaff: StaffRow & { pin?: string } = {
    id: newId,
    name: data.name || "New Staff",
    phone: data.phone || "9876509999",
    pin: data.pin || "1234",
    role: data.role || "phlebo",
    center: data.center || "Nanded City",
    active: data.active ?? true,
  };

  staff.push(newStaff);
  setItem("sahayog-kra-staff", staff);
  return { ok: true, staff: newStaff };
}

export function toggleLocalStaffActive(id: string): { ok: boolean; active?: boolean; error?: string } {
  const initialStaffList: (StaffRow & { pin?: string })[] = PRD_USERS.map((u) => ({
    id: u.id,
    name: u.name,
    phone: u.phone,
    pin: u.pin,
    role: u.role,
    center: u.center,
    active: u.active,
  }));
  const rawStaff = getItem<(StaffRow & { pin?: string })[]>("sahayog-kra-staff", initialStaffList);
  const staff = rawStaff.map((s) => ({ ...s }));
  const idx = staff.findIndex((s) => s.id === id);
  if (idx < 0 || !staff[idx]) {
    return { ok: false, error: "Staff member not found" };
  }
  const current = staff[idx].active;
  staff[idx].active = !current;
  setItem("sahayog-kra-staff", staff);
  // Note: Historical evaluations in "sahayog-kra-evaluations" remain strictly untouched and preserved!
  return { ok: true, active: !current };
}

export function upsertLocalKra(data: {
  id?: string;
  role?: "phlebo" | "frontdesk";
  name?: string;
  target?: number;
  unit?: string;
  weight?: number;
  direction?: "higher_better" | "lower_better";
}): void {
  const kras = getItem<Kra[]>("sahayog-kra-kras", INITIAL_KRAS);
  if (data.id) {
    const idx = kras.findIndex((k) => k.id === data.id);
    if (idx >= 0 && kras[idx]) {
      kras[idx] = { ...kras[idx], ...data } as Kra;
    }
  } else {
    kras.push({
      id: `k-${Date.now()}`,
      role: data.role || "phlebo",
      name: data.name || "New KPI",
      target: data.target ?? 0,
      unit: data.unit ?? "",
      weight: data.weight ?? 0,
      direction: data.direction ?? "higher_better",
      sort: kras.length + 1,
    });
  }
  setItem("sahayog-kra-kras", kras);
}

export function deleteLocalKra(id: string): void {
  const kras = getItem<Kra[]>("sahayog-kra-kras", INITIAL_KRAS);
  const updated = kras.filter((k) => k.id !== id);
  setItem("sahayog-kra-kras", updated);
}

