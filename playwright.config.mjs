import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "*.spec.mjs",
  workers: 1,
  use: {
    baseURL: "http://localhost:4173",
    channel: "chrome",
    headless: true,
    serviceWorkers: "allow",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run build && npm run preview -- --host localhost --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: false,
  },
});
