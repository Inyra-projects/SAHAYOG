import type { Role } from "./scoring";

export interface PRDUser {
  id: string;
  name: string;
  phone: string;
  altPhone?: string;
  pin: string;
  role: Role;
  center: string;
  active: boolean;
}

export const LOCAL_STORAGE_USER_KEY = "sahayog-kra-user";
export const LOCAL_STORAGE_TOKEN_KEY = "sahayog-kra-token";

export const PRD_USERS: PRDUser[] = [
  { id: "u-sheetal", name: "Dr. Sheetal", phone: "9876500001", pin: "0000", role: "admin", center: "Nanded City", active: true },
  { id: "u-sandeep", name: "Sandeep Gaikwad", phone: "9876500100", altPhone: "9876501000", pin: "0100", role: "manager", center: "Nanded City", active: true },
  { id: "u-priya", name: "Priya Jadhav", phone: "9876501001", pin: "1001", role: "phlebo", center: "Nanded City", active: true },
  { id: "u-rohit", name: "Rohit Shinde", phone: "9876501002", pin: "1002", role: "phlebo", center: "Nanded City", active: true },
  { id: "u-sneha", name: "Sneha Pawar", phone: "9876501003", pin: "1003", role: "phlebo", center: "Nanded City", active: true },
  { id: "u-amit", name: "Amit Kulkarni", phone: "9876501004", pin: "1004", role: "phlebo", center: "Nanded City", active: true },
  { id: "u-meera", name: "Meera Deshmukh", phone: "9876502001", pin: "2001", role: "frontdesk", center: "Nanded City", active: true },
  { id: "u-nikhil", name: "Nikhil Patil", phone: "9876502002", pin: "2002", role: "frontdesk", center: "Nanded City", active: true },
  { id: "u-anjali", name: "Anjali More", phone: "9876502003", pin: "2003", role: "frontdesk", center: "Nanded City", active: true },
];

export function getStoredUser(): PRDUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (user && user.id && user.phone && user.role) {
      return user as PRDUser;
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: PRDUser): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
    localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, user.id);
  } catch (e) {
    console.error("Failed to save auth state to localStorage", e);
  }
}

export function getAllStaffUsers(): PRDUser[] {
  if (typeof window === "undefined") return PRD_USERS;
  try {
    const raw = localStorage.getItem("sahayog-kra-staff");
    if (raw) {
      const stored = JSON.parse(raw) as (PRDUser & { pin?: string })[];
      if (Array.isArray(stored) && stored.length > 0) {
        // Map stored staff, preserving PINs from PRD_USERS defaults if not explicitly set
        return stored.map((s) => {
          const defaultUser = PRD_USERS.find((u) => u.id === s.id);
          return {
            id: s.id,
            name: s.name,
            phone: s.phone,
            altPhone: defaultUser?.altPhone,
            pin: s.pin || defaultUser?.pin || "1234",
            role: s.role,
            center: s.center,
            active: s.active ?? true,
          };
        });
      }
    }
  } catch {
    // fallback
  }
  return PRD_USERS;
}

export function authenticateLocal(phone: string, pin: string): { ok: boolean; user?: PRDUser; error?: string } {
  const cleanPhone = phone.trim().replace(/\D/g, "");
  const cleanPin = pin.trim().replace(/\D/g, "");

  const allUsers = getAllStaffUsers();
  const matched = allUsers.find(
    (u) =>
      (u.phone.replace(/\D/g, "") === cleanPhone || (u.altPhone && u.altPhone.replace(/\D/g, "") === cleanPhone)) &&
      u.pin.trim() === cleanPin,
  );

  if (!matched) {
    return { ok: false, error: "Invalid phone number or PIN" };
  }

  if (!matched.active) {
    return { ok: false, error: "Account disabled. Contact administrator." };
  }

  setStoredUser(matched);

  return { ok: true, user: matched };
}

export function logoutLocal(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
  } catch (e) {
    console.error("Failed to clear auth state from localStorage", e);
  }
}

export function getDefaultRouteForRole(role: Role): string {
  if (role === "admin" || role === "manager") {
    return "/dashboard";
  }
  return "/entry";
}
