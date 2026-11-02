import { readJson } from '../../api/readJson';
import { type Booking, type CreateBookingResponse } from '../../api/types';
import { expect, test } from '../../fixtures';
import { buildBooking } from '../../test-data/bookings';

test('a created booking can be fetched by id with every field unchanged', async ({ bookingClient }) => {
  const booking = buildBooking();

  const createResponse = await bookingClient.create(booking);
  await expect(createResponse).toBeOK();
  const created = await readJson<CreateBookingResponse>(createResponse);
  expect(created.bookingid).toEqual(expect.any(Number));
  expect(created.booking).toEqual(booking);

  const getResponse = await bookingClient.get(created.bookingid);
  await expect(getResponse).toBeOK();
  // toEqual compares deeply, so this fails on any changed, missing or extra field.
  expect(await readJson<Booking>(getResponse)).toEqual(booking);
});
