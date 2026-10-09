import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    ...devices["Pixel 7"],
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/e2e-prepare.mjs && npm run db:migrate && npx next build && npx next start -p 3100",
    url: `${baseURL}/login`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: "pglite:.data/e2e",
      APP_URL: baseURL,
      MAIL_TRANSPORT: "outbox",
      TEST_MODE: "1",
      BLOB_READ_WRITE_TOKEN: "",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: "",
      VAPID_PRIVATE_KEY: "",
    },
  },
});
