import { useState, useEffect } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { getDefaultRouteForRole, getStoredUser } from "@/lib/auth";
import { SessionProvider } from "@/components/kra/session";
import { Login } from "@/components/kra/Login";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KRA Tracker — Sahayog Nanded City" },
      { name: "description", content: "Weekly KRA tracking and monthly score roll-up for Sahayog Pathology Lab, Nanded City." },
      { property: "og:title", content: "KRA Tracker — Sahayog Nanded City" },
      { property: "og:description", content: "Weekly KRA tracking and monthly score roll-up for Sahayog Pathology Lab staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const user = getStoredUser();

  if (!user) {
    return (
      <SessionProvider>
        <Login />
      </SessionProvider>
    );
  }

  const dest = getDefaultRouteForRole(user.role);
  return <Navigate to={dest as any} replace />;
}
