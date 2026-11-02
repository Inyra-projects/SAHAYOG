import { useState, useEffect, type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { getDefaultRouteForRole, getStoredUser } from "@/lib/auth";
import type { Role } from "@/lib/scoring";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const dest = getDefaultRouteForRole(user.role);
    return <Navigate to={dest as any} replace />;
  }

  return <>{children}</>;
}
