import { test as base } from '@playwright/test';
import { BookingClient } from '../api/BookingClient';
import { env } from '../config/env';

type ApiFixtures = { bookingClient: BookingClient };

export const test = base.extend<ApiFixtures>({
  bookingClient: async ({ request }, use) => {
    const client = new BookingClient(request);
    await use(client);
    // Teardown runs even when the test fails, so no test data is left behind.
    await client.deleteCreated(env.booker.credentials);
  },
});
