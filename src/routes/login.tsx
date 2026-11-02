import { createFileRoute, Navigate } from "@tanstack/react-router";
import { SessionProvider } from "@/components/kra/session";
import { Login } from "@/components/kra/Login";
import { getDefaultRouteForRole, getStoredUser } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Login — Sahayog KRA Tracker" }],
  }),
  component: LoginRoute,
});

function LoginRoute() {
  const user = getStoredUser();

  if (user) {
    const dest = getDefaultRouteForRole(user.role);
    return <Navigate to={dest as any} replace />;
  }

  return (
    <SessionProvider>
      <Login />
    </SessionProvider>
  );
}
