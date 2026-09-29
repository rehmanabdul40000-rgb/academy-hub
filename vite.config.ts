// @lovable.dev/vite-tanstack-config provides the framework plugins,
// React/TanStack setup, Tailwind, path aliases, and TanStack Start server.

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
});
