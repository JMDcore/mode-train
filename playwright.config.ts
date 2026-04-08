import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "https://train.jmdcore.com",
    trace: "retain-on-failure",
    viewport: {
      width: 430,
      height: 932,
    },
    ignoreHTTPSErrors: false,
    locale: "es-ES",
  },
  reporter: [["list"]],
  workers: 1,
});
