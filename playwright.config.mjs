import { defineConfig, devices } from '@playwright/test';

const siteBasePath = process.env.SITE_BASE_PATH ? process.env.SITE_BASE_PATH.replace(/\/+$/, '') : '';
const previewOrigin = 'http://127.0.0.1:4324';
const previewBaseURL = `${previewOrigin}${siteBasePath || ''}`;

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'reports/playwright-html' }]],
  use: {
    baseURL: previewBaseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run prod && npm run preview -- --host 127.0.0.1 --port 4324',
    url: `${previewBaseURL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
