import { useState, useMemo } from "react";
import { ChevronDown, Loader2, Lock, Pencil, Plus, RotateCcw, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  deleteKra,
  upsertKra,
  upsertStaff,
  type Bootstrap,
  type StaffRow,
} from "@/lib/kra.functions";
import { krasFor, ROLE_LABEL, type Kra, type Role } from "@/lib/scoring";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useRefresh, useSession } from "./session";
import { cn } from "@/lib/utils";
import { getAvatarColor } from "./AppShell";

const field = "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20";
const label = "text-xs font-semibold text-muted-foreground block mb-1.5";

function StaffRowCard({
  s,
  isLead,
  canEdit = true,
  onEdit,
}: {
  s: StaffRow;
  isLead: boolean;
  canEdit?: boolean;
  onEdit: (s: StaffRow) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 transition-colors last:border-b-0 hover:bg-slate-50/70">
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-sm font-semibold text-white shadow-xs",
            getAvatarColor(s.name)
          )}
        >
          {s.name.replace("Dr. ", "").split(" ").map((x) => x[0]).join("").slice(0, 2)}
        </span>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn("text-sm font-semibold text-foreground leading-snug whitespace-normal", !s.active && "text-slate-400 line-through")}>
              {s.name}
            </p>
            {!s.active && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                Inactive
              </span>
            )}
          </div>
          {/* Subtext: JUST the role */}
          <p className="text-xs leading-snug text-muted-foreground mt-0.5 whitespace-normal">{ROLE_LABEL[s.role]}</p>
        </div>
      </div>

      {isLead && canEdit && (
        <button
          type="button"
          onClick={() => onEdit(s)}
          className="grid size-11 shrink-0 place-items-center rounded-full border border-white/70 bg-white text-muted-foreground shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-200 ease-out hover:bg-slate-50 hover:text-foreground active:scale-95"
          title="Edit staff details"
          aria-label="Edit staff details"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function ManageTeam({ data }: { data: Bootstrap }) {
  const { user } = useSession();
  const isAdmin = user?.role === "admin";
  const isLead = isAdmin || user?.role === "manager";

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [edit, setEdit] = useState<Partial<StaffRow> | null>(null);

  const activeFilterCount = (roleFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  const filteredStaff = useMemo(() => {
    return data.staff.filter((s) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          s.name.toLowerCase().includes(q) ||
          s.phone.toLowerCase().includes(q) ||
          s.center.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (roleFilter !== "all" && s.role !== roleFilter) return false;
      if (statusFilter === "active" && !s.active) return false;
      if (statusFilter === "inactive" && s.active) return false;
      return true;
    });
  }, [data.staff, search, roleFilter, statusFilter]);

  // Section 1: Admin (with Dr. Sheetal card)
  const admins = useMemo(
    () => filteredStaff.filter((s) => s.role === "admin"),
    [filteredStaff]
  );

  // Section 2: Employees (manager like Sandeep Gaikwad + other employees)
  const employees = useMemo(
    () => filteredStaff.filter((s) => s.role !== "admin"),
    [filteredStaff]
  );

  return (
    <div className="space-y-5">
      {/* Header with Title, Subtitle, and Top-Right Add Staff Button */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-medium tracking-[-0.03em] text-foreground">Team</h2>
          <p className="mt-1 text-xs font-normal leading-relaxed text-slate-500">
            Manage staff, set roles and status
          </p>
        </div>
        {isLead && (
          <button
            type="button"
            onClick={() => setEdit({ role: "phlebo", center: "Nanded City", active: true })}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-action px-4 text-xs font-semibold text-action-foreground shadow-[0_8px_24px_rgb(0,0,0,0.12)] transition-all duration-200 ease-out active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add staff
          </button>
        )}
      </div>

      {/* Search Input Row with Circular Filter Icon Button on Right Side */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            placeholder="Search by name, phone, or ID..."
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-2xl border border-input bg-card pl-9.5 pr-8 text-xs outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition shadow-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center text-slate-400 hover:text-slate-700 transition"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Circular Filter Icon Button right beside Search Bar */}
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          title="Filter staff"
          aria-label="Filter staff"
          className={cn(
            "relative grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-all active:scale-95 shadow-xs select-none",
            hasActiveFilters
              ? "border-primary bg-slate-100 text-foreground font-bold ring-2 ring-primary/10"
              : "border-slate-200/90 bg-card text-slate-600 hover:text-foreground hover:bg-slate-50"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {hasActiveFilters && (
            <span className="absolute -top-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-white ring-2 ring-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Staff Directory List Separated into Admin (Dr. Sheetal) and Employees (Manager + Staff) */}
      <div className="space-y-6">
        {/* Section 1: Admin */}
        {admins.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Admin
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">{admins.length}</span>
            </div>
            <div className="card-surface">
              {admins.map((s) => (
                <StaffRowCard key={s.id} s={s} isLead={isLead} canEdit={isAdmin} onEdit={setEdit} />
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Employees (including Center Manager Sandeep Gaikwad) */}
        {employees.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Employees
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">{employees.length}</span>
            </div>
            <div className="card-surface">
              {employees.map((s) => (
                <StaffRowCard key={s.id} s={s} isLead={isLead} onEdit={setEdit} />
              ))}
            </div>
          </div>
        )}

        {!admins.length && !employees.length && (
          <div className="card-surface p-8 text-center text-sm text-muted-foreground">
            No employees found matching your filters.
          </div>
        )}
      </div>

      {/* Filter Bottom Sheet Popup */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent
          side="bottom"
          hideClose
          className="mx-auto max-w-lg rounded-t-3xl border-t border-slate-100 bg-white px-5 pt-3 pb-8 shadow-[0_-12px_40px_rgba(0,0,0,0.15)] focus:outline-none"
        >
          {/* Native-feel sheet drag bar */}
          <div className="mx-auto -mt-1 mb-3.5 h-1 w-12 rounded-full bg-slate-300/80" />

          {/* Header without icon and without close X */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <SheetTitle className="text-base font-bold text-foreground">Filters</SheetTitle>
              <p className="text-[11px] text-muted-foreground">Filter staff by status and role</p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setRoleFilter("all");
                  setStatusFilter("all");
                }}
                className="flex items-center gap-1 text-xs font-semibold text-foreground hover:text-slate-700 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition active:scale-95"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="space-y-4 pt-3">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: "all", label: "All" },
                  { id: "active", label: "Active" },
                  { id: "inactive", label: "Inactive" },
                ] as const).map((s) => {
                  const isSelected = statusFilter === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStatusFilter(s.id)}
                      className={cn(
                        "h-9 w-full rounded-full flex items-center justify-center px-3 text-xs font-semibold transition-all select-none active:scale-95",
                        isSelected
                          ? "border-2 border-primary bg-slate-100 text-foreground font-bold shadow-xs"
                          : "border border-slate-200/80 bg-slate-50 text-slate-600 hover:bg-slate-100/80 hover:text-foreground"
                      )}
                    >
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Role Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Role
              </label>
              <div className="flex flex-wrap gap-2">
                {([
                  { id: "all", label: "All Roles" },
                  { id: "admin", label: "Admin" },
                  { id: "manager", label: "Center Manager" },
                  { id: "phlebo", label: "Home Phlebotomy" },
                  { id: "frontdesk", label: "Front Desk" },
                ] as const).map((r) => {
                  const isSelected = roleFilter === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRoleFilter(r.id as any)}
                      className={cn(
                        "h-9 rounded-full flex items-center justify-center px-4 text-xs font-semibold transition-all select-none active:scale-95",
                        isSelected
                          ? "border-2 border-primary bg-slate-100 text-foreground font-bold shadow-xs"
                          : "border border-slate-200/80 bg-slate-50 text-slate-600 hover:bg-slate-100/80 hover:text-foreground"
                      )}
                    >
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Apply Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="w-full rounded-2xl bg-action px-6 py-3.5 text-sm font-medium text-action-foreground shadow-sm transition-all hover:bg-action/90 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Show {filteredStaff.length} {filteredStaff.length === 1 ? "Employee" : "Employees"}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <StaffDialog value={edit} onClose={() => setEdit(null)} existingStaff={data.staff} />
    </div>
  );
}

function StaffDialog({
  value,
  onClose,
  existingStaff,
}: {
  value: Partial<StaffRow> | null;
  onClose: () => void;
  existingStaff: StaffRow[];
}) {
  const { token } = useSession();
  const refresh = useRefresh();
  const [f, setF] = useState<Partial<StaffRow> & { pin?: string }>({});
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState<string | undefined>();

  if (value && key !== (value.id ?? "new")) {
    setKey(value.id ?? "new");
    setF({ ...value, pin: "" });
  }

  const save = async () => {
    setBusy(true);
    try {
      await upsertStaff({
        data: {
          token: token!,
          id: f.id,
          name: f.name ?? "",
          phone: f.phone ?? "",
          pin: f.pin || undefined,
          role: (f.role ?? "phlebo") as Role,
          center: f.center ?? "Nanded City",
          active: f.active ?? true,
        },
      });
      toast.success(f.id ? "Staff profile updated" : "New staff member added");
      refresh();
      setKey(undefined);
      onClose();
    } catch (e) {
      const m = (e as Error).message;
      toast.error(m.startsWith("[") ? "Please check phone (10 digits) and PIN (4 digits)" : m);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!value} onOpenChange={(o) => { if (!o) { setKey(undefined); onClose(); } }}>
      <DialogContent className="w-[calc(100%-32px)] max-w-md rounded-[28px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>{f.id ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {/* Employee ID */}
          <div>
            <p className={label}>Employee ID</p>
            <input
              className={field}
              value={f.id ?? ""}
              disabled={!!f.id}
              placeholder="e.g. u-priya (leave blank to auto-generate)"
              onChange={(e) => setF({ ...f, id: e.target.value.trim() })}
            />
          </div>

          {/* Full Name */}
          <div>
            <p className={label}>Full Name</p>
            <input
              className={field}
              value={f.name ?? ""}
              placeholder="e.g. Priya Jadhav"
              onChange={(e) => setF({ ...f, name: e.target.value })}
            />
          </div>

          {/* Phone & PIN */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={label}>Phone (10 digits)</p>
              <input
                inputMode="numeric"
                maxLength={10}
                className={field}
                value={f.phone ?? ""}
                placeholder="9876501001"
                onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, "") })}
              />
            </div>
            <div>
              <p className={label}>{f.id ? "New PIN (optional)" : "PIN (4 digits)"}</p>
              <input
                inputMode="numeric"
                maxLength={4}
                className={field}
                value={f.pin ?? ""}
                placeholder="1234"
                onChange={(e) => setF({ ...f, pin: e.target.value.replace(/\D/g, "") })}
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <p className={label}>Role</p>
            <div className="relative">
              <select
                className={cn(field, "appearance-none pr-9 cursor-pointer")}
                value={f.role ?? "phlebo"}
                onChange={(e) => setF({ ...f, role: e.target.value as Role })}
              >
                {(["phlebo", "frontdesk", "manager", "admin"] as Role[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Center */}
          <div>
            <p className={label}>Center / Location</p>
            <input
              className={field}
              value={f.center ?? ""}
              placeholder="Nanded City"
              onChange={(e) => setF({ ...f, center: e.target.value })}
            />
          </div>

          {/* Active Status */}
          <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={f.active ?? true}
              onChange={(e) => setF({ ...f, active: e.target.checked })}
              className="h-4 w-4 accent-primary rounded"
            />
            <span>Active Employee (in-scope for monthly reviews)</span>
          </label>

          <button
            type="button"
            onClick={save}
            disabled={busy || !f.name}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-action px-6 py-3.5 text-sm font-medium text-action-foreground shadow-sm transition-all hover:bg-action/90 active:scale-[0.98] disabled:opacity-50 active:scale-98 transition-all mt-4"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Staff Profile
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EditKras({ data }: { data: Bootstrap }) {
  const { user } = useSession();
  const isAdmin = user?.role === "admin";
  const [edit, setEdit] = useState<Partial<Kra> | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-medium tracking-[-0.03em] text-foreground">KRA & KPI Setup</h2>
          <p className="mt-1 text-xs font-normal leading-relaxed text-slate-500">
            Configure monthly targets, units, directions, and weight distribution per role.
          </p>
        </div>
      </div>

      {!isAdmin && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-amber-50 border border-amber-200/80 p-3.5 text-xs text-amber-800 font-medium">
          <Lock className="h-4 w-4 text-amber-600 shrink-0" />
          <span>
            Organization-wide KRA templates are managed by Admin (Dr. Sheetal). View-only for Center Managers.
          </span>
        </div>
      )}

      {(["phlebo", "frontdesk"] as const).map((r) => {
        const ks = krasFor(data.kras, r);
        const total = ks.reduce((s, k) => s + Number(k.weight), 0);

        return (
          <div key={r} className="space-y-2">
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {ROLE_LABEL[r]}
              </p>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular",
                  total === 100
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                )}
              >
                Total Weight: {total}% {total !== 100 && "(Must sum to 100%)"}
              </span>
            </div>

            <div className="card-surface">
              {ks.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 transition-colors last:border-b-0 hover:bg-slate-50/70"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug text-foreground whitespace-normal">{k.name}</p>
                    <p className="mt-0.5 text-xs font-normal leading-relaxed text-slate-500 whitespace-normal">
                      Target: {k.direction === "lower_better" ? (Number(k.target) === 0 ? "0" : `≤ ${k.target}`) : k.target}{" "}
                      {k.unit} · Weight: {k.weight}% ·{" "}
                      <span className={k.direction === "lower_better" ? "text-amber-700 font-medium" : "text-slate-600"}>
                        {k.direction === "lower_better" ? "Lower is better" : "Higher is better"}
                      </span>
                    </p>
                  </div>

                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => setEdit(k)}
                      className="grid h-8 w-8 place-items-center rounded-xl border border-border/70 bg-card text-muted-foreground hover:text-foreground active:scale-95 transition"
                      title="Edit KPI"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEdit(k)}
                      className="h-7 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition active:scale-95"
                    >
                      View
                    </button>
                  )}
                </div>
              ))}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() =>
                    setEdit({
                      role: r,
                      direction: "higher_better",
                      unit: "",
                      weight: 0,
                      target: 0,
                    })
                  }
                  className="flex w-full items-center gap-2 p-4 text-xs font-bold text-foreground hover:text-slate-700 hover:bg-slate-50 transition"
                >
                  <Plus className="h-4 w-4" /> Add KPI Definition
                </button>
              )}
            </div>
          </div>
        );
      })}

      <KraDialog value={edit} onClose={() => setEdit(null)} isAdmin={isAdmin} />
    </div>
  );
}

