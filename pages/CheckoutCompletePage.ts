import { type Locator, type Page } from '@playwright/test';

/** Final checkout screen: "Complete!". */
export class CheckoutCompletePage {
  readonly header: Locator;

  constructor(page: Page) {
    this.header = page.getByTestId('complete-header');
  }
}
