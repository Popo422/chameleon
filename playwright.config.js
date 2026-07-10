import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from 'vite';

// Load Vite-style env (.env) so tests can preflight-check the Supabase backend.
Object.assign(process.env, loadEnv('', process.cwd(), 'VITE_'));

/**
 * Playwright config for Chameleon.
 * Boots the Vite dev server and runs E2E tests against it.
 * Tests use two independent browser contexts to simulate real multiplayer
 * (each player gets its own anonymous Supabase session in its own localStorage).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5180',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5180',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
