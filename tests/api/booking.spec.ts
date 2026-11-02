import { expect, test } from '@playwright/test';

test('a created booking can be fetched by id with every field unchanged', async ({ request }) => {
  const booking = {
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
  expect(createResponse.status()).toBe(200);
  const created = await createResponse.json();
  expect(created.bookingid).toEqual(expect.any(Number));
  expect(created.booking).toEqual(booking);

  const getResponse = await request.get(`/booking/${created.bookingid}`);
  expect(getResponse.status()).toBe(200);
  // toEqual compares deeply, so this fails on any changed, missing or extra field.
  expect(await getResponse.json()).toEqual(booking);
});
