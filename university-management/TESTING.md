# Playwright Testing Guide

This guide covers how to run E2E tests for the University Management System using Playwright.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Running Tests](#running-tests)
4. [Command Line Options](#command-line-options)
5. [Test Reports](#test-reports)
6. [Debugging Tests](#debugging-tests)
7. [Writing New Tests](#writing-new-tests)
8. [CI/CD Integration](#cicd-integration)

---

## Prerequisites

Before running tests, ensure you have:

1. **Node.js** installed (v16 or higher)
2. **PostgreSQL** database running
3. **Backend server** running on `http://localhost:5000`
4. **Frontend client** running on `http://localhost:3000`

### Starting the Application

```bash
# Terminal 1: Start the PostgreSQL database
# (Make sure PostgreSQL is running)

# Terminal 2: Start the backend server
cd university-management/server
npm install
npm run dev

# Terminal 3: Start the frontend client
cd university-management/client
npm install
npm start

# Terminal 4: Run tests
cd university-management
npm test
```

---

## Installation

Playwright is already configured in this project. If you need to reinstall:

```bash
cd university-management
npm install
```

To install Playwright browsers (first time only):

```bash
npx playwright install
```

To install only Chromium (recommended for faster setup):

```bash
npx playwright install chromium
```

---

## Running Tests

### Basic Test Execution

Run all tests (headless mode):
```bash
npm test
```

Run all tests with browser visible (headed mode):
```bash
npm run test:headed
```

Run specific test file:
```bash
npm run test:departments
```

Or directly with Playwright:
```bash
npx playwright test tests/departments.spec.js
```

### Interactive UI Mode (Recommended for Development)

Run tests in interactive UI mode:
```bash
npm run test:ui
```

This opens a browser-based UI where you can:
- Run tests individually
- See test results in real-time
- Debug failed tests
- View screenshots and videos
- Re-run tests on file changes

---

## Command Line Options

### Common Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--headed` | Run tests in headed mode (browser visible) | `npm test -- --headed` |
| `--debug` | Run tests in debug mode with Playwright Inspector | `npm run test:debug` |
| `--ui` | Run tests in interactive UI mode | `npm run test:ui` |
| `--project=<name>` | Run tests on specific browser | `npm run test:chromium` |
| `--grep=<pattern>` | Run tests matching a pattern | `npm test -- --grep="CREATE"` |
| `--grep-invert=<pattern>` | Run tests NOT matching a pattern | `npm test -- --grep-invert="DELETE"` |
| `--workers=<n>` | Number of parallel workers | `npm test -- --workers=2` |
| `--retries=<n>` | Number of retries for failed tests | `npm test -- --retries=2` |
| `--max-failures=<n>` | Stop after N failures | `npm test -- --max-failures=3` |
| `--reporter=<reporter>` | Specify reporter | `npm test -- --reporter=list` |
| `--update-snapshots` | Update visual snapshots | `npm test -- --update-snapshots` |

### Examples

**Run only CREATE and UPDATE tests:**
```bash
npm test -- --grep="CREATE|UPDATE"
```

**Run all tests except DELETE:**
```bash
npm test -- --grep-invert="DELETE"
```

**Run tests with 2 retries on failure:**
```bash
npm test -- --retries=2
```

**Run tests on Firefox:**
```bash
npm run test:firefox
# Note: Firefox must be installed first with `npx playwright install firefox`
```

**Run specific test by line number:**
```bash
npx playwright test tests/departments.spec.js:45
```

**Run tests with custom timeout:**
```bash
npm test -- --timeout=60000
```

---

## Test Reports

### HTML Report

After test execution, view the HTML report:

```bash
npm run test:report
```

This opens an HTML report showing:
- Test results (passed/failed)
- Execution time
- Screenshots of failures
- Videos of test runs
- Error messages and stack traces

The report is generated in `playwright-report/` directory.

### JSON Report

Results are also saved as JSON in `test-results/results.json` for CI/CD integration.

---

## Debugging Tests

### Method 1: Debug Mode (Playwright Inspector)

Run tests with the Playwright Inspector:

```bash
npm run test:debug
```

Or debug a specific test:
```bash
npx playwright test tests/departments.spec.js --debug
```

The Inspector allows you to:
- Step through tests line by line
- Inspect page state at each step
- View network requests
- Examine DOM elements
- Edit locators on the fly

### Method 2: Headed Mode with Slowmo

Run tests slowly with visible browser:

```bash
npx playwright test --headed --slow-mo=1000
```

This slows down operations by 1 second for easier visual debugging.

### Method 3: Pause Execution

Add `await page.pause()` in your test to pause at a specific point:

```javascript
test('my test', async ({ page }) => {
  await page.goto('/departments');
  await page.pause(); // Execution stops here
  // ...
});
```

### Method 4: View Screenshots and Videos

Failed tests automatically capture:
- **Screenshots**: Located in `test-results/`
- **Videos**: Located in `test-results/`

View them in the HTML report or directly in the filesystem.

### Method 5: Console Logs

Add console logs to your tests:

```javascript
console.log('Current URL:', page.url());
console.log('Element count:', await page.locator('button').count());
```

---

## Writing New Tests

### Test Structure

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Feature Name', () => {

  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/your-page');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await page.click('button');
    await expect(page.locator('h1')).toHaveText('Expected Text');
  });

  test.afterEach(async ({ page }) => {
    // Cleanup after each test
  });
});
```

### Best Practices

1. **Use Page Object Model** for complex tests
2. **Use data-testid** attributes for stable selectors
3. **Wait for elements** before interacting
4. **Clean up test data** in afterEach hooks
5. **Use unique test data** to avoid conflicts
6. **Group related tests** with `test.describe()`
7. **Use meaningful test names** that describe what's being tested

### Useful Locators

```javascript
// By role (most reliable)
page.getByRole('button', { name: 'Submit' })

// By label
page.getByLabel('Username')

// By text
page.getByText('Welcome')

// By placeholder
page.getByPlaceholder('Enter email')

// By test ID
page.getByTestId('login-button')

// CSS selector
page.locator('button.submit')
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: password
          POSTGRES_DB: university_management
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: |
          cd university-management
          npm install
          cd client && npm install
          cd ../server && npm install

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run migrations
        run: |
          cd university-management/server
          npx prisma migrate deploy

      - name: Start backend
        run: |
          cd university-management/server
          npm start &
          sleep 10

      - name: Start frontend
        run: |
          cd university-management/client
          npm start &
          sleep 30

      - name: Run tests
        run: |
          cd university-management
          npm test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: university-management/playwright-report/
```

---

## Environment Variables

You can customize test behavior with environment variables:

```bash
# Set base URL for frontend
BASE_URL=http://localhost:3000 npm test

# Set API URL for backend
API_URL=http://localhost:5000 npm test

# Run in CI mode (affects retries and parallelization)
CI=true npm test
```

---

## Codegen - Generate Tests Automatically

Playwright can generate tests by recording your interactions:

```bash
npm run test:codegen
```

This opens a browser where you can:
1. Navigate and interact with the application
2. Playwright records your actions
3. Copy the generated test code
4. Paste into your test file

Example:
```bash
npx playwright codegen http://localhost:3000/departments
```

---

## Troubleshooting

### Tests fail with "Timeout"

**Current Configuration:**
- Test timeout: **10 seconds** (default for each test)
- Expect timeout: **3 seconds** (default for assertions)

**Solution**: Increase timeout in `playwright.config.js`:
```javascript
timeout: 30 * 1000, // 30 seconds
```

Or for a specific test:
```javascript
test('slow test', async ({ page }) => {
  test.setTimeout(30000);
  // ...
});
```

Or for a specific assertion:
```javascript
await expect(page.getByText('Something')).toBeVisible({ timeout: 10000 });
```

### Browser not found

**Solution**: Install browsers:
```bash
npx playwright install
```

### Tests fail intermittently

**Solutions**:
1. Add explicit waits: `await page.waitForLoadState('networkidle')`
2. Use `waitForTimeout` sparingly
3. Enable retries in config
4. Check for race conditions

### Port already in use

**Solution**: Kill processes on ports 3000 and 5000:

Windows:
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Linux/Mac:
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

---

## Test Coverage

Current test coverage for Departments:

- ✅ CREATE: Add new department
- ✅ READ: Display departments in table
- ✅ UPDATE: Edit existing department
- ✅ DELETE: Remove department
- ✅ VALIDATION: Required field validation
- ✅ PAGINATION: Navigate pages
- ✅ CANCEL: Close form without saving
- ✅ FULL CYCLE: Complete CRUD in sequence

---

## Next Steps

1. Run the tests: `npm run test:ui`
2. Review the HTML report: `npm run test:report`
3. Add tests for other entities (Buildings, Semesters, etc.)
4. Integrate with CI/CD pipeline
5. Add visual regression tests
6. Add API tests

---

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Selector Guide](https://playwright.dev/docs/selectors)
