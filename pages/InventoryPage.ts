import { expect, type Locator, type Page } from '@playwright/test';
import { toCents } from '../utils/price';

export class InventoryPage {
  readonly title: Locator;
  readonly cartBadge: Locator;
  private readonly cartLink: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.cartLink = page.getByTestId('shopping-cart-link');
  }

  private item(name: string): Locator {
    return this.page.getByTestId('inventory-item').filter({
      has: this.page.getByTestId('inventory-item-name').getByText(name, { exact: true }),
    });
  }

  /** Reads the product's price as shown on the page, in cents. */
  async priceOf(name: string): Promise<number> {
    const text = await this.item(name).getByTestId('inventory-item-price').innerText();
    return toCents(text);
  }

  async addToCart(name: string): Promise<void> {
    const item = this.item(name);
    await item.getByRole('button', { name: 'Add to cart' }).click();
    await expect(item.getByRole('button', { name: 'Remove' })).toBeVisible();
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }
}
