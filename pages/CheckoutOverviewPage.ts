import { type Locator, type Page } from '@playwright/test';
import { toCents } from '../utils/price';

/** Checkout step two: "Overview". */
export class CheckoutOverviewPage {
  private readonly subtotalLabel: Locator;
  private readonly finishButton: Locator;

  constructor(page: Page) {
    this.subtotalLabel = page.getByTestId('subtotal-label');
    this.finishButton = page.getByTestId('finish');
  }

  /** Reads "Item total: $X.XX", in cents. */
  async itemTotal(): Promise<number> {
    return toCents(await this.subtotalLabel.innerText());
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }
}
