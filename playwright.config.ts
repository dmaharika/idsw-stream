import { defineConfig, devices } from "@playwright/test";
import { testVideoEnv } from "./tests/video-fixtures";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: "npm run start -- --hostname 127.0.0.1 --port 3100",
      url: "http://127.0.0.1:3100",
      reuseExistingServer: false,
      env: { ...testVideoEnv, DEFAULT_DAY: "1", NEXT_TELEMETRY_DISABLED: "1" },
    },
    {
      command: "npm run start -- --hostname 127.0.0.1 --port 3101",
      url: "http://127.0.0.1:3101",
      reuseExistingServer: false,
      env: {
        ...testVideoEnv,
        DEFAULT_DAY: "2",
        DAY_1_ID: "",
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  ],
});
