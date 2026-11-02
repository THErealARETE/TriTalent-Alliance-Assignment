import { type Locator, type Page } from '@playwright/test';

export type CustomerInformation = { firstName: string; lastName: string; postalCode: string };

/** Checkout step one: "Your Information". */
export class CheckoutInformationPage {
  private readonly firstName: Locator;
  private readonly lastName: Locator;
  private readonly postalCode: Locator;
  private readonly continueButton: Locator;

  constructor(page: Page) {
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
  }

  async submit(info: CustomerInformation): Promise<void> {
    await this.firstName.fill(info.firstName);
    await this.lastName.fill(info.lastName);
    await this.postalCode.fill(info.postalCode);
    await this.continueButton.click();
  }
}
