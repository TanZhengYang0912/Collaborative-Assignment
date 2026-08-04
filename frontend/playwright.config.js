import { defineConfig } from "@playwright/test";

// Visual baseline harness for the mobile-first Tailwind migration.
// Runs on port 5174 with a non-reusable server: a dev server already running on
// 5173 without VITE_DISABLE_AUTH would silently redirect every gated route to
// /login and produce 48 passing tests over 48 wrong screenshots.
export default defineConfig({
  testDir: "./tests/responsive",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:5174",
    colorScheme: "light",
    reducedMotion: "no-preference",
  },
  webServer: {
    command: "VITE_DISABLE_AUTH=true npm run dev -- --host 127.0.0.1 --port 5174 --strictPort",
    url: "http://127.0.0.1:5174",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
