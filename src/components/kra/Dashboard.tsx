import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowDown,
  ArrowDownLeft,
  ArrowUp,
  ArrowUpRight,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  FileEdit,
  Lock,
  LogOut,
  Plus,
  Send,
  Star,
  Users,
} from "lucide-react";
import type { Bootstrap } from "@/lib/kra.functions";
import {
  band,
  DEFAULT_EVALUATION_MONTH,
  EVALUATION_MONTHS,
  krasFor,
  ROLE_LABEL,
  type EvaluationStatus,
  type MonthlyEvaluation,
  type Role,
} from "@/lib/scoring";
import { CENTER_NAME } from "@/lib/demo";
import { BandBadge, bandSoft, EvaluationStatusPill, ScoreBar, StatusBadge, StatusDotText } from "./BandBadge";
import { CenterScoreGauge } from "./CenterScoreGauge";
import { NumberTicker } from "./NumberTicker";
import { cn } from "@/lib/utils";
import { getAvatarColor } from "./AppShell";

const MONTHS_2026 = [
  { id: "2026-01", label: "Jan 2026", full: "January 2026" },
  { id: "2026-02", label: "Feb 2026", full: "February 2026" },
  { id: "2026-03", label: "Mar 2026", full: "March 2026" },
  { id: "2026-04", label: "Apr 2026", full: "April 2026" },
  { id: "2026-05", label: "May 2026", full: "May 2026" },
  { id: "2026-06", label: "Jun 2026", full: "June 2026" },
  { id: "2026-07", label: "Jul 2026", full: "July 2026" },
  { id: "2026-08", label: "Aug 2026", full: "August 2026" },
  { id: "2026-09", label: "Sep 2026", full: "September 2026" },
  { id: "2026-10", label: "Oct 2026", full: "October 2026" },
  { id: "2026-11", label: "Nov 2026", full: "November 2026" },
  { id: "2026-12", label: "Dec 2026", full: "December 2026" },
];

function monthShortLabel(id: string) {
  return MONTHS_2026.find((m) => m.id === id)?.label ?? "Oct 2026";
}

type Filter = "all" | "phlebo" | "frontdesk";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All Staff" },
  { id: "phlebo", label: "Home Phlebotomy" },
  { id: "frontdesk", label: "Front Desk" },
];

