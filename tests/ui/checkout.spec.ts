import { expect, test } from '../../fixtures/pages';

const USER = { username: 'standard_user', password: 'secret_sauce' };
const CUSTOMER = { firstName: 'Test', lastName: 'User', postalCode: '12345' };
const PRODUCTS = ['Sauce Labs Backpack', 'Sauce Labs Bike Light'];

test('standard_user can check out two products and the item total matches their prices', async ({
  loginPage,
  inventoryPage,
  cartPage,
  checkoutInformationPage,
  checkoutOverviewPage,
  checkoutCompletePage,
}) => {
  await test.step('log in', async () => {
    await loginPage.goto();
    await loginPage.login(USER.username, USER.password);
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
