import { type APIRequestContext, type APIResponse } from '@playwright/test';
import { type Booking, type Credentials } from './types';

// Retry dropped connections (ECONNRESET) to the shared public API. HTTP error
// statuses are never retried, so a real 4xx/5xx still reaches the test.
const NETWORK_RETRIES = 2;

/**
 * Thin wrapper over the Restful-booker /booking endpoints.
 * Returns raw responses so tests own their assertions, and remembers every
 * booking it creates so the fixture can delete them after the test.
 */
export class BookingClient {
  private readonly createdIds: number[] = [];

  constructor(private readonly request: APIRequestContext) {}

  async create(booking: Booking): Promise<APIResponse> {
    const response = await this.request.post('/booking', { data: booking, maxRetries: NETWORK_RETRIES });
    if (response.ok()) {
      const { bookingid } = await response.json();
      this.createdIds.push(bookingid);
    }
    return response;
  }

  async get(id: number): Promise<APIResponse> {
    return this.request.get(`/booking/${id}`, { maxRetries: NETWORK_RETRIES });
  }

  /** Deletes every booking created through this client. */
  async deleteCreated(credentials: Credentials): Promise<void> {
    if (this.createdIds.length === 0) {
      return;
    }
    const token = await this.authenticate(credentials);
    for (const id of this.createdIds.splice(0)) {
      const response = await this.request.delete(`/booking/${id}`, {
        headers: { Cookie: `token=${token}` },
        maxRetries: NETWORK_RETRIES,
      });
      // Restful-booker answers a successful DELETE with 201 Created.
      if (!response.ok()) {
        throw new Error(`Failed to delete booking ${id}: ${response.status()} ${await response.text()}`);
      }
    }
  }

  private async authenticate(credentials: Credentials): Promise<string> {
    const response = await this.request.post('/auth', { data: credentials, maxRetries: NETWORK_RETRIES });
    // Bad credentials still return 200, with { reason: "Bad credentials" } instead of a token.
    const body: { token?: string; reason?: string } = await response.json();
    if (!response.ok() || !body.token) {
      throw new Error(`Authentication failed: ${response.status()} ${body.reason ?? ''}`.trim());
    }
    return body.token;
  }
}
