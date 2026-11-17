import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@server-types": path.resolve(here, "../server/src/types") },
  },
  server: {
    port: 4701,
    proxy: { "/api": "http://localhost:4700" },
  },
});
