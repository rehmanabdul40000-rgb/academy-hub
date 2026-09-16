import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getStoredAdminSession } from "@/features/auth/auth.session";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    const stored = getStoredAdminSession();
    if (stored) {
      return { user: stored };
    }

    throw redirect({ to: "/login" });
  },
  component: () => <Outlet />,
});