function KraDialog({
  value,
  onClose,
  isAdmin = true,
}: {
  value: Partial<Kra> | null;
  onClose: () => void;
  isAdmin?: boolean;
}) {
  const { token } = useSession();
  const refresh = useRefresh();
  const [f, setF] = useState<Partial<Kra>>({});
  const [key, setKey] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  if (value && key !== (value.id ?? "new")) {
    setKey(value.id ?? "new");
    setF(value);
  }

  const close = () => {
    setKey(undefined);
    onClose();
  };

  const save = async () => {
    if (!isAdmin) return;
    if (!f.name?.trim()) {
      toast.error("Please enter a KPI name");
      return;
    }
    setBusy(true);
    try {
      await upsertKra({
        data: {
          token: token!,
          id: f.id,
          role: f.role as "phlebo" | "frontdesk",
          name: f.name ?? "",
          target: Number(f.target) || 0,
          unit: f.unit ?? "",
          weight: Number(f.weight) || 0,
          direction: f.direction ?? "higher_better",
        },
      });
      toast.success(f.id ? "KPI updated" : "KPI added");
      refresh();
      close();
    } catch (e) {
      toast.error((e as Error).message || "Failed to save KPI");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!isAdmin || !f.id || !confirm(`Delete KPI "${f.name}"?`)) return;
    try {
      await deleteKra({ data: { token: token!, id: f.id } });
      toast.success("KPI deleted");
      refresh();
      close();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={!!value} onOpenChange={(o) => !o && close()}>
      <DialogContent className="w-[calc(100%-32px)] max-w-md rounded-[28px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>
            {!isAdmin ? "View KPI Definition" : f.id ? "Edit KPI Definition" : "Add KPI Definition"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div>
            <p className={label}>KPI Name</p>
            <input
              disabled={!isAdmin}
              className={cn(field, !isAdmin && "bg-slate-50 text-slate-700 cursor-not-allowed")}
              value={f.name ?? ""}
              placeholder="e.g. Home Visits"
              onChange={(e) => setF({ ...f, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className={label}>Monthly Target</p>
              <input
                disabled={!isAdmin}
                inputMode="decimal"
                className={cn(field, !isAdmin && "bg-slate-50 text-slate-700 cursor-not-allowed")}
                value={f.target ?? ""}
                placeholder="160"
                onChange={(e) => setF({ ...f, target: e.target.value as unknown as number })}
              />
            </div>
            <div>
              <p className={label}>Unit</p>
              <input
                disabled={!isAdmin}
                className={cn(field, !isAdmin && "bg-slate-50 text-slate-700 cursor-not-allowed")}
                value={f.unit ?? ""}
                placeholder="visits, %"
                onChange={(e) => setF({ ...f, unit: e.target.value })}
              />
            </div>
            <div>
              <p className={label}>Weight %</p>
              <input
                disabled={!isAdmin}
                inputMode="decimal"
                className={cn(field, !isAdmin && "bg-slate-50 text-slate-700 cursor-not-allowed")}
                value={f.weight ?? ""}
                placeholder="25"
                onChange={(e) => setF({ ...f, weight: e.target.value as unknown as number })}
              />
            </div>
          </div>

          <div>
            <p className={label}>Direction</p>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {(["higher_better", "lower_better"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => setF({ ...f, direction: d })}
                  className={cn(
                    "rounded-xl border py-2.5 text-xs font-semibold transition active:scale-95",
                    f.direction === d
                      ? "bg-primary text-white border-slate-200/80 shadow-sm"
                      : "border-slate-200 bg-slate-100/80 text-slate-700 hover:bg-slate-200/80",
                    !isAdmin && "cursor-default opacity-85"
                  )}
                >
                  {d === "higher_better" ? "Higher is better" : "Lower is better"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {f.id && isAdmin && (
              <button
                type="button"
                onClick={remove}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-destructive/40 text-destructive hover:bg-destructive/10"
                aria-label="Delete KPI"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            {isAdmin ? (
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-action px-6 py-3.5 text-sm font-medium text-action-foreground shadow-sm transition-all hover:bg-action/90 active:scale-[0.98] disabled:opacity-50 active:scale-98 transition-all"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Save KPI
              </button>
            ) : (
              <button
                type="button"
                onClick={close}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3.5 font-semibold text-slate-700 hover:bg-slate-200 active:scale-98 transition-all text-xs"
              >
                Close (View-only)
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
