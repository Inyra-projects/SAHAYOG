import { createFileRoute } from "@tanstack/react-router";
import { SessionProvider } from "@/components/kra/session";
import { AppShell } from "@/components/kra/AppShell";
import { ProtectedRoute } from "@/components/kra/ProtectedRoute";

export const Route = createFileRoute("/rate")({
  head: () => ({
    meta: [{ title: "Rate a Peer — Sahayog KRA Tracker" }],
  }),
  component: RateRoute,
});

function RateRoute() {
  return (
    <ProtectedRoute allowedRoles={["phlebo", "frontdesk", "admin", "manager"]}>
      <SessionProvider>
        <AppShell initialTab="rate" />
      </SessionProvider>
    </ProtectedRoute>
  );
}
