import { env } from '../../config/env';
import { expect, test } from '../../fixtures';
import { CUSTOMER, PRODUCTS } from '../../test-data/checkout';

test('a standard user can check out two products and the item total matches their prices', async ({
  loginPage,
  inventoryPage,
  cartPage,
  checkoutInformationPage,
  checkoutOverviewPage,
  checkoutCompletePage,
}) => {
  await test.step('log in', async () => {
    await loginPage.goto();
    await loginPage.login(env.sauce.credentials);
    await expect(inventoryPage.title).toHaveText('Products');
  });

  let expectedTotal = 0;

  await test.step('add products to the cart', async () => {
    for (const product of PRODUCTS) {
      expectedTotal += await inventoryPage.priceOf(product);
      await inventoryPage.addToCart(product);
    }
    await expect(inventoryPage.header.cartBadge).toHaveText(String(PRODUCTS.length));
  });

  await test.step('check out', async () => {
    await inventoryPage.header.openCart();
    await expect(cartPage.itemNames).toHaveText(PRODUCTS);
    await cartPage.checkout();
    await checkoutInformationPage.submit(CUSTOMER);
  });

  await test.step('item total equals the sum of the product prices', async () => {
    expect(await checkoutOverviewPage.itemTotal()).toBe(expectedTotal);
  });

  await test.step('finish the order', async () => {
    await checkoutOverviewPage.finish();
    await expect(checkoutCompletePage.header).toHaveText('Thank you for your order!');
  });
});
