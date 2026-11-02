import { createFileRoute } from "@tanstack/react-router";
import { SessionProvider } from "@/components/kra/session";
import { AppShell } from "@/components/kra/AppShell";
import { ProtectedRoute } from "@/components/kra/ProtectedRoute";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [{ title: "Manage Team — Sahayog KRA Tracker" }],
  }),
  component: TeamRoute,
});

function TeamRoute() {
  return (
    <ProtectedRoute allowedRoles={["admin", "manager"]}>
      <SessionProvider>
        <AppShell initialTab="team" />
      </SessionProvider>
    </ProtectedRoute>
  );
}
