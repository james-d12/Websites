import { defineConfig, devices } from "@playwright/test";
/*
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({path: path.resolve(__dirname, '.env')});
*/

export default defineConfig({
  testDir: "././e2e-tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: [
    {
      command: "pnpm --filter jamesdurban.com dev",
      url: "http://localhost:35421",
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm --filter blackcattattoos.co.uk dev",
      url: "http://localhost:35422",
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm --filter orchitect.net dev",
      url: "http://localhost:35423",
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm --filter stcatherinesgroup.com dev",
      url: "http://localhost:35424",
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm --filter thecontourclinicrichmond.co.uk dev",
      url: "http://localhost:35425",
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
