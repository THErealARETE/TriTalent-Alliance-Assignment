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
npm run report           # open Playwright's HTML report from the last run
npm run allure:generate  # build the Allure report from the last run
npm run allure:open      # open the Allure report
```

## Layout

| Path                        | Purpose                                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `playwright.config.ts`      | Reporters (list, HTML, Allure), CI retries, and two projects: `ui` (saucedemo, `data-test` as test id) and `api` (Restful-booker, JSON `Accept` header) |
| `pages/`                    | One Page Object per screen: login, inventory, cart, checkout information, overview and complete                                                         |
| `fixtures/pages.ts`         | Extends `test` so specs receive page objects as fixtures                                                                                                |
| `utils/price.ts`            | Parses `$29.99` into integer cents so sums are exact                                                                                                    |
| `tests/ui/checkout.spec.ts` | Task 1                                                                                                                                                  |
| `tests/api/booking.spec.ts` | Task 2                                                                                                                                                  |

## Notes

- **Task 1:** each product's price is read from the inventory page as it is added. The test then checks that the overview's `Item total` equals their sum. It waits only through web-first assertions and auto-waiting locators, with no `waitForTimeout`.
- **Task 2:** the GET response is compared to the sent payload with a deep `toEqual`, so any changed, missing or extra field fails the test. The last name is unique per run, which makes the booking easy to find on the shared public API.

## Extras

### Retries: built in, at the right level

Playwright already retries at three levels, so there is no custom retry helper. A hand-written `retry(fn)` wrapper usually duplicates these, and it hides real defects by re-running whatever fails.

| Level              | Mechanism                                                                                          | Used here                   | Value                                                                                                                                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Assertion / action | Auto-waiting locators and web-first assertions (`toHaveText`, `toBeVisible`) retry until a timeout | Every UI step               | Handles timing in the UI without fixed waits. This is why the suite has no `waitForTimeout`.                                                                                                                                      |
| Network            | `maxRetries` on API requests                                                                       | `tests/api/booking.spec.ts` | Retries only dropped connections (`ECONNRESET`) to the shared public API. HTTP error statuses are never retried, so a real `4xx`/`5xx` still fails.                                                                               |
| Whole test         | `retries` in `playwright.config.ts`: 2 in CI, 0 locally                                            | All tests                   | Absorbs transient infrastructure failures in CI. A test that passes only on retry is labelled **flaky** by Playwright and listed under **retries** in Allure, so flakiness is surfaced, not hidden. Locally it fails immediately. |

For data that becomes correct only after a delay, such as an asynchronously processed record, the right tool is `expect.poll()` or `expect(...).toPass()`. Neither app needs it, so it isn't used.

### Allure reporting

`allure-playwright` writes results to `allure-results/` on every run, alongside the built-in HTML report. `npm run allure:generate` turns them into a report in `allure-report/`.

Value:

- **Readable steps.** `test.step()` names (log in, add products, check out…) appear as the steps of each test, so a non-developer can see where a run failed.
- **Evidence attached.** Failure screenshots and traces are attached to the failing test.
- **Retried tests are shown separately** from clean passes, which pairs with the CI retries above.
- **Trends over time.** Kept between runs (for example as a CI artifact), the history shows pass rate and duration trends across builds.

The Allure 3 CLI runs on Node, so no Java is needed. Its dependencies (`dompurify`, `glob`, `minimatch`) had published advisories, so `package.json` pins patched versions through npm `overrides`, and `npm audit` reports 0 vulnerabilities.

## Defects and questionable behaviour

Both were reproduced on 2026-11-02.

### 1. Restful-booker accepts invalid booking dates and stores corrupted values

**Severity:** High. Invalid data is saved silently, and every client that reads the booking gets impossible or unparseable dates.

**Steps**

1. Send `POST https://restful-booker.herokuapp.com/booking` with headers `Content-Type: application/json` and `Accept: application/json`, and this body:
   ```json
   {
     "firstname": "a",
     "lastname": "b",
     "totalprice": 1,
     "depositpaid": true,
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
