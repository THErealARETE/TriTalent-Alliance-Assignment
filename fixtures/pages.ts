import { test as base, type Page } from '@playwright/test';
import { CartPage } from '../pages/CartPage';
import { CheckoutCompletePage } from '../pages/CheckoutCompletePage';
import { CheckoutInformationPage } from '../pages/CheckoutInformationPage';
import { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';
import { InventoryPage } from '../pages/InventoryPage';
import { LoginPage } from '../pages/LoginPage';

type PageFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutInformationPage: CheckoutInformationPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutCompletePage: CheckoutCompletePage;
};

/** Builds a fixture that hands the test a page object bound to the test's page. */
function pageObject<T>(PageObject: new (page: Page) => T) {
  return async ({ page }: { page: Page }, use: (pageObject: T) => Promise<void>) => {
    await use(new PageObject(page));
  };
}

export const test = base.extend<PageFixtures>({
  loginPage: pageObject(LoginPage),
  inventoryPage: pageObject(InventoryPage),
  cartPage: pageObject(CartPage),
  checkoutInformationPage: pageObject(CheckoutInformationPage),
  checkoutOverviewPage: pageObject(CheckoutOverviewPage),
  checkoutCompletePage: pageObject(CheckoutCompletePage),
});
