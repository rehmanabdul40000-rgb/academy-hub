// @lovable.dev/vite-tanstack-config already includes the framework plugins,
// React/TanStack setup, Tailwind, path aliases, and the TanStack Start server.
// Academy Hub is deployed on Vercel, so no Netlify plugin is required.

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
});
