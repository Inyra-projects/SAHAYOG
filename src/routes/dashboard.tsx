import { createFileRoute } from "@tanstack/react-router";
import { SessionProvider } from "@/components/kra/session";
import { AppShell } from "@/components/kra/AppShell";
import { ProtectedRoute } from "@/components/kra/ProtectedRoute";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — Sahayog KRA Tracker" }],
  }),
  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    <ProtectedRoute allowedRoles={["admin", "manager"]}>
      <SessionProvider>
        <AppShell initialTab="dash" />
      </SessionProvider>
    </ProtectedRoute>
  );
}
