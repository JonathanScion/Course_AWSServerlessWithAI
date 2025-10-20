const { test, expect } = require('@playwright/test');

test.describe('Contractor Pay Calculator - Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should successfully calculate bi-weekly pay with valid input', async ({ page }) => {
    // Mock the API response
    await page.route('**/api/calculate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          hourlyRate: '50',
          biweeklyPay: '2600.00'
        }),
      });
    });

    const input = page.locator('input[type="text"]');
    const button = page.locator('button[type="submit"]');

    await input.fill('50');
    await button.click();

    // Check loading state
    await expect(button).toHaveText('Calculating...');
    await expect(button).toBeDisabled();

    // Wait for results to appear
    await expect(page.locator('h2:has-text("Results")')).toBeVisible({ timeout: 5000 });

    // Verify results
    await expect(page.locator('text=/Hourly Rate: \\$50/')).toBeVisible();
    await expect(page.locator('text=/80 hours \\(2 weeks\\)/')).toBeVisible();
    await expect(page.locator('text=/After 35% taxes:/')).toBeVisible();
    await expect(page.locator('h3:has-text("Bi-weekly Pay: $2600.00")')).toBeVisible();
  });

  test('should display error message when API returns error', async ({ page }) => {
    // Mock the API to return an error
    await page.route('**/api/calculate', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid hourly rate'
        }),
      });
    });

    const input = page.locator('input[type="text"]');
    const button = page.locator('button[type="submit"]');

    await input.fill('invalid');
    await button.click();

    // Wait for error message
    await expect(page.locator('text=/Error: Invalid hourly rate/')).toBeVisible({ timeout: 5000 });

    // Results should not be visible
    await expect(page.locator('h2:has-text("Results")')).not.toBeVisible();
  });

  test('should handle network error gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/calculate', async (route) => {
      await route.abort('failed');
    });

    const input = page.locator('input[type="text"]');
    const button = page.locator('button[type="submit"]');

    await input.fill('50');
    await button.click();

    // Wait for error message
    await expect(page.locator('div:has-text("Error:")')).toBeVisible({ timeout: 5000 });
  });

  test('should clear previous results when submitting new calculation', async ({ page }) => {
    // First calculation
    await page.route('**/api/calculate', async (route) => {
      const request = route.request();
      const postData = JSON.parse(request.postData());

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          hourlyRate: postData.hourlyRate,
          biweeklyPay: (parseFloat(postData.hourlyRate) * 80 * 0.65).toFixed(2)
        }),
      });
    });

    const input = page.locator('input[type="text"]');
    const button = page.locator('button[type="submit"]');

    // First submission
    await input.fill('50');
    await button.click();
    await expect(page.locator('h3:has-text("Bi-weekly Pay: $2600.00")')).toBeVisible();

    // Second submission
    await input.fill('100');
    await button.click();

    // Old result should be replaced
    await expect(page.locator('h3:has-text("Bi-weekly Pay: $5200.00")')).toBeVisible();
    await expect(page.locator('h3:has-text("Bi-weekly Pay: $2600.00")')).not.toBeVisible();
  });

  test('should calculate correctly for different hourly rates', async ({ page }) => {
    await page.route('**/api/calculate', async (route) => {
      const request = route.request();
      const postData = JSON.parse(request.postData());
      const hourlyRate = parseFloat(postData.hourlyRate);
      const biweeklyPay = (hourlyRate * 80 * 0.65).toFixed(2);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          hourlyRate: postData.hourlyRate,
          biweeklyPay: biweeklyPay
        }),
      });
    });

    const testCases = [
      { rate: '25', expected: '$1300.00' },
      { rate: '75', expected: '$3900.00' },
      { rate: '100', expected: '$5200.00' },
    ];

    for (const testCase of testCases) {
      const input = page.locator('input[type="text"]');
      const button = page.locator('button[type="submit"]');

      await input.clear();
      await input.fill(testCase.rate);
      await button.click();

      await expect(page.locator(`h3:has-text("Bi-weekly Pay: ${testCase.expected}")`))
        .toBeVisible({ timeout: 5000 });
    }
  });

  test('should send correct API request with headers', async ({ page }) => {
    let apiRequestReceived = false;
    let requestHeaders = null;
    let requestBody = null;

    await page.route('**/api/calculate', async (route) => {
      apiRequestReceived = true;
      requestHeaders = route.request().headers();
      requestBody = JSON.parse(route.request().postData());

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          hourlyRate: '50',
          biweeklyPay: '2600.00'
        }),
      });
    });

    const input = page.locator('input[type="text"]');
    const button = page.locator('button[type="submit"]');

    await input.fill('50');
    await button.click();

    await expect(page.locator('h2:has-text("Results")')).toBeVisible({ timeout: 5000 });

    // Verify API was called
    expect(apiRequestReceived).toBe(true);
    expect(requestHeaders['content-type']).toContain('application/json');
    expect(requestBody).toEqual({ hourlyRate: '50' });
  });
});