export function Dashboard({
  data,
  onOpenEvaluation,
  onOpenSwitch,
  onSignOut,
}: {
  data: Bootstrap;
  onOpenEvaluation?: (staffId: string) => void;
  onOpenSwitch?: () => void;
  onSignOut?: () => void;
}) {
  const [month, setMonth] = useState<string>(DEFAULT_EVALUATION_MONTH);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [tempMonth, setTempMonth] = useState<string>(DEFAULT_EVALUATION_MONTH);
  const rotatorRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [tab, setTab] = useState<"rollup" | "peer" | "logins">("rollup");

  useEffect(() => {
    if (monthPickerOpen) {
      setTempMonth(month);
      const timer = setTimeout(() => {
        const container = rotatorRef.current;
        if (!container) return;
        const target = container.querySelector<HTMLElement>(`[data-month-id="${month}"]`);
        if (target) {
          const containerHeight = container.clientHeight;
          const targetTop = target.offsetTop;
          const targetHeight = target.offsetHeight;
          container.scrollTop = targetTop - containerHeight / 2 + targetHeight / 2;
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [monthPickerOpen, month]);

  const handleScroll = () => {
    const container = rotatorRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const centerY = containerRect.top + containerRect.height / 2;

    let closestId: string | null = null;
    let minDiff = Infinity;

    const items = container.querySelectorAll<HTMLElement>("[data-month-id]");
    items.forEach((item) => {
      const itemRect = item.getBoundingClientRect();
      const itemCenter = itemRect.top + itemRect.height / 2;
      const diff = Math.abs(centerY - itemCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestId = item.getAttribute("data-month-id");
      }
    });

    if (closestId && closestId !== tempMonth) {
      setTempMonth(closestId);
    }
  };

  // In-scope active staff (Phlebotomists and Front Desk)
  const people = useMemo(() => {
    return data.staff.filter((s) => s.active && (s.role === "phlebo" || s.role === "frontdesk"));
  }, [data.staff]);

  // Month evaluations map
  const evalsMap = useMemo(() => {
    const map = new Map<string, MonthlyEvaluation>();
    for (const e of data.evaluations) {
      if (e.month === month) {
        map.set(e.employee_id, e);
      }
    }
    return map;
  }, [data.evaluations, month]);

  // Completion metrics
  const completionStats = useMemo(() => {
    let finalized = 0;
    let reviewed = 0;
    let submitted = 0;
    let inProgress = 0;
    let notStarted = 0;
    let totalScoreSum = 0;
    let scoredCount = 0;

    for (const p of people) {
      const ev = evalsMap.get(p.id);
      const st: EvaluationStatus = ev?.status || "Not started";
      if (st === "Locked/Finalized") finalized++;
      else if (st === "Reviewed") reviewed++;
      else if (st === "Submitted for review") submitted++;
      else if (st === "In progress") inProgress++;
      else notStarted++;

      if (ev && ev.score !== null && ev.score !== undefined) {
        totalScoreSum += ev.score;
        scoredCount++;
      }
    }

    const centerScore = scoredCount > 0 ? Math.round(totalScoreSum / scoredCount) : null;
    return {
      total: people.length,
      finalized,
      reviewed,
      submitted,
      inProgress,
      notStarted,
      completed: finalized + reviewed,
      centerScore,
    };
  }, [people, evalsMap]);

  // Filtered rows for display
  const shown = useMemo(() => {
    return people
      .filter((p) => filter === "all" || p.role === filter)
      .map((p) => {
        const ev = evalsMap.get(p.id);
        return { p, ev };
      })
      .sort((a, b) => (b.ev?.score ?? -1) - (a.ev?.score ?? -1));
  }, [people, filter, evalsMap]);

  const onTrackCount = shown.filter((r) => r.ev?.score !== null && r.ev?.score !== undefined && r.ev.score >= 90).length;

  return (
    <div className="space-y-4">
      {/* Top Hero Section - Matched EXACTLY to Reference Image Structure with Purple Theme */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 26 }}
        className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/55 p-5 text-foreground shadow-[0_18px_48px_-18px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/[0.04] backdrop-blur-2xl backdrop-saturate-150 sm:p-6"
      >
        {/* 1. TOP BAR (Uncontained Center Name with 5s Pulsating Green Dot + Date Picker Trigger Button) */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 select-none sm:text-sm">
            <span className="relative flex h-2 w-2 shrink-0">
              <motion.span
                animate={{ scale: [1, 2.6, 1], opacity: [0.85, 0, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3.5, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-emerald-400"
              />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            </span>
            <span className="tracking-wide">{CENTER_NAME}</span>
          </div>

          <button
            type="button"
            onClick={() => setMonthPickerOpen(true)}
            className="relative grid size-11 shrink-0 place-items-center rounded-full border border-white/80 bg-white/55 text-slate-800 shadow-[0_8px_24px_rgb(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-black/[0.04] backdrop-blur-md transition-all duration-200 ease-out active:scale-95 cursor-pointer hover:bg-white/75"
            aria-label={`Select evaluation month, ${monthShortLabel(month)}`}
          >
            <Calendar className="size-4 text-slate-500" />
          </button>
        </div>

        <div className="relative z-10 mt-2 text-center">
          <CenterScoreGauge score={completionStats.centerScore} />

          {/* 4 Cards Inside Main Card Right Below the gauge */}
          <div className="relative mt-5 flex items-stretch gap-1">
            {(
              [
                { label: "Staffs", value: completionStats.total },
                { label: "Reviewed", value: completionStats.completed, of: completionStats.total },
                { label: "In Review", value: completionStats.submitted + completionStats.inProgress },
                { label: "Pending", value: completionStats.notStarted },
              ] as const
            ).map((item, index) => (
              <div key={item.label} className="relative flex min-w-0 flex-1 items-stretch">
                {index > 0 && (
                  <span className="absolute left-0 top-1/2 z-10 size-2 -translate-x-[calc(50%+0.125rem)] -translate-y-1/2 rounded-full bg-[#98e800] shadow-[0_0_0_2px_rgba(152,232,0,0.18),0_0_10px_3px_rgba(152,232,0,0.5)]" />
                )}
                <div className="flex min-w-0 flex-1 flex-col justify-center rounded-md bg-white px-3 py-2.5 text-left shadow-[0_10px_24px_-10px_rgba(20,30,40,0.16),0_2px_6px_rgba(20,30,40,0.05)]">
                  <p className="font-sans text-[22px] font-bold leading-none tracking-[-0.04em] text-[#0A2214] tabular-nums">
                    {item.value}
                    {"of" in item && (
                      <span className="ml-0.5 text-[11px] font-medium text-[#8b9398]">/ {item.of}</span>
                    )}
                  </p>
                  <p className="mt-1 text-[10px] font-medium leading-tight text-[#7d868c]">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. SEGMENTED TOGGLES (Scores, Peers, Logins) */}
        <div className="relative z-10 mt-5 flex items-center justify-between gap-1.5 rounded-full border border-slate-200/60 bg-[#f4f3f7] p-1">
          {([
            ["rollup", "Scores", BarChart3],
            ["peer", "Peers", Star],
            ["logins", "Logins", Activity],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all duration-200 ease-out select-none active:scale-95",
                tab === id
                  ? "bg-[#0A2214]/14 font-semibold text-[#0A2214] ring-1 ring-[#0A2214]/22 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
                  : "text-slate-500 hover:bg-white/80 hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-3.5 w-3.5",
                  tab === id ? "text-[#0A2214]" : "text-slate-400"
                )}
              />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </motion.section>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab + month}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.18 }}
        >
          {tab === "rollup" && (
            <div className="space-y-3">
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-medium tracking-[-0.03em] text-foreground">Team scorecards</h2>
                  <p className="mt-1 text-xs font-normal leading-relaxed text-slate-500">
                    Tap a person for KPI drill-down & evaluation
                  </p>
                </div>
              </div>

              {/* Role Filters */}
              <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 py-1 hide-scrollbar">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={cn(
                      "inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full px-3 text-xs font-medium transition-all duration-200 ease-out active:scale-95",
                      filter === f.id
                        ? "bg-primary/10 text-primary ring-1 ring-primary/25"
                        : "bg-white text-slate-600 ring-1 ring-slate-200/80 hover:bg-slate-50 hover:text-foreground"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Staff Cards */}
              {shown.map(({ p, ev }, i) => (
                <PersonMonthlyCard
                  key={p.id}
                  i={i}
                  person={p}
                  evaluation={ev}
                  data={data}
                  month={month}
                  onOpenEvaluation={onOpenEvaluation}
                />
              ))}

              {!shown.length && (
                <p className="py-8 text-center text-sm text-muted-foreground">No staff in this group.</p>
              )}
            </div>
          )}

          {tab === "peer" && <PeerSignals data={data} />}
          {tab === "logins" && <Logins data={data} />}
        </motion.div>
      </AnimatePresence>

      {/* Date Picker Center White Card Popup Modal with Glassmorphism Blur Backdrop */}
      <AnimatePresence>
        {monthPickerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMonthPickerOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex w-[calc(100%-32px)] max-w-[320px] select-none flex-col items-center overflow-hidden rounded-3xl border border-white/70 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
            >
              {/* Header */}
              <div className="text-center w-full mb-1">
                <h3 className="font-display text-base font-bold text-foreground tracking-tight">
                  Select Evaluation Month
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Year 2026
                </p>
              </div>

              {/* Vertical Scroll Rotator with Fade Out Top & Bottom */}
              <div className="relative w-full h-52 my-3 overflow-hidden flex items-center justify-center">
                {/* Selection Highlight Track in Center */}
                <div className="pointer-events-none absolute inset-x-2 top-1/2 z-0 h-11 -translate-y-1/2 rounded-2xl border border-slate-200/80 bg-slate-100" />

                {/* Top Gradient Fade Out */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white via-white/85 to-transparent z-10" />

                {/* Bottom Gradient Fade Out */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/85 to-transparent z-10" />

                {/* Scrollable List - Auto selects month on scroll without click interaction */}
                <div
                  ref={rotatorRef}
                  onScroll={handleScroll}
                  className="h-full w-full overflow-y-auto hide-scrollbar py-[84px] snap-y snap-mandatory relative z-0 text-center"
                >
                  {MONTHS_2026.map((m) => {
                    const isSelected = tempMonth === m.id;
                    return (
                      <div
                        key={m.id}
                        data-month-id={m.id}
                        className={cn(
                          "h-10 w-full flex items-center justify-center snap-center transition-all duration-150 select-none",
                          isSelected
                            ? "scale-105 font-display text-base font-semibold text-foreground"
                            : "text-slate-400 font-medium text-sm"
                        )}
                      >
                        {m.full}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Done Text Button at Center Bottom of Card */}
              <div className="mt-2 w-full flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setMonth(tempMonth);
                    setMonthPickerOpen(false);
                  }}
                  className="w-full max-w-[200px] cursor-pointer rounded-full bg-action py-3 text-center font-display text-sm font-semibold text-action-foreground shadow-[0_8px_24px_rgb(0,0,0,0.16)] transition-all duration-200 ease-out hover:bg-action/90 active:scale-95"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PersonMonthlyCard({
  i,
  person,
  evaluation,
  data,
  month,
  onOpenEvaluation,
}: {
  i: number;
  person: { id: string; name: string; role: Role; center: string };
  evaluation?: MonthlyEvaluation | undefined;
  data: Bootstrap;
  month: string;
  onOpenEvaluation?: ((staffId: string) => void) | undefined;
}) {
  const [open, setOpen] = useState(false);
  const ks = krasFor(data.kras, person.role);
  const status: EvaluationStatus = evaluation?.status || "Not started";
  const score = evaluation?.score ?? null;

  const ratings = data.ratings.filter((r) => r.to_id === person.id);
  const avgRating = ratings.length ? ratings.reduce((s, r) => s + r.stars, 0) / ratings.length : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, scale: 1.008 }}
      transition={{ delay: i * 0.045, type: "spring", stiffness: 350, damping: 26 }}
      className="card-surface group relative overflow-hidden"
    >
      {/* Specular Ambient Glass Highlight on Top Edge */}
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent pointer-events-none group-hover:via-white transition-colors" />
      <button type="button" onClick={() => setOpen(!open)} className="w-full px-4 py-3.5 text-left">
        <div className="flex items-start gap-3.5">
          <span
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-2xl font-display text-sm font-semibold text-white shadow-sm mt-0.5",
              getAvatarColor(person.name)
            )}
          >
            {person.name.replace("Dr. ", "").split(" ").map((x) => x[0]).join("").slice(0, 2)}
          </span>

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm text-foreground whitespace-normal leading-snug">
                {person.name}
              </h3>
              <StatusDotText status={status} />
            </div>

            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground leading-normal flex-wrap">
              <span className="whitespace-normal leading-snug">{ROLE_LABEL[person.role]}</span>
              {avgRating !== null && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {avgRating.toFixed(1)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Chevron dropdown icon top-aligned */}
          <div className="flex size-7 shrink-0 items-center justify-center text-slate-300">
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                open ? "rotate-180" : "-rotate-90"
              )}
            />
          </div>
        </div>

        {score !== null ? (
          <div className="mt-3 flex flex-col gap-1.5">
            <div className="flex justify-end text-xs font-bold text-slate-800 tabular">
              <span>{Math.min(100, Math.round(score))}%</span>
            </div>
            <ScoreBar score={Math.min(100, score)} />
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-1.5">
            <div className="flex justify-end text-xs font-semibold text-slate-400 tabular">
              <span>Pending</span>
            </div>
            <ScoreBar score={null} />
          </div>
        )}
      </button>

      {/* Accordion Drill-down with KPI breakdown */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-border/60 bg-surface/50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-slate-400">
                  KPI Breakdown
                </p>
                {onOpenEvaluation && (
                  <button
                    type="button"
                    onClick={() => onOpenEvaluation(person.id)}
                    className="text-xs font-semibold text-foreground underline-offset-2 hover:underline"
                  >
                    Open Evaluation →
                  </button>
                )}
              </div>

              <div className="space-y-2 rounded-2xl bg-card p-3">
                {ks.map((k) => {
                  const snap = evaluation?.kpi_results[k.id];
                  const actual = snap?.actual ?? null;
                  const ach = snap?.achievement ?? null;
                  const snapTarget = snap?.target ?? k.target;
                  const snapUnit = snap?.unit ?? k.unit;

                  return (
                    <div key={k.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-sm py-1">
                      <div className="min-w-0">
                        <p className="font-medium text-xs leading-snug text-slate-800 whitespace-normal">{k.name}</p>
                        <p className="text-[11px] text-muted-foreground tabular">
                          {actual !== null ? actual : "No data"} / target{" "}
                          {k.direction === "lower_better" ? (Number(snapTarget) === 0 ? "0" : `≤ ${snapTarget}`) : snapTarget}{" "}
                          {snapUnit} · weight {k.weight}%
                        </p>
                      </div>
                      <BandBadge score={ach} fallbackLabel="Pending" showLabel={false} />
                    </div>
                  );
                })}

                <div className="flex justify-between border-t border-border/60 pt-2 text-sm font-semibold">
                  <span className="text-xs text-slate-600">Monthly score</span>
                  <span className="tabular text-xs font-bold text-foreground">
                    {score !== null ? `${Math.min(100, Math.round(score))}%` : "Pending"}
                  </span>
                </div>
              </div>

              {evaluation?.feedback && (
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3 text-xs text-slate-700">
                  <p className="mb-0.5 font-semibold text-foreground">Manager Feedback:</p>
                  <p className="italic">“{evaluation.feedback}”</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn("h-3.5 w-3.5", i <= Math.round(n) ? "fill-star text-star" : "text-muted-foreground/30")}
        />
      ))}
    </span>
  );
}

function PeerSignals({ data }: { data: Bootstrap }) {
  const name = (id: string) => data.staff.find((s) => s.id === id)?.name ?? "Former staff";
  const people = data.staff.filter((s) => s.role === "phlebo" || s.role === "frontdesk");
  return (
    <div className="space-y-4">
      <p className="rounded-2xl bg-accent px-4 py-3 text-xs font-medium text-accent-foreground">
        Peer ratings are a separate signal. They never change anyone's KRA score.
      </p>
      <div className="card-surface divide-y divide-slate-100">
        {people.map((p) => {
          const rs = data.ratings.filter((r) => r.to_id === p.id);
          const avg = rs.length ? rs.reduce((s, r) => s + r.stars, 0) / rs.length : 0;
          return (
            <div key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
              <p className="text-sm font-semibold leading-snug whitespace-normal">{p.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground tabular">
                {rs.length ? (
                  <>
                    <Stars n={avg} /> {avg.toFixed(1)} · {rs.length}
                  </>
                ) : (
                  "No ratings"
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Recent ratings</p>
      <div className="space-y-2">
        {data.ratings.map((r) => (
          <div key={r.id} className="card-surface p-3.5 text-sm">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <p className="truncate">
                <span className="font-semibold">{name(r.to_id)}</span>{" "}
                <span className="text-muted-foreground">from {name(r.from_id)}</span>
              </p>
              <Stars n={r.stars} />
            </div>
            {r.tag && <span className="mt-2 inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">{r.tag}</span>}
            {r.comment && <p className="mt-1.5 text-muted-foreground">“{r.comment}”</p>}
          </div>
        ))}
        {!data.ratings.length && <p className="text-sm text-muted-foreground">No ratings yet.</p>}
      </div>
    </div>
  );
}

function Logins({ data }: { data: Bootstrap }) {
  const people = data.staff.filter((s) => s.active && (s.role === "phlebo" || s.role === "frontdesk"));
  return (
    <div className="card-surface divide-y divide-slate-100">
      {people.map((p) => {
        const l = data.logins.find((x) => x.staff_id === p.id);
        return (
          <div key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug whitespace-normal">{p.name}</p>
              <p className="text-xs leading-normal text-muted-foreground">
                Last login:{" "}
                {l?.last
                  ? new Date(l.last).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "Never"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-lg font-bold tracking-tight tabular">
                <NumberTicker value={l?.days7 ?? 0} />
                <span className="text-xs font-semibold text-muted-foreground">/7</span>
              </p>
              <p className="text-[11px] font-medium text-muted-foreground">days active</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
