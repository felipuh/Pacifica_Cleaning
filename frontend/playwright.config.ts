import { defineConfig, devices } from "@playwright/test";

const externalServers = process.env.PLAYWRIGHT_EXTERNAL_SERVERS === "true";

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:5174",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 5"] } }
  ],
  webServer: externalServers ? undefined : [
    {
      command: "cd ../backend && DATABASE_URL=sqlite:////tmp/pacifica-cleaning-e2e.sqlite3 .venv/bin/python manage.py migrate --noinput && DATABASE_URL=sqlite:////tmp/pacifica-cleaning-e2e.sqlite3 .venv/bin/python manage.py flush --noinput && DATABASE_URL=sqlite:////tmp/pacifica-cleaning-e2e.sqlite3 .venv/bin/python manage.py bootstrap_system --email admin@pacifica.local --password E2E-Only-Password-12345 && DATABASE_URL=sqlite:////tmp/pacifica-cleaning-e2e.sqlite3 .venv/bin/python manage.py seed_initial_data && DATABASE_URL=sqlite:////tmp/pacifica-cleaning-e2e.sqlite3 .venv/bin/python manage.py runserver 127.0.0.1:8001",
      url: "http://127.0.0.1:8001/api/v1/health/",
      timeout: 120_000,
      reuseExistingServer: false
    },
    {
      command: "npm run dev -- --host 127.0.0.1",
      url: "http://127.0.0.1:5174",
      timeout: 120_000,
      reuseExistingServer: false
    }
  ]
});
