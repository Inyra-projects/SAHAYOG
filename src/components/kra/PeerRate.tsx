import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { addRating, type Bootstrap } from "@/lib/kra.functions";
import { RATING_TAGS } from "@/lib/demo";
import { ROLE_LABEL } from "@/lib/scoring";
import { useRefresh, useSession } from "./session";
import { cn } from "@/lib/utils";

export function PeerRate({ data }: { data: Bootstrap }) {
  const { token } = useSession();
  const refresh = useRefresh();
  const peers = data.staff.filter((s) => s.id !== data.me.id && (s.role === "phlebo" || s.role === "frontdesk" || s.role === "manager"));
  const [to, setTo] = useState<string | null>(null);
  const [stars, setStars] = useState(0);
  const [tag, setTag] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const step = !to ? 1 : !stars ? 2 : 3;
  const name = (id: string) => data.staff.find((s) => s.id === id)?.name ?? "";

  const submit = async () => {
    setBusy(true);
    try {
      await addRating({ data: { token: token!, toId: to!, stars, tag: tag || undefined, comment: comment || undefined } });
      toast.success(`Thanks — rating sent for ${name(to!)}`);
      setTo(null); setStars(0); setTag(""); setComment("");
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-medium tracking-[-0.03em] text-foreground">Rate a coworker</h2>
        <p className="text-sm text-muted-foreground">Recognise anything — teamwork, patient care, help on a busy day. This doesn't affect KRA scores.</p>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3].map((n) => (
          <div key={n} className={cn("h-1 flex-1 rounded-full transition", step >= n ? "bg-primary" : "bg-muted")} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="card-surface divide-y divide-slate-100">
            {peers.map((p) => (
              <button key={p.id} type="button" onClick={() => setTo(p.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-muted">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent font-display text-sm font-semibold text-accent-foreground">
                  {p.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-snug whitespace-normal">{p.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{ROLE_LABEL[p.role]}</span>
                </span>
              </button>
            ))}
          </motion.div>
        )}
        {step >= 2 && to && (
          <motion.div key="s2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="card-surface space-y-5 p-5">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-semibold">{name(to)}</p>
              <button type="button" onClick={() => { setTo(null); setStars(0); }} className="text-xs font-semibold text-primary">Change</button>
            </div>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <motion.button key={n} type="button" whileTap={{ scale: 0.8 }} animate={{ scale: stars >= n ? 1.08 : 1 }} onClick={() => setStars(n)} aria-label={`${n} stars`}>
                  <Star className={cn("h-10 w-10", stars >= n ? "fill-star text-star" : "text-muted-foreground/30")} />
                </motion.button>
              ))}
            </div>
            {step === 3 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {RATING_TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTag(tag === t ? "" : t)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95",
                        tag === t
                          ? "bg-primary text-white border border-slate-200/80 shadow-sm"
                          : "border border-slate-200 bg-slate-100/80 text-slate-700 hover:bg-slate-200/80 hover:text-foreground"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <input
                  value={RATING_TAGS.includes(tag) ? "" : tag}
                  onChange={(e) => setTag(e.target.value.slice(0, 60))}
                  placeholder="Or your own label, e.g. helped on Bavdhan overflow"
                  className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 500))}
                  placeholder="Optional comment"
                  rows={3}
                  className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={submit}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-action px-6 py-3.5 text-sm font-medium text-action-foreground shadow-sm transition-all hover:bg-action/90 active:scale-[0.98] disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Send rating
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {data.ratings.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Ratings you've given</p>
          <div className="card-surface divide-y divide-slate-100">
            {data.ratings.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="min-w-0 truncate"><span className="font-semibold">{name(r.to_id)}</span>{r.tag && <span className="text-muted-foreground"> · {r.tag}</span>}</span>
                <span className="shrink-0 text-xs font-bold tabular">{r.stars}★</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
