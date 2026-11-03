import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Bootstrap } from "@/lib/kra.functions";
import { saveEntry } from "@/lib/kra.functions";
import { achievement, addWeeks, band, BAND_LABEL, krasFor, mondayOf, weekLabel, weekScore } from "@/lib/scoring";
import { BandBadge, bandSoft, ScoreBar } from "./BandBadge";
import { NumberTicker } from "./NumberTicker";
import { useRefresh, useSession } from "./session";
import { cn } from "@/lib/utils";

export function WeeklyEntry({ data }: { data: Bootstrap }) {
  const { token } = useSession();
  const refresh = useRefresh();
  const ks = krasFor(data.kras, data.me.role);
  const current = useMemo(() => mondayOf(new Date()), []);
  const weeks = [0, -1, -2, -3].map((n) => addWeeks(current, n));
  const [ws, setWs] = useState(current);
  const existing = data.entries.find((e) => e.week_start === ws);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const v: Record<string, string> = {};
    for (const k of ks) v[k.id] = existing?.actuals[k.id] !== undefined ? String(existing.actuals[k.id]) : "";
    setVals(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws, existing, data.kras]);

  const nums = Object.fromEntries(Object.entries(vals).filter(([, v]) => v !== "").map(([k, v]) => [k, Number(v)]));
  const score = weekScore(ks, nums);
  const b = band(score);
  const filled = ks.every((k) => vals[k.id] !== "" && vals[k.id] !== undefined);

  const save = async () => {
    setSaving(true);
    try {
      await saveEntry({ data: { token: token!, weekStart: ws, actuals: nums } });
      toast.success("Week saved");
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const history = [...data.entries].sort((a, b) => b.week_start.localeCompare(a.week_start));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-medium tracking-[-0.03em] text-foreground">This week's numbers</h2>
        <p className="text-sm text-muted-foreground">Monday–Sunday. You can update until the week is reviewed.</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {weeks.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => setWs(w)}
            className={cn(
              "min-h-11 shrink-0 rounded-full border px-4 text-xs font-semibold transition-all duration-200 ease-out active:scale-95",
              ws === w
                ? "bg-primary text-white border border-slate-200/80"
                : "border border-slate-200 bg-slate-100/80 text-slate-700 hover:bg-slate-200/80 hover:text-foreground",
            )}
          >
            {w === current ? "This week" : weekLabel(w)}
          </button>
        ))}
      </div>

      <motion.div layout className="sticky top-2 z-10 card-surface p-5 backdrop-blur bg-card/90">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Projected score</p>
            <p className="font-display text-3xl font-bold tracking-tight tabular mt-1">
              <NumberTicker value={Math.round(score)} />%
            </p>
          </div>
          <BandBadge score={score} className="scale-110 origin-right" />
        </div>
        <div className="mt-4"><ScoreBar score={score} /></div>
      </motion.div>

      <div className="space-y-3">
        {ks.map((k) => {
          const v = vals[k.id] ?? "";
          const a = v === "" ? null : achievement(k, Number(v)) * 100;
          const step = (d: number) => setVals((s) => ({ ...s, [k.id]: String(Math.max(0, (Number(s[k.id]) || 0) + d)) }));
          return (
            <div key={k.id} className="card-surface p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground leading-snug">{k.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Target: {k.direction === "lower_better" ? (Number(k.target) === 0 ? "0" : `≤ ${k.target}`) : k.target} {k.unit} • Weight: {k.weight}%
                    {k.direction === "lower_better" && " • (lower is better)"}
                  </p>
                </div>
                <BandBadge score={a} showLabel={false} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  onClick={() => step(-1)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-transform hover:bg-slate-200 active:scale-95"
                  aria-label="Decrease"
                >
                  <Minus className="h-4 w-4" />
                </motion.button>
                <input
                  inputMode="decimal"
                  value={v}
                  placeholder="0"
                  onChange={(e) => {
                    const t = e.target.value.replace(/[^\d.]/g, "");
                    setVals((s) => ({ ...s, [k.id]: t }));
                  }}
                  className="h-11 w-full min-w-0 rounded-full border border-slate-200/70 bg-white text-center font-display text-base font-semibold tabular shadow-[0_8px_30px_rgb(0,0,0,0.04)] outline-none transition-all duration-200 ease-out focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  onClick={() => step(1)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-transform hover:bg-slate-200 active:scale-95"
                  aria-label="Increase"
                >
                  <Plus className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          );
        })}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        type="button"
        disabled={!filled || saving}
        onClick={save}
        className="primary-action flex h-13 w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-medium shadow-sm transition-all active:scale-[0.98] disabled:opacity-40 active:scale-98 transition-all"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {existing ? "Update week" : "Submit week"}
      </motion.button>

      {history.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">My past weeks</p>
          <div className="card-surface divide-y divide-slate-100">
            {history.map((e) => (
              <div key={e.week_start} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="font-medium">{weekLabel(e.week_start)}</span>
                <BandBadge score={weekScore(ks, e.actuals)} showLabel={false} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
