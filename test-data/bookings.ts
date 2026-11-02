import { type Booking } from '../api/types';

/** Builds a valid booking. Override any field the test cares about. */
export function buildBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    firstname: 'Jane',
    // Unique per call, so the booking is easy to identify on the shared public API.
    lastname: `Tester-${Date.now()}`,
    totalprice: 245,
    depositpaid: true,
    bookingdates: { checkin: '2026-12-01', checkout: '2026-12-05' },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}
