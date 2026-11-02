import { type Locator, type Page } from '@playwright/test';
import { toCents } from '../utils/price';

/** Covers the three checkout screens: your information, overview and complete. */
export class CheckoutPage {
  private readonly firstName: Locator;
  private readonly lastName: Locator;
  private readonly postalCode: Locator;
  private readonly continueButton: Locator;
  private readonly finishButton: Locator;
  private readonly subtotalLabel: Locator;
  readonly completeHeader: Locator;

  constructor(page: Page) {
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.finishButton = page.getByTestId('finish');
    this.subtotalLabel = page.getByTestId('subtotal-label');
    this.completeHeader = page.getByTestId('complete-header');
  }

  async fillInformation(info: { firstName: string; lastName: string; postalCode: string }): Promise<void> {
    await this.firstName.fill(info.firstName);
    await this.lastName.fill(info.lastName);
    await this.postalCode.fill(info.postalCode);
    await this.continueButton.click();
  }

  /** Reads "Item total: $X.XX" from the overview screen, in cents. */
  async itemTotal(): Promise<number> {
    return toCents(await this.subtotalLabel.innerText());
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }
}
