import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Retry whole tests in CI only, where shared infrastructure causes transient failures.
  // A test that passes on retry is reported as "flaky" rather than hidden.
  // Locally there are no retries, so flakiness shows up immediately.
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
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
        baseURL: 'https://www.saucedemo.com',
        // saucedemo marks elements with data-test, so getByTestId() targets that attribute.
        testIdAttribute: 'data-test',
      },
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: 'https://restful-booker.herokuapp.com',
        // Restful-booker answers 418 when no Accept header is sent, so ask for JSON explicitly.
        extraHTTPHeaders: { Accept: 'application/json' },
      },
    },
  ],
});
