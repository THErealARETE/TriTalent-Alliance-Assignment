# Playwright + TypeScript take-home

## Install and run

Requires Node.js 20 or newer (the minimum for Playwright 1.64, which meets the brief's "Node 18 or newer").

```bash
npm install && npx playwright install chromium && npm test
```

Other scripts:

```bash
npm run test:ui     # Task 1 only: saucedemo checkout
npm run test:api    # Task 2 only: Restful-booker booking
npm run typecheck   # TypeScript check, no emit
npm run report      # open the HTML report from the last run
```

## Layout

| Path | Purpose |
| --- | --- |
| `playwright.config.ts` | Two projects: `ui` (saucedemo, `data-test` as test id) and `api` (Restful-booker, JSON `Accept` header) |
| `pages/` | One Page Object per screen: login, inventory, cart, checkout information, overview and complete |
| `fixtures/pages.ts` | Extends `test` so specs receive page objects as fixtures |
| `utils/price.ts` | Parses `$29.99` into integer cents so sums are exact |
| `tests/ui/checkout.spec.ts` | Task 1 |
| `tests/api/booking.spec.ts` | Task 2 |

## Notes

- **Task 1:** each product's price is read from the inventory page as it is added. The test then checks that the overview's `Item total` equals their sum. It waits only through web-first assertions and auto-waiting locators, with no `waitForTimeout`.
- **Task 2:** the GET response is compared to the sent payload with a deep `toEqual`, so any changed, missing or extra field fails the test. The last name is unique per run, which makes the booking easy to find on the shared public API.

## Defects and questionable behaviour

Both were reproduced on 2026-11-02.

### 1. Restful-booker accepts invalid booking dates and stores corrupted values

**Severity:** High. Invalid data is saved silently, and every client that reads the booking gets impossible or unparseable dates.

**Steps**

1. Send `POST https://restful-booker.herokuapp.com/booking` with headers `Content-Type: application/json` and `Accept: application/json`, and this body:
   ```json
   {
     "firstname": "a", "lastname": "b", "totalprice": 1, "depositpaid": true,
     "bookingdates": { "checkin": "2026-12-10", "checkout": "2026-12-01" }
   }
   ```
2. Repeat with `"checkin": "not-a-date"`.

**Expected:** `400 Bad Request` for both, because check-out is before check-in in the first and the date can't be parsed in the second. No booking is created.

**Actual:** `200 OK` for both, and a booking id is returned. The first booking is stored with check-out 9 days before check-in. The second is stored with `"checkin": "0NaN-aN-aN"`.

Related behaviour seen while probing: `totalprice: -50` is accepted. `totalprice: "abc"` is saved as `null`. A body without `firstname` returns `500 Internal Server Error` rather than `400`. A request with no `Accept` header returns `418 I'm a Teapot`.

### 2. saucedemo lets you place an order with an empty cart

**Severity:** Medium. No money changes hands, but the shop creates $0.00 orders and tells the user "Thank you for your order!", which is misleading and pollutes order data.

**Steps**

1. Log in at https://www.saucedemo.com as `standard_user` / `secret_sauce`.
2. Without adding any product, open the cart (top-right icon) and click **Checkout**.
3. Enter any first name, last name and postal code, then click **Continue**.
4. Click **Finish**.

**Expected:** **Checkout** is disabled or shows an error such as "Your cart is empty", and no order can be placed.

**Actual:** Checkout proceeds through every step. The overview shows `Item total: $0` and `Total: $0.00`, and the order completes with "Thank you for your order!".

Related behaviour: the customer fields accept any text (for example postal code `abc`, first name `!!!`). The overview also formats the item total as `$0` but the total as `$0.00`.
