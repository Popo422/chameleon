import { defineConfig, devices } from '@playwright/test';

/**
 * Runs the multiplayer E2E against the LIVE deployed site + hosted Supabase.
 * No local dev server — it drives the real production deployment.
 * Usage: npx playwright test --config playwright.live.config.js multiplayer
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'https://chameleon-psi.vercel.app',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // No webServer — we test the already-deployed site.
});
