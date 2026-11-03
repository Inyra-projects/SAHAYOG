import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CalendarDays, ClipboardList, LayoutGrid, Loader2, LogOut, Star, Target, Users, X, type LucideIcon } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useBootstrap, useSession } from "./session";
import { Dashboard } from "./Dashboard";
import { Evaluations } from "./Evaluations";
import { EditKras, ManageTeam } from "./AdminPanels";
import { WeeklyEntry } from "./WeeklyEntry";
import { PeerRate } from "./PeerRate";
import { Sheet, SheetContent, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DEMO_USERS } from "@/lib/demo";
import { ROLE_LABEL } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import { getProfilePhoto } from "@/lib/profilePhotos";
import { toast } from "sonner";
import { authenticateLocal, getDefaultRouteForRole, getStoredUser, PRD_USERS, setStoredUser } from "@/lib/auth";

export type Tab = "dash" | "team" | "kras" | "evaluations" | "entry" | "rate";

const AVATAR_COLORS = [
  "bg-emerald-600",
  "bg-blue-600",
  "bg-violet-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-teal-600",
  "bg-indigo-600",
  "bg-fuchsia-600",
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

type DockTab = { id: Tab; label: string; Icon: LucideIcon };

function DockNav({
  tabs,
  active,
  onTabClick,
  reduceMotion,
}: {
  tabs: DockTab[];
  active: Tab;
  onTabClick: (id: Tab) => void;
  reduceMotion: boolean | null;
}) {
  const pillSpring = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 380, damping: 30, mass: 0.8 };
  const labelSpring = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 400, damping: 32 };
  const compact = tabs.length === 2;

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed bottom-6 left-1/2 z-50 isolate flex -translate-x-1/2 items-center overflow-hidden rounded-full border border-white/80 bg-white/55 p-2 shadow-[0_20px_48px_-14px_rgba(15,23,42,0.28),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(148,163,184,0.18)] backdrop-blur-3xl backdrop-saturate-150",
        compact
          ? "w-3/4 max-w-xs justify-center gap-1"
          : "w-[min(92%,24rem)] justify-between",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-gradient-to-br from-white/85 via-white/35 to-slate-200/20"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-8 -top-10 -z-10 h-24 w-36 rounded-full bg-white/80 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 right-2 -z-10 h-24 w-32 rounded-full bg-sky-100/45 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-px -z-10 rounded-[inherit] ring-1 ring-inset ring-white/70"
      />
      {tabs.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <motion.button
            key={id}
            type="button"
            layout
            onClick={() => onTabClick(id)}
            aria-current={isActive ? "page" : undefined}
            whileTap={{ scale: 0.92 }}
            transition={pillSpring}
            className={cn(
              "relative z-10 flex cursor-pointer select-none items-center justify-center rounded-full py-3 transition-colors duration-200",
              compact && "flex-1",
              isActive ? "px-4 text-white" : "px-3 text-slate-400 hover:bg-slate-100/50 hover:text-slate-700 active:scale-95",
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeNavIndicator"
                aria-hidden
                transition={pillSpring}
                className="absolute inset-0 -z-10 rounded-full bg-slate-950/90 shadow-[0_8px_20px_-8px_rgba(15,23,42,0.75),inset_0_1px_0_rgba(255,255,255,0.14)] ring-1 ring-white/10 backdrop-blur-xl"
              />
            )}
            <motion.span
              className="relative z-10 flex shrink-0"
              animate={{ color: isActive ? "#ffffff" : "#94a3b8" }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
            >
              <Icon className="size-4" strokeWidth={isActive ? 2.25 : 1.75} />
            </motion.span>
            <AnimatePresence initial={false}>
              {isActive && (
                <motion.span
                  initial={{ opacity: 0, width: 0, scale: 0.9 }}
                  animate={{ opacity: 1, width: "auto", scale: 1 }}
                  exit={{ opacity: 0, width: 0, scale: 0.9 }}
                  transition={labelSpring}
                  className="relative z-10 overflow-hidden whitespace-nowrap pl-1.5 text-xs font-medium tracking-tight text-white"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </nav>
  );
}

export function AppShell({ initialTab }: { initialTab?: string }) {
  const { signOut, signIn } = useSession();
  const navigate = useNavigate();
  const q = useBootstrap();

  const storedUser = getStoredUser();
  const storedIsLead = storedUser?.role === "admin" || storedUser?.role === "manager";

  // Initial tab based on role and incoming prop
  const getInitialTab = (): Tab => {
    if (storedIsLead) {
      if (initialTab === "team" || initialTab === "employees") return "team";
      if (initialTab === "kras") return "kras";
      if (initialTab === "entry" || initialTab === "evaluations") return "evaluations";
      return "dash";
    } else {
      if (initialTab === "rate") return "rate";
      return "entry";
    }
  };

  const [tab, setTab] = useState<Tab>(getInitialTab);
  const [targetStaffId, setTargetStaffId] = useState<string | undefined>();
  const [switchOpen, setSwitchOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const currentRole = q.data?.me?.role || storedUser?.role;
  const isLead = currentRole === "admin" || currentRole === "manager";

  // Enforce access control unconditionally before any early returns (Rules of Hooks)
  useEffect(() => {
    if (!currentRole) return;
    if (!isLead && (tab === "dash" || tab === "team" || tab === "kras" || tab === "evaluations")) {
      setTab("entry");
    } else if (isLead && (tab === "entry" || tab === "rate")) {
      setTab(initialTab === "entry" ? "evaluations" : "dash");
    }
  }, [isLead, currentRole, initialTab]);

  if (q.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (q.error || !q.data) {
    return (
      <div className="mx-auto grid min-h-screen max-w-md place-items-center px-6 text-center">
        <div>
          <p className="font-display text-lg font-semibold">Please sign in again</p>
          <p className="mt-1 text-sm text-muted-foreground">{(q.error as Error)?.message || "Session ended"}</p>
          <button
            type="button"
            onClick={() => {
              signOut();
              navigate({ to: "/login" as any }).catch(() => {
                window.location.href = "/login";
              });
            }}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  const d = q.data;
  const role = d.me.role;
  const isAdmin = role === "admin";
  const isManager = role === "manager";

  // Admin tabs (4 primary management tabs - PRD Section 7)
  const adminTabs: { id: Tab; label: string; Icon: typeof Users }[] = [
    { id: "dash", label: "Dashboard", Icon: LayoutGrid },
    { id: "team", label: "Team", Icon: Users },
    { id: "kras", label: "KRA Setup", Icon: Target },
    { id: "evaluations", label: "Evaluations", Icon: ClipboardList },
  ];

  // Center Manager tabs (3 tabs: Dashboard, Employees/Team Center view, Evaluations - PRD Section 7)
  const managerTabs: { id: Tab; label: string; Icon: typeof Users }[] = [
    { id: "dash", label: "Dashboard", Icon: LayoutGrid },
    { id: "team", label: "Team", Icon: Users },
    { id: "evaluations", label: "Evaluations", Icon: ClipboardList },
  ];

  // Staff tabs (2 tabs: My Performance & Rate Peers - PRD Section 7)
  const staffTabs: { id: Tab; label: string; Icon: typeof Users }[] = [
    { id: "entry", label: "My Performance", Icon: CalendarDays },
    { id: "rate", label: "Rate Peers", Icon: Star },
  ];

  const tabs = isAdmin ? adminTabs : isManager ? managerTabs : staffTabs;

  const active = tab;

  const tabToRoute: Record<Tab, string> = {
    dash: "/dashboard",
    team: "/team",
    kras: "/kras",
    evaluations: "/entry",
    entry: "/entry",
    rate: "/rate",
  };

  const handleTabClick = (id: Tab) => {
    setTargetStaffId(undefined);
    setTab(id);
    const dest = tabToRoute[id];
    if (dest && typeof window !== "undefined" && window.location.pathname !== dest) {
      window.history.replaceState(null, "", dest);
    }
  };

  const handleOpenEvaluationFromDashboard = (staffId: string) => {
    setTargetStaffId(staffId);
    setTab("evaluations");
    if (typeof window !== "undefined" && window.location.pathname !== "/entry") {
      window.history.replaceState(null, "", "/entry");
    }
  };

  const quick = (phone: string, pin: string) => {
    setSwitchOpen(false);
    const res = authenticateLocal(phone, pin);
    if (!res.ok || !res.user) {
      toast.error("Phone or PIN is incorrect");
      return;
    }
    setStoredUser(res.user);
    const dest = getDefaultRouteForRole(res.user.role);
    window.location.href = dest;
  };

  const handleSignOut = () => {
    signOut();
    navigate({ to: "/login" as any }).catch(() => {
      window.location.href = "/login";
    });
  };

  return (
    <div className="relative mx-auto min-h-screen max-w-md bg-background pb-36">
      {/* Sticky Glassmorphic Header with profile and logout */}
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/70 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 rounded-2xl shadow-xs ring-2 ring-white">
                <AvatarImage
                  src={getProfilePhoto(d.me.id)}
                  alt={`${d.me.name} profile`}
                  className="object-cover"
                />
                <AvatarFallback
                  className={cn(
                    "rounded-2xl font-display text-sm font-bold text-white",
                    getAvatarColor(d.me.name),
                  )}
                >
                  {d.me.name.replace("Dr. ", "").split(" ").map((x) => x[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-sm font-medium tracking-[-0.03em] text-foreground whitespace-normal leading-snug">{d.me.name}</p>
              <p className="mt-0.5 text-[11px] font-normal leading-relaxed text-slate-500">
                {role === "admin" ? "Admin" : ROLE_LABEL[role]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleSignOut}
              className="grid size-11 place-items-center rounded-full border border-white/70 bg-white text-rose-600 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-200 ease-out hover:bg-rose-50 active:scale-95 cursor-pointer"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4 text-rose-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Screen Content */}
      <main className="px-4 pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={active + d.me.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {isLead ? (
              <>
                {active === "dash" && (
                  <Dashboard
                    data={d}
                    onOpenEvaluation={handleOpenEvaluationFromDashboard}
                    onOpenSwitch={() => setSwitchOpen(true)}
                    onSignOut={handleSignOut}
                  />
                )}
                {active === "team" && <ManageTeam data={d} />}
                {active === "kras" && <EditKras data={d} />}
                {active === "evaluations" && (
                  <Evaluations data={d} initialStaffId={targetStaffId} />
                )}
              </>
            ) : (
              <>
                {active === "entry" && (
                  <Evaluations
                    data={d}
                    onSwitchToRate={() => setTab("rate")}
                  />
                )}
                {active === "rate" && <PeerRate data={d} />}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <div
        aria-hidden
        className="pointer-events-none fixed bottom-6 left-1/2 z-40 h-12 w-full max-w-md -translate-x-1/2"
      >
        <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-background/40 to-transparent backdrop-blur-md [mask-image:linear-gradient(to_top,black,transparent)] [-webkit-mask-image:linear-gradient(to_top,black,transparent)]" />
      </div>
      <DockNav tabs={tabs} active={active} onTabClick={handleTabClick} reduceMotion={reduceMotion} />

      {/* Demo Switcher Bottom Sheet Popup */}
      <Sheet open={switchOpen} onOpenChange={setSwitchOpen}>
        <SheetContent
          side="bottom"
          hideClose
          className="mx-auto max-w-lg rounded-t-3xl border border-white/70 bg-white px-5 pt-3 pb-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] focus:outline-none"
        >
          {/* Native-feel sheet drag bar */}
          <div className="mx-auto -mt-1 mb-3.5 h-1 w-12 rounded-full bg-slate-300/80" />

          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <SheetTitle className="text-base font-bold text-foreground">Quick switch demo user</SheetTitle>
              <SheetClose className="p-1 rounded-lg opacity-70 hover:opacity-100 transition cursor-pointer border-0 outline-none focus:outline-none text-slate-500 hover:text-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </SheetClose>
            </div>

            <div className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto px-1 py-1">
              {DEMO_USERS.map((u) => {
                const profile = PRD_USERS.find((user) => user.phone === u.phone);
                return (
                  <button
                    key={u.phone}
                    type="button"
                    onClick={() => {
                      setSwitchOpen(false);
                      quick(u.phone, u.pin);
                    }}
                    className="flex w-full items-center justify-between py-3 text-left hover:bg-slate-50 px-2 rounded-xl transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={profile ? getProfilePhoto(profile.id) : undefined}
                          alt=""
                          className="object-cover"
                        />
                        <AvatarFallback
                          className={cn(
                            "text-xs font-semibold text-white",
                            getAvatarColor(u.name),
                          )}
                        >
                          {u.name.replace("Dr. ", "").split(" ").map((x) => x[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-sm font-semibold block">{u.name}</span>
                        <span className="text-[11px] text-muted-foreground">{u.label} · PIN: {u.pin}</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {u.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
