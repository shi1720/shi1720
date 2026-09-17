import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '*.spec.js', forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, workers: 2,
  use: { baseURL: 'http://127.0.0.1:8766', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }, { name: 'mobile', use: { ...devices['Pixel 7'] } }],
  webServer: { command: 'python3 -m http.server 8766 --bind 127.0.0.1', url: 'http://127.0.0.1:8766/atlas/', reuseExistingServer: !process.env.CI },
});
