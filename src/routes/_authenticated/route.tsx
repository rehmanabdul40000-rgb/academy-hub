import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getStoredAdminSession } from "@/features/auth/auth.session";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        return { user: data.user };
      }
    } catch {
      // Supabase fetch failure fallback
    }

    const stored = getStoredAdminSession();
    if (stored) {
      return { user: stored };
    }

    throw redirect({ to: "/login" });
  },
  component: () => <Outlet />,
});
