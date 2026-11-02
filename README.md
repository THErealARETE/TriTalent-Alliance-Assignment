# Playwright + TypeScript take-home

UI tests for [saucedemo](https://www.saucedemo.com) and API tests for [Restful-booker](https://restful-booker.herokuapp.com), written as a small, production-style test framework.

## Install and run

Requires Node.js 20.12 or newer. CI uses Node 24 LTS, pinned in `.nvmrc`.

```bash
npm install && npx playwright install chromium && cp .env.example .env && npm test
```

`.env.example` holds the public demo credentials each application publishes, so the copied `.env` works as is.

Other scripts:

```bash
npm run test:ui          # Task 1 only: saucedemo checkout
npm run test:api         # Task 2 only: Restful-booker booking
npm run check            # typecheck + lint + format check (what CI runs before the tests)
npm run format           # apply Prettier formatting
npm run report           # open Playwright's HTML report from the last run
npm run allure:generate  # build the Allure report from the last run
npm run allure:open      # open the Allure report
```

## Configuration and secrets

- **Real values in `.env`.** URLs and credentials live in `.env`, which is gitignored. `.env.example` is committed and lists every variable.
- **One typed config module.** `config/env.ts` loads `.env` with Node's built-in `process.loadEnvFile` (no `dotenv` dependency), checks every variable is present and URLs are valid, and exposes one frozen, typed `env` object. Code never reads `process.env` directly.
- **Fails fast.** A missing variable stops the run before any test starts, with a message saying what's missing and how to fix it.
- **CI-ready.** Real environment variables override `.env`. In CI, credentials come from repository secrets and URLs from repository variables. The same code runs against another environment just by changing variables.

## Architecture

```
config/env.ts                 typed, validated environment config
pages/                        one Page Object per screen
components/HeaderComponent.ts header shared by every logged-in page (cart link, badge)
api/BookingClient.ts          API client for /booking: create, get, delete created bookings
api/readJson.ts               the one place a response body is cast to a type
api/types.ts                  Booking request/response types
fixtures/                     page-object and API fixtures, merged in fixtures/index.ts
test-data/                    test data and the buildBooking() factory
utils/price.ts                "$29.99" -> 2999 cents, so sums are exact
tests/ui, tests/api           the specs; one Playwright project each
```

Design decisions:

- **Page objects** keep their locators private and expose actions such as `login()` and `addToCart()`. The specs make all the pass/fail checks. The one exception is `addToCart()`, which waits for the button to change to "Remove" so the cart has updated before the next action.
- **Composition for shared UI.** The header appears on every logged-in page, so it is a component that page objects include, not a `BasePage` they inherit from.
- **Fixtures, not `new`.** Specs ask for `loginPage` or `bookingClient` as fixtures. A `pageObject()` factory builds every page-object fixture from one definition, and `mergeTests` gives specs a single import.
- **API client returns raw responses**, so the status and body checks stay visible in the test. It holds the network-retry setting in one place.
- **No test data left behind.** Every booking created through `bookingClient` is deleted in the fixture's teardown with the admin credentials, even when the test fails. A cleanup failure fails the run rather than being ignored.
- **Test data is built, not copied.** `buildBooking(overrides)` returns a valid booking with a unique last name, and a test overrides only the fields it cares about.
- **Prices in integer cents**, so two prices add up exactly, with no floating-point rounding.

## Quality gates

- **TypeScript in strict mode.** It is pinned to 6.0 because `typescript-eslint` doesn't support 7.x yet.
- **ESLint with type-aware rules.** `no-floating-promises` catches a missing `await`, the most common cause of flaky Playwright tests. `eslint-plugin-playwright` adds checks specific to Playwright, such as flagging fixed waits.
- **Prettier** formats the code; ESLint stays out of formatting.
- **CI** (`.github/workflows/playwright.yml`) runs the checks and both test projects on every push and pull request, then uploads the Playwright and Allure reports. Before the first run, set the repository secrets `SAUCE_USERNAME`, `SAUCE_PASSWORD`, `BOOKER_USERNAME` and `BOOKER_PASSWORD`.
- **`npm audit` reports 0 vulnerabilities.** npm `overrides` pin patched versions of three dependencies pulled in by the Allure CLI.

## Notes on the tasks

- **Task 1:** each product's price is read from the inventory page as it is added. The test then checks that the overview's `Item total` equals their sum. It waits only through web-first assertions and auto-waiting locators, with no `waitForTimeout`.
- **Task 2:** the GET response is compared to the sent payload with a deep `toEqual`, so any changed, missing or extra field fails the test.

## Retries: built in, at the right level

Playwright already retries at three levels, so there is no custom retry helper. A hand-written `retry(fn)` wrapper usually duplicates these, and it hides real defects by re-running whatever fails.

- **Assertions and actions:** locators wait for elements, and web-first assertions (`toHaveText`, `toBeVisible`) retry until a timeout. Used in every UI step. This handles UI timing without fixed waits.
- **Network:** `maxRetries` in `BookingClient` retries only dropped connections (`ECONNRESET`) to the shared public API. HTTP error statuses are never retried, so a real `4xx`/`5xx` still fails.
- **Whole test:** `retries` in `playwright.config.ts` is 2 in CI and 0 locally. It absorbs transient infrastructure failures in CI. A test that passes only on retry is labelled **flaky** by Playwright and listed under **retries** in Allure, so flakiness is surfaced, not hidden.

For data that becomes correct only after a delay, such as an asynchronously processed record, the right tool is `expect.poll()` or `expect(...).toPass()`. Neither app needs it, so it isn't used.

## Allure reporting

`allure-playwright` writes results to `allure-results/` on every run, alongside the built-in HTML report. `npm run allure:generate` turns them into a report in `allure-report/`.

- **Readable steps.** `test.step()` names (log in, add products, check out…) appear as the steps of each test, so a non-developer can see where a run failed.
- **Evidence attached.** Failure screenshots and traces are attached to the failing test.
- **Retried tests are shown separately** from clean passes, which pairs with the CI retries above.
- **Trends over time.** Kept between runs (for example as a CI artifact), the history shows pass rate and duration trends across builds.

The Allure 3 CLI runs on Node, so no Java is needed.

## Scaling further

Deliberately not added for two tests, but the next steps as the suite grows:

- **Log in once per worker.** A setup project logs in once and saves the session (`storageState`). UI tests that aren't about login then skip the login form.
- **Runtime schema validation.** Validate API responses against a schema (for example with zod) at runtime, in addition to the compile-time types.
- **More browsers.** Add `firefox` and `webkit` projects once the suite needs cross-browser coverage.

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
