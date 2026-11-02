import { expect, type Locator, type Page } from '@playwright/test';
import { HeaderComponent } from '../components/HeaderComponent';
import { toCents } from '../utils/price';

export class InventoryPage {
  readonly header: HeaderComponent;
  readonly title: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.title = page.getByTestId('title');
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
    // Wait for the cart to register the item before the next action.
    await expect(item.getByRole('button', { name: 'Remove' })).toBeVisible();
  }
}
