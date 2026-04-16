import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

// ─────────────────────────────────────────────────────────────
// Suite 1: Login
// storageState is already loaded, but we verify the session is valid
// ─────────────────────────────────────────────────────────────
test.describe('Login', () => {
  test('should land on Products page when already authenticated', async ({ page }) => {
    const inventory = new InventoryPage(page);
    await inventory.goto();
    await expect(page).toHaveURL(/inventory/);
    await expect(inventory.title).toHaveText('Products');
  });

  test('should show error for locked-out user', async ({ page }) => {
    // This test intentionally uses a fresh context (no storageState override needed
    // because it navigates to login and fills credentials manually)
    const login = new LoginPage(page);
    await login.goto();
    await login.login('locked_out_user', 'secret_sauce');
    await expect(login.errorMessage).toBeVisible();
    await expect(login.errorMessage).toContainText('locked out');
  });
});

// ─────────────────────────────────────────────────────────────
// Suite 2: Add products to cart
// ─────────────────────────────────────────────────────────────
test.describe('Cart', () => {
  test('should add a product to the cart', async ({ page }) => {
    const inventory = new InventoryPage(page);
    await inventory.goto();

    await inventory.addProductToCart('sauce-labs-backpack');
    await expect(inventory.cartBadge).toHaveText('1');
  });

  test('should add multiple products and reflect correct count', async ({ page }) => {
    const inventory = new InventoryPage(page);
    await inventory.goto();

    await inventory.addProductToCart('sauce-labs-backpack');
    await inventory.addProductToCart('sauce-labs-bike-light');
    await expect(inventory.cartBadge).toHaveText('2');
  });

  test('should display added products in cart page', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);

    await inventory.goto();
    await inventory.addProductToCart('sauce-labs-backpack');
    await inventory.goToCart();

    await expect(page).toHaveURL(/cart/);
    await expect(cart.title).toHaveText('Your Cart');
    expect(await cart.getItemCount()).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────
// Suite 3: Full checkout flow
// ─────────────────────────────────────────────────────────────
test.describe('Checkout', () => {
  test('should complete full purchase flow', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);

    // Add product
    await inventory.goto();
    await inventory.addProductToCart('sauce-labs-backpack');

    // Go to cart
    await inventory.goToCart();
    await expect(cart.title).toHaveText('Your Cart');

    // Proceed to checkout
    await cart.checkout();
    await expect(page).toHaveURL(/checkout-step-one/);

    // Fill shipping info
    await checkout.fillShippingInfo('John', 'Doe', '12345');
    await expect(page).toHaveURL(/checkout-step-two/);

    // Confirm order
    await checkout.finish();
    await expect(page).toHaveURL(/checkout-complete/);
    await expect(checkout.confirmationTitle).toHaveText('Thank you for your order!');
    await expect(checkout.confirmationMessage).toContainText('Your order has been dispatched');
  });

  test('should not proceed if shipping info is missing', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);

    await inventory.goto();
    await inventory.addProductToCart('sauce-labs-backpack');
    await inventory.goToCart();
    await cart.checkout();

    // Click continue without filling the form
    await page.locator('[data-test="continue"]').click();
    const error = page.locator('[data-test="error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText('First Name is required');
  });
});

// ─────────────────────────────────────────────────────────────
// Suite 4: Intentional failure (for trace.zip demo)
// ─────────────────────────────────────────────────────────────
test.describe('Intentional Failure (Trace Demo)', () => {
  test('DEMO: should fail to expose Playwright trace capabilities', async ({ page }) => {
    const inventory = new InventoryPage(page);
    await inventory.goto();

    // Intentionally wrong assertion — expects wrong badge count after adding 1 item
    await inventory.addProductToCart('sauce-labs-backpack');
    await expect(inventory.cartBadge).toHaveText('99', {
      timeout: 5000,
    });
  });
});
