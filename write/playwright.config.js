import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results.json' }]],
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chromium'] },
    },
  ],

  webServer: {
    command: 'fleabox --dev --apps-dir dist',
    url: 'http://localhost:3000/write',
    reuseExistingServer: !process.env.CI,
    timeout: 30 * 1000,
  },
});
