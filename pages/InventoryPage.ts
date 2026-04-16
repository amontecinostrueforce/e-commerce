import { Page, Locator } from '@playwright/test';

export class InventoryPage {
  readonly page: Page;
  readonly title: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('.title');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.cartLink = page.locator('.shopping_cart_link');
  }

  async goto() {
    await this.page.goto('/inventory.html');
  }

  async addProductToCart(productName: string) {
    const normalizedName = productName.toLowerCase().replace(/\s+/g, '-');
    await this.page
      .locator(`[data-test="add-to-cart-${normalizedName}"]`)
      .click();
  }

  async goToCart() {
    await this.cartLink.click();
  }

  async getCartCount(): Promise<string> {
    return this.cartBadge.innerText();
  }
}
