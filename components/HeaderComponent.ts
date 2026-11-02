import { type Locator, type Page } from '@playwright/test';

/** The header shared by every logged-in page: cart link and item-count badge. */
export class HeaderComponent {
  readonly cartBadge: Locator;
  private readonly cartLink: Locator;

  constructor(page: Page) {
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.cartLink = page.getByTestId('shopping-cart-link');
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }
}
