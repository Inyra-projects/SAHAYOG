export type Role = "admin" | "manager" | "phlebo" | "frontdesk";

export type EvaluationStatus =
  | "Not started"
  | "In progress"
  | "Submitted for review"
  | "Reviewed"
  | "Locked/Finalized";

export type AdminEvaluationState = "In Review" | "Approved" | "Pending";
export type ManagerEvaluationState = "Draft" | "In Review" | "Approved" | "Pending";

/** Map evaluation status to condensed 3-state Admin view (PRD Section 4 & FR-04) */
export function getAdminEvaluationState(status: EvaluationStatus): AdminEvaluationState {
  if (status === "Submitted for review") {
    return "In Review";
  }
  if (status === "Reviewed" || status === "Locked/Finalized") {
    return "Approved";
  }
  return "Pending";
}

/** Map evaluation status to operational tracking states for Center Manager */
export function getManagerEvaluationState(status: EvaluationStatus): ManagerEvaluationState {
  if (status === "In progress") {
    return "Draft";
  }
  if (status === "Submitted for review") {
    return "In Review";
  }
  if (status === "Reviewed" || status === "Locked/Finalized") {
    return "Approved";
  }
  return "Pending";
}

export type Kra = {
  id: string;
  role: "phlebo" | "frontdesk";
  name: string;
  target: number;
  unit: string;
  weight: number;
  direction: "higher_better" | "lower_better";
  sort: number;
};

export type KpiResult = {
  target: number;
  actual: number | null;
  achievement: number | null;
  unit: string;
  direction: "higher_better" | "lower_better";
};

export type MonthlyEvaluation = {
  id: string;
  employee_id: string;
  month: string; // YYYY-MM
  status: EvaluationStatus;
  kpi_results: Record<string, KpiResult>;
  score: number | null;
  feedback: string;
  reviewer_id: string | null;
  timestamps: {
    createdAt: string;
    updatedAt: string;
    submittedAt?: string;
    reviewedAt?: string;
    finalizedAt?: string;
  };
};

export type Entry = { staff_id: string; week_start: string; actuals: Record<string, number> };
export type Band = "green" | "amber" | "red";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  manager: "Center manager",
  phlebo: "Home-collection phlebotomist",
  frontdesk: "Front desk / digital leads",
};

export const STATUS_LABEL: Record<EvaluationStatus, string> = {
  "Not started": "Not started",
  "In progress": "In progress",
  "Submitted for review": "Submitted for review",
  Reviewed: "Reviewed",
  "Locked/Finalized": "Locked / Finalized",
};

export const DEFAULT_EVALUATION_MONTH = "2026-10";

export const EVALUATION_MONTHS = ["2026-10", "2026-09", "2026-08", "2026-07"];

/** Achievement for one KRA as a fraction (1 = 100%), capped at 120%. Returns null if missing. */
export function achievement(k: Kra, actual: number | undefined | null): number | null {
  if (actual === undefined || actual === null || Number.isNaN(actual)) return null;
  const t = Number(k.target);
  if (k.direction === "higher_better") {
    if (t <= 0) return 1.2;
    return Math.max(0, Math.min(actual / t, 1.2));
  }
  if (t === 0) return Math.max(0, 1 - actual * 0.25);
  if (actual <= t) return 1;
  const penalty = t === 2 ? (actual - t) * 0.2 : (actual - t) / t;
  return Math.max(0, 1 - penalty);
}

/** Calculate percentage achievement (e.g. 100%). Returns null if no actual data entered. */
export function calculateKpiAchievement(
  target: number,
  actual: number | null | undefined,
  direction: "higher_better" | "lower_better"
): number | null {
  if (actual === null || actual === undefined || Number.isNaN(actual)) {
    return null; // Missing values must be treated as pending / no data, not 0%
  }
  const t = Number(target);
  if (direction === "higher_better") {
    if (t <= 0) return 100;
    const ratio = (actual / t) * 100;
    return Math.max(0, Math.min(Math.round(ratio), 120));
  }
  // Lower is better:
  if (t === 0) {
    return Math.max(0, Math.round((1 - actual * 0.25) * 100));
  }
  if (actual <= t) return 100;
  const penalty = t === 2 ? (actual - t) * 0.2 : (actual - t) / t;
  return Math.max(0, Math.round((1 - penalty) * 100));
}

/** Weighted overall score in percent. Returns null if no actuals are entered. */
export function calculateEvaluationScore(
  kras: Kra[],
  kpiResults: Record<string, { actual?: number | null; achievement?: number | null }>
): number | null {
  let totalWeight = 0;
  let weightedSum = 0;
  let enteredCount = 0;

  for (const k of kras) {
    const res = kpiResults[k.id];
    if (res && res.actual !== undefined && res.actual !== null && res.achievement !== null && res.achievement !== undefined) {
      enteredCount++;
      const w = Number(k.weight) || 0;
      weightedSum += (res.achievement / 100) * w;
      totalWeight += w;
    }
  }

  if (enteredCount === 0 || totalWeight === 0) return null;
  return Math.round((weightedSum / totalWeight) * 100);
}

/** Weighted week score in percent (for backwards compatibility). */
export function weekScore(kras: Kra[], actuals: Record<string, number>): number {
  const totalW = kras.reduce((s, k) => s + Number(k.weight), 0);
  if (!totalW) return 0;
  return (kras.reduce((s, k) => s + (achievement(k, actuals[k.id]) ?? 0) * Number(k.weight), 0) / totalW) * 100;
}

export function band(score: number | null): Band {
  if (score === null || score === undefined) return "amber";
  if (score >= 90) return "green";
  if (score >= 70) return "amber";
  return "red";
}

export const BAND_LABEL: Record<Band, string> = { green: "On track", amber: "Watch", red: "At risk" };

/* ---------- Month & Week helpers ---------- */
function parseDateString(d: string) {
  const parts = d.split("-").map(Number);
  const y = parts[0] ?? 2026;
  const m = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  return new Date(Date.UTC(y, m - 1, day));
}

export function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function mondayOf(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return fmt(d);
}

export function addWeeks(ws: string, n: number) {
  const d = parseDateString(ws);
  d.setUTCDate(d.getUTCDate() + n * 7);
  return fmt(d);
}

export function monthOfWeek(ws: string): string {
  const d = parseDateString(ws);
  d.setUTCDate(d.getUTCDate() + 3);
  return fmt(d).slice(0, 7);
}

export function weekLabel(ws: string) {
  const s = parseDateString(ws);
  const e = parseDateString(ws);
  e.setUTCDate(e.getUTCDate() + 6);
  const o: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", timeZone: "UTC" };
  return `${s.toLocaleDateString("en-IN", o)} – ${e.toLocaleDateString("en-IN", o)}`;
}

export function monthLabel(m: string) {
  return parseDateString(m + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function krasFor(kras: Kra[], role: Role) {
  return kras.filter((k) => k.role === role).sort((a, b) => a.sort - b.sort);
}

export type PersonMonth = { staffId: string; month: number | null; weeks: { ws: string; score: number }[] };

export function personMonth(kras: Kra[], role: Role, entries: Entry[], staffId: string, month: string): PersonMonth {
  const ks = krasFor(kras, role);
  const weeks = entries
    .filter((e) => e.staff_id === staffId && monthOfWeek(e.week_start) === month)
    .sort((a, b) => a.week_start.localeCompare(b.week_start))
    .map((e) => ({ ws: e.week_start, score: weekScore(ks, e.actuals) }));
  const m = weeks.length ? weeks.reduce((s, w) => s + w.score, 0) / weeks.length : null;
  return { staffId, month: m, weeks };
}