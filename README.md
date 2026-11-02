# Playwright + TypeScript take-home

Requires Node.js 20 or newer (the minimum for Playwright 1.64, which meets the brief's "Node 18 or newer").

```bash
npm install
npx playwright install chromium
npm test            # both tests
npm run test:ui     # Task 1: saucedemo checkout
npm run test:api    # Task 2: Restful-booker booking
npm run typecheck
```

## Layout

| Path | Purpose |
| --- | --- |
| `playwright.config.ts` | Two projects: `ui` (saucedemo, `data-test` as test id) and `api` (Restful-booker, JSON `Accept` header) |
| `pages/` | Page Objects: `LoginPage`, `InventoryPage`, `CartPage`, `CheckoutPage` |
| `utils/price.ts` | Parses `$29.99` into integer cents so sums are exact |
| `tests/ui/checkout.spec.ts` | Task 1 |
| `tests/api/booking.spec.ts` | Task 2 |

## Notes

- **Task 1:** each product's price is read from the inventory page as it is added. The test then checks that the overview's `Item total` equals their sum. It waits only through web-first assertions and auto-waiting locators, with no `waitForTimeout`.
- **Task 2:** the GET response is compared to the sent payload with a deep `toEqual`, so any changed, missing or extra field fails the test. The last name is unique per run, which makes the booking easy to find on the shared public API.
