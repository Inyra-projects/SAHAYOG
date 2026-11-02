import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { band, BAND_LABEL, type Band, type EvaluationStatus } from "@/lib/scoring";
import { CheckCircle2, Clock, FileEdit, Lock, Send } from "lucide-react";

export const bandText: Record<Band, string> = {
  green: "text-emerald-700",
  amber: "text-amber-700",
  red: "text-rose-700",
};

export const bandSoft: Record<Band, string> = {
  green: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-800 border border-amber-500/20",
  red: "bg-rose-500/10 text-rose-700 border border-rose-500/20",
};

export const bandBar: Record<Band, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-rose-500",
};

export function BandBadge({
  score,
  className,
  showLabel = true,
  fallbackLabel = "Pending",
}: {
  score: number | null | undefined;
  className?: string;
  showLabel?: boolean;
  fallbackLabel?: string;
}) {
  if (score === null || score === undefined) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 border border-slate-200", className)}>
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        {fallbackLabel}
      </span>
    );
  }
  const b = band(score);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tabular", bandSoft[b], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", bandBar[b])} />
      {Math.min(100, Math.round(score))}%{showLabel && <span className="font-semibold opacity-80">· {BAND_LABEL[b]}</span>}
    </span>
  );
}

export function ScoreBar({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) {
    return <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100" />;
  }
  const b = band(score);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <motion.div
        className={cn("h-full rounded-full", bandBar[b])}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(score, 100)}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
    </div>
  );
}

export function StatusBadge({
  status,
  className,
  compact = true,
}: {
  status: EvaluationStatus;
  className?: string;
  compact?: boolean;
}) {
  switch (status) {
    case "Locked/Finalized":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/80",
            className
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {compact ? "Locked" : "Locked / Finalized"}
        </span>
      );
    case "Reviewed":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-800 border border-indigo-100",
            className
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          Reviewed
        </span>
      );
    case "Submitted for review":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200/80",
            className
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          {compact ? "In Review" : "Submitted for review"}
        </span>
      );
    case "In progress":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200/80",
            className
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          {compact ? "Draft" : "In progress"}
        </span>
      );
    case "Not started":
    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200/80",
            className
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          {compact ? "Not Started" : "Not started"}
        </span>
      );
  }
}

export function EvaluationStatusPill({
  status,
  className,
}: {
  status: EvaluationStatus;
  className?: string;
}) {
  switch (status) {
    case "Locked/Finalized":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-500/25 shrink-0 shadow-sm",
            className
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Finalized
        </span>
      );
    case "Reviewed":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-800 border border-indigo-100 shrink-0",
            className
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          Reviewed
        </span>
      );
    case "Submitted for review":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-500/25 shrink-0 shadow-sm",
            className
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          In Review
        </span>
      );
    case "In progress":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-500/25 shrink-0 shadow-sm",
            className
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          In Progress
        </span>
      );
    case "Not started":
    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 border border-slate-200 shrink-0",
            className
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          Pending
        </span>
      );
  }
}

export function StatusDotText({
  status,
  className,
}: {
  status: EvaluationStatus;
  className?: string;
}) {
  switch (status) {
    case "Locked/Finalized":
      return (
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700", className)}>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          Finalized
        </span>
      );
    case "Reviewed":
      return (
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-indigo-800", className)}>
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
          Reviewed
        </span>
      );
    case "Submitted for review":
      return (
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-amber-700", className)}>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          In Review
        </span>
      );
    case "In progress":
      return (
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-blue-700", className)}>
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
          Draft
        </span>
      );
    case "Not started":
    default:
      return (
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-slate-500", className)}>
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
          Pending
        </span>
      );
  }
}