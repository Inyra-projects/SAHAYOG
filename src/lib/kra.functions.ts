import type { Role, Kra, Entry, EvaluationStatus, MonthlyEvaluation } from "./scoring";
import { authenticateLocal, logoutLocal, getStoredUser } from "./auth";
import {
  getLocalBootstrap,
  saveLocalEntry,
  saveLocalEvaluation,
  updateLocalEvaluationStatus,
  getLocalEvaluation,
  getLocalEvaluations,
  addLocalRating,
  upsertLocalStaff,
  toggleLocalStaffActive,
  upsertLocalKra,
  deleteLocalKra,
  type StaffRow,
  type Rating,
  type LoginStat,
  type Bootstrap,
} from "./localStore";

export type { StaffRow, Rating, LoginStat, Bootstrap, MonthlyEvaluation, EvaluationStatus };

export async function login({ data }: { data: { phone: string; pin: string } }) {
  try {
    const res = authenticateLocal(data.phone, data.pin);
    if (!res.ok || !res.user) {
      return { ok: false as const, error: res.error || "Phone or PIN is incorrect" };
    }
    return { ok: true as const, token: res.user.id, user: res.user };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function logout({ data }: { data?: { token?: string } } = {}) {
  logoutLocal();
  return { ok: true };
}

export async function getBootstrap({ data }: { data?: { token?: string } } = {}): Promise<Bootstrap> {
  const token = data?.token || getStoredUser()?.id;
  return getLocalBootstrap(token);
}

export async function saveEvaluation({
  data,
}: {
  data: {
    token: string;
    employee_id: string;
    month: string;
    status: EvaluationStatus;
    actuals: Record<string, number | null | undefined>;
    feedback?: string;
    reviewer_id?: string | null;
  };
}) {
  const callerId = data.token || getStoredUser()?.id;
  if (!callerId) {
    throw new Error("Unauthorized");
  }
  const result = saveLocalEvaluation({
    employee_id: data.employee_id,
    month: data.month,
    status: data.status,
    actuals: data.actuals,
    feedback: data.feedback,
    reviewer_id: data.reviewer_id,
  });
  return { ok: true, evaluation: result };
}

export async function updateEvaluationStatus({
  data,
}: {
  data: {
    token: string;
    employee_id: string;
    month: string;
    status: EvaluationStatus;
    reviewer_id?: string | null;
    feedback?: string;
  };
}) {
  const callerId = data.token || getStoredUser()?.id;
  if (!callerId) {
    throw new Error("Unauthorized");
  }
  const result = updateLocalEvaluationStatus(
    data.employee_id,
    data.month,
    data.status,
    data.reviewer_id,
    data.feedback
  );
  return { ok: true, evaluation: result };
}

export async function saveEntry({
  data,
}: {
  data: {
    token: string;
    weekStart: string;
    actuals: Record<string, number>;
  };
}) {
  const staffId = data.token || getStoredUser()?.id;
  if (!staffId) {
    throw new Error("Unauthorized");
  }
  saveLocalEntry(staffId, data.weekStart, data.actuals);
  return { ok: true };
}

export async function addRating({
  data,
}: {
  data: {
    token: string;
    toId: string;
    stars: number;
    tag?: string;
    comment?: string;
  };
}) {
  const fromId = data.token || getStoredUser()?.id;
  if (!fromId) {
    throw new Error("Unauthorized");
  }
  if (fromId === data.toId) {
    throw new Error("Cannot rate yourself");
  }
  addLocalRating(fromId, data.toId, data.stars, data.tag, data.comment);
  return { ok: true };
}

export async function upsertStaff({
  data,
}: {
  data: {
    token: string;
    id?: string;
    name: string;
    phone: string;
    pin?: string;
    role: Role;
    center: string;
    active: boolean;
  };
}) {
  const res = upsertLocalStaff({
    id: data.id,
    name: data.name,
    phone: data.phone,
    pin: data.pin,
    role: data.role,
    center: data.center,
    active: data.active,
  });
  if (!res.ok) {
    throw new Error(res.error || "Failed to save staff");
  }
  return { ok: true, staff: res.staff };
}

export async function toggleStaffActive({
  data,
}: {
  data: {
    token: string;
    id: string;
  };
}) {
  const res = toggleLocalStaffActive(data.id);
  if (!res.ok) {
    throw new Error(res.error || "Failed to toggle staff active status");
  }
  return { ok: true, active: res.active };
}

export async function upsertKra({
  data,
}: {
  data: {
    token: string;
    id?: string;
    role: "phlebo" | "frontdesk";
    name: string;
    target: number;
    unit: string;
    weight: number;
    direction: "higher_better" | "lower_better";
  };
}) {
  upsertLocalKra({
    id: data.id,
    role: data.role,
    name: data.name,
    target: data.target,
    unit: data.unit,
    weight: data.weight,
    direction: data.direction,
  });
  return { ok: true };
}

export async function deleteKra({
  data,
}: {
  data: {
    token: string;
    id: string;
  };
}) {
  deleteLocalKra(data.id);
  return { ok: true };
}