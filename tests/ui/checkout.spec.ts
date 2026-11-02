import { expect, test } from '@playwright/test';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { LoginPage } from '../../pages/LoginPage';

const PRODUCTS = ['Sauce Labs Backpack', 'Sauce Labs Bike Light'];

test('standard_user can check out two products and the item total matches their prices', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const inventoryPage = new InventoryPage(page);
  const cartPage = new CartPage(page);
  const checkoutPage = new CheckoutPage(page);

  await test.step('log in', async () => {
    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');
    await expect(inventoryPage.title).toHaveText('Products');
  });

  let expectedTotal = 0;
  await test.step('add products to the cart', async () => {
    for (const product of PRODUCTS) {
      expectedTotal += await inventoryPage.priceOf(product);
      await inventoryPage.addToCart(product);
    }
    await expect(inventoryPage.cartBadge).toHaveText(String(PRODUCTS.length));
  });

  await test.step('check out', async () => {
    await inventoryPage.openCart();
    await expect(cartPage.itemNames).toHaveText(PRODUCTS);
    await cartPage.checkout();
    await checkoutPage.fillInformation({ firstName: 'Test', lastName: 'User', postalCode: '12345' });
  });

  await test.step('item total equals the sum of the product prices', async () => {
    expect(await checkoutPage.itemTotal()).toBe(expectedTotal);
  });

  await test.step('finish the order', async () => {
    await checkoutPage.finish();
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
  });
});
