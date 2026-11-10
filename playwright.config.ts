import { generateKeyPairSync } from "node:crypto";
import { defineConfig, devices } from "@playwright/test";
import { testVideoEnv } from "./tests/video-fixtures";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const testSigningEnv = {
  MUX_SIGNING_KEY_ID: "test-key",
  MUX_SIGNING_PRIVATE_KEY: Buffer.from(
    privateKey.export({ type: "pkcs8", format: "pem" }),
  ).toString("base64"),
  MUX_PLAYBACK_RESTRICTION_ID: "test-restriction",
};

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
      env: { ...testVideoEnv, ...testSigningEnv, DEFAULT_DAY: "1", NEXT_TELEMETRY_DISABLED: "1" },
    },
    {
      command: "npm run start -- --hostname 127.0.0.1 --port 3101",
      url: "http://127.0.0.1:3101",
      reuseExistingServer: false,
      env: {
        ...testVideoEnv,
        ...testSigningEnv,
        DEFAULT_DAY: "2",
        DAY_1_ID: "",
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  ],
});
