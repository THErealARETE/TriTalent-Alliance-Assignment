import { defineConfig, devices } from '@playwright/test';
import { env } from './config/env';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Retry whole tests in CI only, where shared infrastructure causes transient failures.
  // A test that passes on retry is reported as "flaky" rather than hidden.
  // Locally there are no retries, so flakiness shows up immediately.
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }], ['allure-playwright', { resultsDir: 'allure-results' }]],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'ui',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: env.sauce.baseUrl,
        // saucedemo marks elements with data-test, so getByTestId() targets that attribute.
        testIdAttribute: 'data-test',
      },
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: env.booker.baseUrl,
        // Restful-booker answers 418 when no Accept header is sent, so ask for JSON explicitly.
        extraHTTPHeaders: { Accept: 'application/json' },
      },
    },
  ],
});
