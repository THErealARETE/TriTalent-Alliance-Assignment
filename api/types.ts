export type BookingDates = { checkin: string; checkout: string };

export type Booking = {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: BookingDates;
  additionalneeds?: string;
};

export type CreateBookingResponse = { bookingid: number; booking: Booking };

export type Credentials = { username: string; password: string };
