import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useSession } from "./session";
import {
  getDefaultRouteForRole,
  getStoredUser,
  PRD_USERS,
  updateUserPin,
  type PRDUser,
} from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ROLE_LABEL } from "@/lib/scoring";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getProfilePhoto } from "@/lib/profilePhotos";
import brandLogo from "@/imports/logo.png";

type Mode = "signin" | "create";
type PinSheetStep = "verify" | "verifying" | "reset";

const defaultAdmin = PRD_USERS.find((user) => user.role === "admin") ?? null;

function getFirstName(user: PRDUser) {
  return user.name.replace(/^Dr\.\s*/i, "").split(" ")[0];
}

function getInitials(user: PRDUser) {
  return user.name
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Login() {
  const { signIn } = useSession();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(defaultAdmin?.id ?? null);
  const [phone, setPhone] = useState(defaultAdmin?.phone ?? "");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pinSheetOpen, setPinSheetOpen] = useState(false);
  const [pinSheetStep, setPinSheetStep] = useState<PinSheetStep>("verify");
  const [recoveryMobile, setRecoveryMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinSheetError, setPinSheetError] = useState<string | null>(null);

  const finish = async () => {
    if (busy) return;
    if (!selectedUserId || phone.length !== 10 || pin.length !== 4) {
      setErr("Select your profile and enter your 4-digit PIN.");
      return;
    }
    setBusy(true);
    setErr(null);
    const error = await signIn(phone, pin);
    setBusy(false);
    if (error) {
      setErr("Incorrect PIN. Try again.");
      setPin("");
      return;
    }
    const user = getStoredUser();
    const dest = user ? getDefaultRouteForRole(user.role) : "/dashboard";
    navigate({ to: dest as never }).catch(() => {
      window.location.href = dest;
    });
  };

  const signingIn = mode === "signin";
  const visibleUsers = PRD_USERS.filter((user) =>
    signingIn ? user.role === "admin" : user.role !== "admin",
  );
  const selectedUser = PRD_USERS.find((user) => user.id === selectedUserId) ?? null;

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    setSelectedUserId(nextMode === "signin" ? (defaultAdmin?.id ?? null) : null);
    setPhone(nextMode === "signin" ? (defaultAdmin?.phone ?? "") : "");
    setPin("");
    setErr(null);
  };

  const resetPinSheet = () => {
    setPinSheetStep("verify");
    setRecoveryMobile("");
    setOtp("");
    setNewPin("");
    setConfirmPin("");
    setPinSheetError(null);
  };

  const handlePinSheetOpenChange = (open: boolean) => {
    if (!open && pinSheetStep === "verifying") return;
    setPinSheetOpen(open);
    if (!open) resetPinSheet();
  };

  const openPinSheet = () => {
    if (!selectedUser) {
      setErr("Select your profile before requesting a PIN.");
      return;
    }
    resetPinSheet();
    setPinSheetOpen(true);
  };

  const verifyRecoveryDetails = async () => {
    if (!selectedUser) return;

    const cleanMobile = recoveryMobile.replace(/\D/g, "");
    if (!/^\d{10}$/.test(cleanMobile)) {
      setPinSheetError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (!/^\d{4}$/.test(otp)) {
      setPinSheetError("Enter the 4-digit OTP.");
      return;
    }

    setPinSheetError(null);
    setPinSheetStep("verifying");
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    setPinSheetStep("reset");
  };

  const saveNewPin = () => {
    if (!selectedUser) return;
    if (!/^\d{4}$/.test(newPin)) {
      setPinSheetError("Your new PIN must contain 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinSheetError("The PINs do not match.");
      return;
    }
    if (!updateUserPin(selectedUser.id, newPin)) {
      setPinSheetError("Unable to update the PIN. Please try again.");
      return;
    }

    setPin("");
    setPinSheetOpen(false);
    resetPinSheet();
  };

  return (
    <div className="login-canvas mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-14">
      <img
        src={brandLogo}
        alt="Sahayog Pathology"
        className="w-12 h-12 object-contain mx-auto"
        onError={(e) => {
          // Fallback to public root if bundled path fails
          if (e.currentTarget.src !== "/logo.png") {
            e.currentTarget.src = "/logo.png";
          }
        }}
      />

      <h1
        data-shadow="SAHAYOG"
        className="login-wordmark mt-8 text-center text-[32px] font-bold tracking-tight text-slate-950"
      >
        SAHAYOG
      </h1>
      <p className="mt-2 text-center text-sm text-slate-400">Welcome Back</p>

      <div className="mx-auto mt-8 flex w-full max-w-[280px] rounded-full border border-white/70 bg-[#F3F4F6] p-1">
        {(["signin", "create"] as const).map((id) => {
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                changeMode(id);
              }}
              className={cn(
                "flex-1 rounded-full py-2.5 text-sm font-semibold transition-all",
                active
                  ? "bg-white text-slate-950 shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                  : "text-slate-400",
              )}
            >
              {id === "signin" ? "Admin" : "Staff"}
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <h2 className="text-base font-semibold text-slate-950">Select your profile</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          Access your dashboard, evaluations, and center tools.
        </p>
      </div>

      <div className="mt-5">
        <span className="text-sm font-medium text-slate-950"></span>
        <ScrollArea className="-mx-6 mt-3 w-[calc(100%+3rem)]">
          <div className="flex w-max gap-3 pb-3 pl-6">
            {visibleUsers.map((user) => {
              const selected = selectedUserId === user.id;
              return (
                <Button
                  key={user.id}
                  type="button"
                  variant="ghost"
                  aria-pressed={selected}
                  aria-label={`Select ${user.name}, ${ROLE_LABEL[user.role]}`}
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setPhone(user.phone);
                    setErr(null);
                  }}
                  className="h-auto w-20 flex-col gap-2 rounded-2xl px-2 py-2 hover:bg-slate-100"
                >
                  <Avatar
                    className={cn(
                      "size-16 border-2 border-white shadow-sm ring-offset-2 transition-all",
                      selected ? "ring-2 ring-slate-950" : "ring-1 ring-slate-200",
                    )}
                  >
                    <AvatarImage src={getProfilePhoto(user.id)} alt="" className="object-cover" />
                    <AvatarFallback className="text-sm font-semibold">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "w-full truncate text-xs",
                      selected ? "font-semibold text-slate-950" : "font-medium text-slate-500",
                    )}
                  >
                    {getFirstName(user)}
                  </span>
                </Button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className={cn(!signingIn && "opacity-0")} />
        </ScrollArea>
      </div>

      <form
        className="mt-5"
        onSubmit={(e) => {
          e.preventDefault();
          void finish();
        }}
      >
        <label className="flex h-14 items-center gap-3 rounded-full bg-[#F5F5F7] px-4">
          <User className="h-5 w-5 shrink-0 text-slate-400" strokeWidth={1.75} />
          <input
            type="text"
            autoComplete="off"
            placeholder="Select a profile"
            aria-label="Selected user"
            readOnly
            value={selectedUser ? `${selectedUser.name} · ${ROLE_LABEL[selectedUser.role]}` : ""}
            className="h-full min-w-0 flex-1 bg-transparent text-base text-slate-950 outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="mt-3 flex items-center gap-2">
          <label className="flex h-14 min-w-0 flex-1 items-center gap-3 rounded-full bg-[#F5F5F7] px-4">
            <Lock className="h-5 w-5 shrink-0 text-slate-400" strokeWidth={1.75} />
            <input
              type={showPin ? "text" : "password"}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              autoComplete="off"
              placeholder="PIN"
              aria-label="4-digit PIN"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                if (err) setErr(null);
              }}
              className="h-full min-w-0 flex-1 bg-transparent text-base tracking-[0.2em] text-slate-950 outline-none placeholder:tracking-normal placeholder:text-slate-400"
            />
          </label>
          <button
            type="button"
            onClick={() => setShowPin((open) => !open)}
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#F5F5F7] text-slate-500"
            aria-label={showPin ? "Hide PIN" : "Show PIN"}
          >
            {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {err && <p className="mt-3 text-center text-xs font-medium text-rose-600">{err}</p>}

        <button
          type="submit"
          className="primary-action mt-6 flex h-14 w-full items-center justify-center rounded-full text-base font-semibold transition-all active:scale-[0.98]"
        >
          Sign In
        </button>
      </form>

      <Button
        type="button"
        variant="ghost"
        onClick={openPinSheet}
        className="mt-6 h-auto text-center text-sm font-normal text-slate-500 hover:bg-transparent hover:text-slate-500"
      >
        Request a{" "}
        <span className="font-medium text-slate-950 underline underline-offset-4">PIN</span>
      </Button>

      <Sheet open={pinSheetOpen} onOpenChange={handlePinSheetOpenChange}>
        <SheetContent
          side="bottom"
          hideClose
          className="mx-auto max-w-md rounded-t-3xl border-slate-200 bg-white px-6 pb-8 pt-3"
        >
          <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-slate-300" />

          {pinSheetStep === "verifying" ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <div className="grid size-14 place-items-center rounded-full bg-slate-100">
                <Loader2 className="size-6 animate-spin text-slate-950" />
              </div>
              <span className="mt-5 text-base font-semibold text-slate-950">
                Verifying your details
              </span>
              <span className="mt-2 text-sm text-slate-500">
                Please wait while we confirm your account.
              </span>
            </div>
          ) : (
            <>
              <SheetHeader className="text-left">
                <SheetTitle>
                  {pinSheetStep === "verify" ? "Request a new PIN" : "Create your new PIN"}
                </SheetTitle>
                <SheetDescription>
                  {pinSheetStep === "verify"
                    ? `Verify the mobile number for ${selectedUser?.name ?? "this profile"} to continue.`
                    : "Choose a memorable 4-digit PIN for this profile."}
                </SheetDescription>
              </SheetHeader>

              {pinSheetStep === "verify" ? (
                <div className="mt-6 space-y-3">
                  <Input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={10}
                    aria-label="Registered mobile number"
                    placeholder="Verify mobile number"
                    value={recoveryMobile}
                    onChange={(event) => {
                      setRecoveryMobile(event.target.value.replace(/\D/g, "").slice(0, 10));
                      setPinSheetError(null);
                    }}
                    className="h-14 rounded-full border-0 bg-slate-100 px-5 shadow-none"
                  />
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={4}
                    aria-label="Four-digit OTP"
                    placeholder="Enter OTP (4 digits)"
                    value={otp}
                    onChange={(event) => {
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 4));
                      setPinSheetError(null);
                    }}
                    className="h-14 rounded-full border-0 bg-slate-100 px-5 tracking-widest shadow-none"
                  />
                  {pinSheetError && (
                    <span className="block text-center text-xs font-medium text-rose-600">
                      {pinSheetError}
                    </span>
                  )}
                  <Button
                    type="button"
                    onClick={() => void verifyRecoveryDetails()}
                    className="mt-3 h-14 w-full text-base font-semibold"
                  >
                    Verify
                  </Button>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  <Input
                    type="password"
                    inputMode="numeric"
                    autoComplete="new-password"
                    maxLength={4}
                    aria-label="New four-digit PIN"
                    placeholder="Enter new PIN (4 digits)"
                    value={newPin}
                    onChange={(event) => {
                      setNewPin(event.target.value.replace(/\D/g, "").slice(0, 4));
                      setPinSheetError(null);
                    }}
                    className="h-14 rounded-full border-0 bg-slate-100 px-5 tracking-widest shadow-none"
                  />
                  <Input
                    type="password"
                    inputMode="numeric"
                    autoComplete="new-password"
                    maxLength={4}
                    aria-label="Confirm new four-digit PIN"
                    placeholder="Confirm PIN (4 digits)"
                    value={confirmPin}
                    onChange={(event) => {
                      setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 4));
                      setPinSheetError(null);
                    }}
                    className="h-14 rounded-full border-0 bg-slate-100 px-5 tracking-widest shadow-none"
                  />
                  {pinSheetError && (
                    <span className="block text-center text-xs font-medium text-rose-600">
                      {pinSheetError}
                    </span>
                  )}
                  <Button
                    type="button"
                    onClick={saveNewPin}
                    className="mt-3 h-14 w-full text-base font-semibold"
                  >
                    Set a PIN
                  </Button>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
