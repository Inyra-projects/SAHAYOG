import { createFileRoute } from "@tanstack/react-router";
import { SessionProvider } from "@/components/kra/session";
import { AppShell } from "@/components/kra/AppShell";
import { ProtectedRoute } from "@/components/kra/ProtectedRoute";

export const Route = createFileRoute("/entry")({
  head: () => ({
    meta: [{ title: "Monthly Evaluations — Sahayog KRA Tracker" }],
  }),
  component: EntryRoute,
});

function EntryRoute() {
  return (
    <ProtectedRoute allowedRoles={["phlebo", "frontdesk", "admin", "manager"]}>
      <SessionProvider>
        <AppShell initialTab="entry" />
      </SessionProvider>
    </ProtectedRoute>
  );
}
