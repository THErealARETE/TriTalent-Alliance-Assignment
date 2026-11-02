import { expect, test } from '@playwright/test';

type Booking = {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: { checkin: string; checkout: string };
  additionalneeds?: string;
};

type CreateBookingResponse = { bookingid: number; booking: Booking };

test('a created booking can be fetched by id with every field unchanged', async ({ request }) => {
  const booking: Booking = {
    firstname: 'Jane',
    lastname: `Tester-${Date.now()}`,
    totalprice: 245,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-12-01',
      checkout: '2026-12-05',
    },
    additionalneeds: 'Breakfast',
  };

  const createResponse = await request.post('/booking', { data: booking });
  await expect(createResponse).toBeOK();
  const created: CreateBookingResponse = await createResponse.json();
  expect(created.bookingid).toEqual(expect.any(Number));
  expect(created.booking).toEqual(booking);

  const getResponse = await request.get(`/booking/${created.bookingid}`);
  await expect(getResponse).toBeOK();
  // toEqual compares deeply, so this fails on any changed, missing or extra field.
  const fetched: Booking = await getResponse.json();
  expect(fetched).toEqual(booking);
});
