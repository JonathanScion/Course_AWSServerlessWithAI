# Playwright E2E Testing Guide

## Overview

This project uses [Playwright](https://playwright.dev/) for end-to-end testing of the Contractor Pay Calculator application.

## Test Structure

**calculator.spec.js** - Main functionality tests with mocked API responses:
- Successful calculation with valid input
- Error handling for invalid input
- Network error handling
- Multiple calculations with different rates
- API request verification (headers, body)
- State management (clearing previous results)

## Testing Methodology

### API Mocking Strategy
The tests use Playwright's route interception to mock API responses. This approach provides:

1. **Isolation**: Tests run independently of the backend API
2. **Speed**: No network latency, faster test execution
3. **Reliability**: Consistent results without external dependencies
4. **Control**: Ability to test error scenarios and edge cases

Example:
```javascript
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
```

### Test Organization
- **describe blocks**: Group related tests by feature area
- **beforeEach hooks**: Navigate to the page before each test
- **Isolated tests**: Each test is independent and can run in any order

### Assertions
Tests use Playwright's built-in expect assertions:
- `toBeVisible()`: Verify element visibility
- `toHaveText()`: Verify exact text content
- `toHaveValue()`: Verify input values
- `toBeEnabled()/toBeDisabled()`: Verify button states
- `toBeFocused()`: Verify focus states

## Installation

Playwright is already installed as a dev dependency. If you need to reinstall:

```bash
npm install -D @playwright/test
```

Install browsers:

```bash
npx playwright install chromium
```

## Running Tests

### Run all tests (headless mode)
```bash
npm run test:e2e
```

### Run tests with UI mode (interactive)
```bash
npm run test:e2e:ui
```

This opens the Playwright UI where you can:
- See all tests
- Run individual tests
- Watch tests execute in real-time
- Time travel through test steps
- View screenshots and traces

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Debug tests
```bash
npm run test:e2e:debug
```

This opens the Playwright Inspector for step-by-step debugging.

### View test report
```bash
npm run test:e2e:report
```

Opens an HTML report of the last test run.

## Running Specific Tests

### Run a specific test file
```bash
npx playwright test app.spec.js
```

### Run tests matching a pattern
```bash
npx playwright test --grep "calculate"
```

### Run a single test
```bash
npx playwright test --grep "should display the page title"
```

## Configuration

The Playwright configuration is in `playwright.config.js`:

- **Base URL**: `http://localhost:3000` (or set `PLAYWRIGHT_TEST_BASE_URL`)
- **Browsers**: Chromium (can add Firefox, WebKit)
- **Retries**: 2 retries in CI, 0 locally
- **Screenshots**: Captured on test failure
- **Trace**: Captured on first retry
- **Web Server**: Automatically starts the React app before tests

## CI/CD Integration

The tests are configured to run in CI environments:

- Retries enabled for flaky test detection
- Single worker for consistent results
- Automatic dev server startup
- HTML report generation

To integrate into your CI pipeline:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium

- name: Run Playwright tests
  run: npm run test:e2e
```

## Best Practices

1. **Use Data Test IDs**: For stable selectors (optional enhancement)
2. **Keep Tests Independent**: Each test should work in isolation
3. **Mock External APIs**: Use route interception for consistent results
4. **Test User Flows**: Focus on real user scenarios
5. **Use Meaningful Assertions**: Verify actual functionality, not implementation
6. **Maintain Visual Tests**: Update snapshots when UI intentionally changes

## Troubleshooting

### Tests fail due to timeout
Increase timeout in test or config:
```javascript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

### Visual tests fail
Update snapshots after intentional UI changes:
```bash
npx playwright test --update-snapshots
```

### Port already in use
Change the port in `playwright.config.js` webServer config or stop the process using port 3000.

### Browser not installed
```bash
npx playwright install chromium
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
