import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { getStoredAdminSession } from "@/features/auth/auth.session";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Academy Hub — Private Management" },
      { name: "description", content: "Private academy student and fee management." },
      { property: "og:title", content: "Academy Hub — Private Management" },
      { property: "og:description", content: "Private academy student and fee management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EntryRoute,
});

function EntryRoute() {
  const navigate = useNavigate();
  useEffect(() => {
    if (getStoredAdminSession()) {
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      navigate({ to: data.user ? "/dashboard" : "/login", replace: true });
    });
  }, [navigate]);
  return (
    <main className="dark grid min-h-dvh place-items-center bg-background">
      <span
        className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
        aria-label="Loading"
      />
    </main>
  );
}
