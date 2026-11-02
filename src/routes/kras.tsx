import { createFileRoute } from "@tanstack/react-router";
import { SessionProvider } from "@/components/kra/session";
import { AppShell } from "@/components/kra/AppShell";
import { ProtectedRoute } from "@/components/kra/ProtectedRoute";

export const Route = createFileRoute("/kras")({
  head: () => ({
    meta: [{ title: "Edit KRAs — Sahayog KRA Tracker" }],
  }),
  component: KrasRoute,
});

function KrasRoute() {
  return (
    <ProtectedRoute allowedRoles={["admin", "manager"]}>
      <SessionProvider>
        <AppShell initialTab="kras" />
      </SessionProvider>
    </ProtectedRoute>
  );
}
