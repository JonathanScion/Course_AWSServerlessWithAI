# E2E Testing Lessons Learned - Playwright Best Practices

This document captures all the lessons learned, pitfalls encountered, and best practices discovered while setting up Playwright E2E tests for the University Management System.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
3. [Best Practices](#best-practices)
4. [Debugging Strategies](#debugging-strategies)
5. [What to Test (and What Not to Test)](#what-to-test-and-what-not-to-test)
6. [Quick Reference](#quick-reference)

---

## Project Structure

### ✅ Correct: E2E Tests at Root Level

```
university-management/              ← Project root
├── client/                         ← Frontend only
│   ├── src/
│   └── package.json               ← React deps only
│
├── server/                         ← Backend only
│   ├── src/
│   └── package.json               ← Express deps only
│
├── tests/                          ← E2E tests ✅
│   ├── departments.spec.js
│   └── helpers/
│
├── playwright.config.js            ← Root level ✅
└── package.json                    ← Test deps ✅
```

**Why?**
- E2E tests test the **entire application** (client + server + database)
- They are **independent** of implementation details
- Separate **dependencies** from client/server code
- Industry standard for monorepo structures

### ❌ Wrong: E2E Tests in Client Directory

```
client/
├── src/
├── tests/e2e/           ← ❌ Don't do this!
└── package.json         ← ❌ Mixed dependencies
```

**Problems:**
- Implies tests only cover client
- Confuses dependencies (React + Playwright together)
- Makes CI/CD pipelines unclear

---

## Common Pitfalls & Solutions

### 1. Running Tests from Wrong Directory

#### ❌ Problem
```bash
PS C:\Course_AWSServerlessWithAI> npx playwright test tests/departments.spec.js
```

**Error:**
```
Error: Playwright Test did not expect test.describe() to be called here.
You have two different versions of @playwright/test.
```

#### ✅ Solution
```bash
# Always cd into the project directory first!
cd university-management
npm test
```

**Why it happens:**
- Node.js resolves `node_modules` by walking UP the directory tree
- Running from parent directory finds wrong/missing modules
- Playwright can't find `playwright.config.js`

---

### 2. Package Conflicts

#### ❌ Problem
```json
{
  "devDependencies": {
    "@playwright/test": "^1.56.1",
    "playwright": "^1.56.1"     // ❌ Redundant!
  }
}
```

**Error:** Version conflicts, weird import issues

#### ✅ Solution
```json
{
  "devDependencies": {
    "@playwright/test": "^1.56.1"  // ✅ This is all you need!
  }
}
```

**Key Learning:**
- `@playwright/test` already includes `playwright`
- Having both creates version conflicts
- Only install `@playwright/test`

---

### 3. Wrong Button Selectors

#### ❌ Problem
```javascript
await page.getByRole('button', { name: /Submit/i }).click();
```

**Error:** Timeout - button not found

#### ✅ Solution

**First, check the actual button text:**
```javascript
// FormDialog.js
<Button type="submit">
  {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
</Button>
```

**Then use the correct selector:**
```javascript
// For create
await page.getByRole('button', { name: /Create/i }).click();

// For update
await page.getByRole('button', { name: /Update/i }).click();

// Or match both
await page.getByRole('button', { name: /Create|Update/i }).click();
```

**Key Learning:**
- **Always inspect the actual component code** before writing selectors
- Don't assume button text - verify it!
- Use regex patterns for flexibility (`/Create|Update/i`)

---

### 4. Race Conditions with API Calls

#### ❌ Problem
```javascript
await page.getByRole('button', { name: /Create/i }).click();
await page.waitForTimeout(1000); // ❌ Hope 1 second is enough?
await expect(page.getByText(department.code)).toBeVisible(); // ❌ Often fails
```

**Why it fails:**
```
Click → POST /api/departments → GET /api/departments → Table updates
                                                      ↑
                                                We check here (maybe?)
```

#### ✅ Solution: Wait for Actual API Responses

```javascript
/**
 * Helper to wait for API requests
 */
function waitForDepartmentsAPI(page, method = 'GET') {
  return page.waitForResponse(response =>
    response.url().includes('/api/departments') &&
    response.request().method() === method
  );
}

// Use it in tests
const createPromise = waitForDepartmentsAPI(page, 'POST');

await page.getByRole('button', { name: /Create/i }).click();

await createPromise;  // Wait for POST to complete
await waitForDepartmentsAPI(page, 'GET');  // Wait for table refresh

// NOW we can check the data
await expect(page.getByText(department.code)).toBeVisible(); // ✅ Works!
```

**Key Learning:**
- ❌ Never use arbitrary `waitForTimeout()`
- ✅ Always wait for actual network responses
- ✅ Make tests **deterministic**, not time-dependent

---

### 5. Testing Ephemeral Notifications

#### ❌ Problem
```javascript
await createPromise;
await expect(page.getByRole('alert')).toContainText(/created successfully/i);
// ❌ Fails - notification not found!
```

**Why it fails:**
1. **Timing**: Notification renders **after** React state update (unpredictable)
2. **Auto-hide**: Disappears after 4 seconds (`autoHideDuration={4000}`)
3. **Race condition**: Test might check before it appears or after it's gone

#### ✅ Solution: Don't Test Notifications in E2E

```javascript
// Instead of checking notification...
await createPromise;
await waitForDepartmentsAPI(page, 'GET');

// ...verify the actual outcome
await expect(page.getByText(department.code)).toBeVisible(); // ✅ Data persisted
```

**Where to test notifications:**

1. **Component/Unit Tests (Jest + React Testing Library)**:
   ```javascript
   // client/src/__tests__/Departments.test.jsx
   test('shows success notification after create', async () => {
     render(<Departments />);
     // Mock API, trigger create
     expect(screen.getByRole('alert')).toHaveTextContent('created successfully');
   });
   ```

2. **Add data-testid if really needed**:
   ```javascript
   <Alert data-testid="success-notification" ...>
   ```

3. **Or just skip it in E2E** (recommended!)

**Key Learning:**
- E2E tests should focus on **functionality**, not UI feedback
- Notifications are **ephemeral** - hard to test reliably
- Test **outcomes** (data changes), not **feedback** (alerts)

---

### 6. Timeout Values

#### ❌ Problem: Timeouts Too Long
```javascript
timeout: 30 * 1000,  // 30 seconds - too slow for feedback
expect: {
  timeout: 5000      // 5 seconds
}
```

#### ✅ Solution: Shorter, Realistic Timeouts

```javascript
// playwright.config.js
module.exports = defineConfig({
  timeout: 10 * 1000,  // 10 seconds - fast feedback
  expect: {
    timeout: 3000      // 3 seconds - reasonable for most checks
  }
});
```

**Override for specific slow tests:**
```javascript
test('slow operation', async ({ page }) => {
  test.setTimeout(30000); // 30 seconds just for this test
  // ...
});
```

**Override for specific assertions:**
```javascript
await expect(element).toBeVisible({ timeout: 10000 }); // 10s for this check
```

**Key Learning:**
- Fast timeouts = fast feedback when tests fail
- Most operations should complete in 3 seconds
- Only increase timeout for genuinely slow operations

---

### 7. Strict Mode Violations (Ambiguous Selectors)

#### ❌ Problem: Selector Matches Multiple Elements
```javascript
await expect(page.getByText('CS-TEST')).toBeVisible();
```

**Error:**
```
strict mode violation: getByText('CS-TEST') resolved to 2 elements:
  1) <td>CS-TEST</td> (the department code)
  2) <td>cs-test@university.edu</td> (email contains "CS-TEST")
```

**Why it happens:**
- `getByText()` does **partial matching** by default
- The email "cs-test@university.edu" **contains** "CS-TEST"
- Playwright's strict mode requires **exactly one match** for safety

#### ✅ Solution: Use More Specific Selectors

**Option 1: Use `exact: true` with roles**
```javascript
// Target the specific cell
const row = page.locator('tr', {
  has: page.getByRole('cell', { name: 'CS-TEST', exact: true })
});
await expect(row).toBeVisible();
```

**Option 2: Scope within a row first**
```javascript
// Find the row, then check within it
const row = page.locator('tr', {
  has: page.getByRole('cell', { name: testDepartment.code, exact: true })
});
await expect(row.getByText(testDepartment.name)).toBeVisible();
```

**Option 3: Use test IDs for complex cases**
```javascript
// In component
<TableCell data-testid="dept-code">{code}</TableCell>

// In test
await expect(page.getByTestId('dept-code')).toHaveText('CS-TEST');
```

**Key Learning:**
- Strict mode is your friend - it prevents flaky tests
- Always use `exact: true` for partial matches
- Prefer `getByRole('cell')` over `getByText()` for table cells
- Scope selectors to avoid ambiguity

---

### 8. Servers Not Running (Most Common Issue!)

#### ❌ Problem: Test Timeouts on API Calls
```
Error: page.waitForResponse: Test timeout of 10000ms exceeded.
  at waitForDepartmentsAPI
```

**Why it happens:**
- E2E tests require **both** backend and frontend to be running
- Tests try to interact with http://localhost:3000 and http://localhost:5000
- If either server is down, API calls timeout
- **This is the #1 most common cause of test failures!**

#### ✅ Solution: Always Start Servers First

**Terminal 1 - Backend:**
```bash
cd university-management/server
npm run dev
# Should see: "Server running on http://localhost:5000"
```

**Terminal 2 - Frontend:**
```bash
cd university-management/client
npm start
# Should see: "Compiled successfully!" and browser opens
```

**Terminal 3 - Tests:**
```bash
cd university-management
npm test
```

**Pre-flight check test:**
```bash
# Run this first to verify everything is set up
npm test -- --grep="PRE-FLIGHT"

# Should show:
# ✅ Server is running on http://localhost:5000
# ✅ Client is running on http://localhost:3000
# ✅ API endpoint /api/departments is accessible
```

**Key Learning:**
- **Always verify both servers are running** before running tests
- Use the pre-flight check test to diagnose issues quickly
- E2E tests need the full stack running (not just your code!)
- See `RUNNING_TESTS.md` for complete setup guide

---

### 9. Testing Loading States / Table Headers

#### ❌ Problem: Headers Not Found
```javascript
await expect(page.getByText('Code')).toBeVisible();
// Error: element(s) not found
```

**Why it happens:**
1. Component shows **loading spinner** while fetching data
2. Test checks for headers **before** data loads
3. Headers don't exist yet → test fails

**Component behavior:**
```javascript
if (loading) {
  return <CircularProgress />; // No table headers yet!
}
return <Table>...</Table>; // Headers appear after loading
```

#### ✅ Solution: Wait for Loading to Complete

**Option 1: Wait for network idle**
```javascript
await page.waitForLoadState('networkidle');
await expect(page.getByRole('columnheader', { name: 'Code' })).toBeVisible();
```

**Option 2: Wait for specific API call**
```javascript
await page.waitForResponse(res => res.url().includes('/api/departments'));
await expect(page.getByRole('columnheader', { name: 'Code' })).toBeVisible();
```

**Option 3: Wait for loading spinner to disappear**
```javascript
await page.waitForSelector('[role="progressbar"]', { state: 'hidden' });
await expect(page.getByRole('columnheader', { name: 'Code' })).toBeVisible();
```

**Also use semantic selectors:**
```javascript
// ❌ Before: Ambiguous
await expect(page.getByText('Code')).toBeVisible();

// ✅ After: Specific table header
await expect(page.getByRole('columnheader', { name: 'Code' })).toBeVisible();
```

**Key Learning:**
- Always wait for loading states to complete
- Use `waitForLoadState('networkidle')` for initial page loads
- Use `getByRole('columnheader')` for table headers (semantic!)
- Loading spinners are common - plan for them in tests

---

### 10. Test Data Must Match Database Constraints

#### ❌ Problem: Validation Errors Cause Timeouts
```javascript
// Test generates unique code
const uniqueCode = `E2E-${Date.now()}`;  // "E2E-1762875334312" = 17 chars!

// But database has constraint:
// code String @unique @db.VarChar(10)  // Max 10 characters!
```

**Server logs show:**
```
Error: [ValidationError]: "code" length must be less than or equal to 10 characters long
```

**But test sees:**
```
Error: page.waitForResponse: Test timeout of 10000ms exceeded
```

**Why this happens:**
1. Test sends data that violates database constraints
2. Server validates and rejects with 400 error
3. **Test is waiting for successful response (200/201)**
4. Never gets it → timeout!
5. Real error is hidden behind generic timeout

#### ✅ Solution: Validate Test Data Against Schema

**Step 1: Check the database schema FIRST**
```prisma
model Department {
  code    String  @unique @db.VarChar(10)  // ⚠️ MAX 10 chars!
  name    String  @db.VarChar(200)         // ⚠️ MAX 200 chars!
  email   String? @db.VarChar(100)         // ⚠️ MAX 100 chars!
}
```

**Step 2: Ensure test data respects constraints**
```javascript
// ❌ Before: Too long!
const uniqueCode = `E2E-${Date.now()}`;  // 17 characters

// ✅ After: Within limit
const uniqueCode = `T${Date.now().toString().slice(-8)}`;  // 9 characters
// Examples: "T62875334", "T12345678"

// Also check static test data
const testDepartment = {
  code: 'CS-TEST',  // 7 chars ✅
  name: 'Computer Science Testing',  // 28 chars ✅
  email: 'cs-test@university.edu'  // 25 chars ✅
};
```

**Step 3: Check response status in helper functions (IMPORTANT!)**
```javascript
// ❌ Before: Waits for response but doesn't check if it succeeded
async function createDepartment(page, dept) {
  await page.getByRole('button', { name: /Add Department/i }).click();
  await fillDepartmentForm(page, dept);

  const createPromise = waitForDepartmentsAPI(page, 'POST');
  await page.getByRole('button', { name: /Create/i }).click();

  await createPromise;  // Gets response but doesn't check status!
  // If server returned 400 error, test continues as if it succeeded

  await waitForDepartmentsAPI(page, 'GET');
}

// ✅ After: Check response status and provide clear error
async function createDepartment(page, dept) {
  await page.getByRole('button', { name: /Add Department/i }).click();
  await fillDepartmentForm(page, dept);

  const responsePromise = waitForDepartmentsAPI(page, 'POST');
  await page.getByRole('button', { name: /Create/i }).click();

  const response = await responsePromise;

  // Check if request succeeded
  if (!response.ok()) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to create department (${response.status()}): ${errorBody.message || errorBody.error || 'Unknown error'}`
    );
  }

  await waitForDepartmentsAPI(page, 'GET');
}
```

**Now instead of:**
```
❌ Error: page.waitForResponse: Test timeout of 10000ms exceeded
```

**You get:**
```
✅ Error: Failed to create department (400): "code" length must be less than or equal to 10 characters long
```

**Step 4: Handle validation errors in tests (optional)**
```javascript
// If you want to TEST validation errors specifically:
test('should reject department with too-long code', async ({ page }) => {
  const tooLongCode = 'A'.repeat(15);  // 15 characters

  await page.getByRole('button', { name: /Add Department/i }).click();
  await page.getByLabel('Department Code *').fill(tooLongCode);
  await page.getByLabel('Department Name *').fill('Test');

  await page.getByRole('button', { name: /Create/i }).click();

  // Should show error message (frontend validation or backend error)
  await expect(page.getByText(/code.*too long|exceeds maximum/i)).toBeVisible();
});
```

**Key Learning:**
- **Check database schema constraints BEFORE writing tests**
- **Check response.ok() in helper functions** - Don't assume success!
- Timeouts often hide underlying validation errors
- Server errors (400) look like timeouts to tests expecting success (201)
- Clear error messages save debugging time
- Generate test data that respects ALL constraints:
  - String length limits
  - Unique constraints
  - Foreign key references
  - Required fields
  - Data types
- Apply error checking to ALL operations: CREATE, UPDATE, DELETE

---

### 11. Server Must Catch Async Errors (CRITICAL SERVER BUG!)

#### ❌ Problem: Prisma Errors Not Reaching Error Handler

**Server logs show:**
```
Error: PrismaClientKnownRequestError:
Unique constraint failed on the fields: (`code`)
  code: 'P2002',
  ...
```

**But client receives:**
```
// Generic error or no error at all - wrong status code
```

**Root cause:** Controller methods are `async` but not wrapped in try-catch or async handler!

```javascript
// ❌ BEFORE: Errors are thrown but never caught by Express!
class BaseController {
  create = async (req, res) => {
    const record = await this.model.create({ data });  // ← Error thrown here
    res.status(201).json(record);                      // ← Never executes
  };
  // Express doesn't know about the error because async functions
  // don't automatically pass errors to next()
}
```

**Why this is catastrophic:**
1. Server sees the Prisma error (P2002, P2025, etc.)
2. Error is thrown but NOT caught
3. Express error handler middleware NEVER runs
4. Client gets wrong status code or generic 500
5. Beautiful error messages in errorHandler.js are never used!

#### ✅ Solution: Wrap All Async Routes with asyncHandler

**Step 1: Create async handler middleware**
```javascript
// server/src/middleware/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
```

**Step 2: Wrap ALL controller methods**
```javascript
// server/src/controllers/baseController.js
const asyncHandler = require('../middleware/asyncHandler');

class BaseController {
  // ✅ NOW errors are caught and passed to error handler!
  create = asyncHandler(async (req, res) => {
    const record = await this.model.create({ data });
    res.status(201).json(record);
  });

  update = asyncHandler(async (req, res) => {
    const record = await this.model.update({ where, data });
    res.json(record);
  });

  delete = asyncHandler(async (req, res) => {
    await this.model.delete({ where });
    res.status(204).send();
  });

  getAll = asyncHandler(async (req, res) => {
    const data = await this.model.findMany();
    res.json(data);
  });

  getById = asyncHandler(async (req, res) => {
    const record = await this.model.findUnique({ where });
    if (!record) return res.status(404).json({ error: 'Not found' });
    res.json(record);
  });
}
```

**Now errors flow correctly:**
```
1. Prisma throws error (P2002)
   ↓
2. asyncHandler catches it
   ↓
3. Calls next(err) to pass to Express
   ↓
4. errorHandler middleware receives it
   ↓
5. Translates P2002 → 409 with message "A record with this code already exists"
   ↓
6. Client receives proper error!
```

**Client now sees:**
```javascript
// Before asyncHandler:
❌ Error: Failed to create department (500): Internal Server Error

// After asyncHandler:
✅ Error: Failed to create department (409): A record with this code already exists
```

**Step 3: Verify error handler has all Prisma codes**
```javascript
// server/src/middleware/errorHandler.js (already exists)
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // P2002: Unique constraint
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: `A record with this ${err.meta?.target?.[0] || 'value'} already exists`,
      field: err.meta?.target?.[0]
    });
  }

  // P2025: Record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Not found',
      message: 'Record not found'
    });
  }

  // P2003: Foreign key constraint
  if (err.code === 'P2003') {
    return res.status(400).json({
      error: 'Foreign key constraint failed',
      message: 'Referenced record does not exist'
    });
  }

  // Joi validation errors
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation error',
      message: err.details[0].message,
      details: err.details
    });
  }

  // Default
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
};
```

**Key Learning:**
- **Express doesn't automatically catch async errors!**
- Without async handler, errors are thrown into void
- Error handler middleware is NEVER called
- Always wrap async route handlers
- This is a **server bug**, not a test bug
- Tests correctly reported "this record already exists" because they read the response
- But the response had wrong status/message because errorHandler never ran!

**Common Prisma Error Codes:**
- `P2002` - Unique constraint violation → 409 Conflict
- `P2025` - Record not found → 404 Not Found
- `P2003` - Foreign key constraint → 400 Bad Request
- `P2001` - Record doesn't exist in where condition → 404

---

### 12. Validation Schema Must Allow Read-Only Fields

#### ❌ Problem: UPDATE Requests Fail with "field is not allowed"

**Server logs show:**
```
Error: [ValidationError]: "id" is not allowed. "createdAt" is not allowed. "updatedAt" is not allowed
```

**What's happening:**
When you UPDATE a record, the client often sends back the entire object from the database, including read-only fields like `id`, `createdAt`, and `updatedAt`. If your validation schema doesn't allow these fields, the request is rejected.

**Example - client sends:**
```javascript
{
  id: 71,
  code: 'CS-TEST',
  name: 'Updated Name',
  createdAt: '2025-11-11T16:13:55.701Z',
  updatedAt: '2025-11-11T16:13:55.701Z'
}
```

**But schema only allows:**
```javascript
const departmentSchema = Joi.object({
  code: Joi.string().max(10).required(),
  name: Joi.string().max(200).required(),
  // ... other fields
  // ❌ No id, createdAt, updatedAt!
});
```

#### ✅ Solution: Allow and Strip Read-Only Fields

```javascript
const departmentSchema = Joi.object({
  code: Joi.string().max(10).required(),
  name: Joi.string().max(200).required(),
  description: Joi.string().allow('', null),
  building: Joi.string().max(100).allow('', null),
  phone: Joi.string().max(20).allow('', null),
  email: Joi.string().email().max(100).allow('', null),

  // ✅ Allow but ignore these fields (sent by client but not used)
  id: Joi.number().optional().strip(),
  createdAt: Joi.date().optional().strip(),
  updatedAt: Joi.date().optional().strip()
}).unknown(false);  // Reject any other unknown fields
```

**The `.strip()` modifier:**
- Allows the field in the incoming request
- Removes it from the validated data
- Prevents it from being passed to Prisma (which would ignore it anyway)

**Key Learning:**
- Read-only fields from database should be allowed in validation schema
- Use `.strip()` to remove them after validation
- Use `.unknown(false)` to catch typos and unexpected fields
- This pattern works for all CRUD endpoints that receive full objects

---

### 13. Parallel Tests Cause Race Conditions with Shared Data

#### ❌ Problem: Tests Fail with "Record Already Exists" in Parallel

**Test output shows:**
```
✓ Test 1 (CREATE) - passed
✗ Test 4 (READ) - Failed to create department (409): A record with this code already exists
✗ Test 10 (UPDATE) - Failed to create department (409): A record with this code already exists
✗ Test 3 (DELETE) - Failed to create department (409): A record with this code already exists
```

**What's happening:**
1. Playwright runs tests **in parallel** by default (for speed)
2. Multiple tests try to create the same `CS-TEST` record **at the same time**
3. First test succeeds, others get duplicate key errors
4. Race condition!

**Why it happens:**
```javascript
// playwright.config.js - DEFAULT settings
module.exports = defineConfig({
  fullyParallel: true,  // ← Tests run in parallel
  workers: undefined,   // ← Uses all CPU cores
});

// All tests use same static data:
const testDepartment = {
  code: 'CS-TEST',  // ← Same code in all tests!
  // ...
};
```

#### ✅ Solution 1: Run Tests Serially (Recommended for DB Tests)

**Update `playwright.config.js`:**
```javascript
module.exports = defineConfig({
  fullyParallel: false,  // ✅ Disable parallel execution
  workers: 1,            // ✅ Run tests one at a time

  // Rest of config...
});
```

**Pros:**
- No race conditions
- Tests are isolated
- Cleanup works properly

**Cons:**
- Slower execution (tests run sequentially)

#### ✅ Solution 2: Use Unique Data Per Test (Advanced)

```javascript
// Generate unique codes per test
test('CREATE', async ({ page }) => {
  const uniqueDept = {
    ...testDepartment,
    code: `TEST-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  };
  await createDepartment(page, uniqueDept);
});
```

**Pros:**
- Tests can run in parallel (faster)

**Cons:**
- More complex cleanup required
- Can leave orphaned test data
- Database fills up over time

#### ✅ Solution 3: Use Test Isolation with beforeAll/afterAll

```javascript
test.describe('Departments CRUD Operations', () => {

  // Clean up before ALL tests
  test.beforeAll(async ({ request }) => {
    const response = await request.get('http://localhost:5000/api/departments?limit=1000');
    const { data } = await response.json();

    // Delete all test departments
    const testDepartments = data.filter(dept =>
      dept.code === 'CS-TEST' ||
      dept.code.startsWith('TEST-')
    );

    for (const dept of testDepartments) {
      await request.delete(`http://localhost:5000/api/departments/${dept.id}`);
    }
  });

  // Tests...
});
```

**Key Learning:**
- Parallel tests are great for UI tests without database changes
- E2E tests with database need isolation
- Choose serial execution for simplicity
- OR use unique data + cleanup for speed
- Always clean up test data to avoid pollution
- Database state matters in E2E tests!

**Debugging parallel test issues:**
```bash
# Run with 1 worker to see if it fixes the issue
npm test -- --workers=1

# If it works, you have a parallelization problem
# If it still fails, you have a different issue
```

---

### 14. Reduce Server Log Noise from Expected Errors

#### ❌ Problem: Server Logs Flooded with Expected Errors

**During test runs, server logs show:**
```
Error: PrismaClientKnownRequestError: Unique constraint failed...
Error: [ValidationError]: "code" length must be less than...
Error: PrismaClientKnownRequestError: Record not found...
Error: PrismaClientKnownRequestError: Unique constraint failed...
Error: [ValidationError]: "email" must be a valid email...
```

**Why it's noisy:**
These are **expected errors** during testing:
- Tests intentionally create duplicates (to test validation)
- Tests try to delete non-existent records
- Tests submit invalid data (to test error handling)

But they clutter the logs, hiding **real unexpected errors**.

#### ✅ Solution: Only Log Unexpected Errors

**Update errorHandler.js:**
```javascript
const errorHandler = (err, req, res, next) => {
  // Only log unexpected errors (not validation or known Prisma errors)
  if (!err.isJoi && !err.code?.startsWith('P2')) {
    console.error('Error:', err);
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: `A record with this ${err.meta?.target?.[0] || 'value'} already exists`
    });
  }

  // Handle Joi validation errors
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation error',
      message: err.details[0].message
    });
  }

  // Default handler for unexpected errors
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
};
```

**What gets logged now:**
- ✅ Database connection failures
- ✅ Unhandled exceptions
- ✅ Code bugs (500 errors)
- ❌ Validation errors (expected)
- ❌ Prisma constraint violations (expected)

**Alternative: Add DEBUG environment variable**
```javascript
const errorHandler = (err, req, res, next) => {
  // In development, log everything
  if (process.env.NODE_ENV === 'development' && process.env.DEBUG) {
    console.error('Error:', err);
  }
  // In production or testing, only log unexpected
  else if (!err.isJoi && !err.code?.startsWith('P2')) {
    console.error('Error:', err);
  }

  // ... rest of error handling
};
```

**Key Learning:**
- Not all errors need logging (some are expected)
- Separate expected business errors from unexpected system errors
- Clean logs make debugging faster
- Use log levels: ERROR for unexpected, DEBUG for expected
- Tests should trigger validation errors - that's their job!

---

### 15. HTTP 204 No Content is Success, but response.ok() Returns False

#### ❌ Problem: DELETE Test Fails Despite Successful Deletion

**Test waits for response, then times out:**
```javascript
const deleteResponse = await deletePromise;

if (!deleteResponse.ok()) {  // ← This is TRUE for 204!
  throw new Error('Failed to delete');
}
```

**What's happening:**
- Server correctly returns **204 No Content** for successful DELETE
- Playwright's `response.ok()` checks if status is 200-299
- **But 204 has no body**, so `ok()` returns **false** in some implementations
- Test thinks delete failed, but it actually succeeded!

#### ✅ Solution: Explicitly Check for 204 Status

```javascript
// ❌ Before: Treats 204 as failure
if (!deleteResponse.ok()) {
  throw new Error('Failed to delete');
}

// ✅ After: Recognize 204 as success
if (!deleteResponse.ok() && deleteResponse.status() !== 204) {
  const errorBody = await deleteResponse.json().catch(() => ({}));
  throw new Error(
    `Failed to delete (${deleteResponse.status()}): ${errorBody.message || 'Unknown error'}`
  );
}
```

**Also: Don't wait for GET if frontend behavior is uncertain**

```javascript
// ❌ Before: Wait for table refresh GET request
await waitForDepartmentsAPI(page, 'DELETE');
await waitForDepartmentsAPI(page, 'GET');  // ← Might not happen!

// ✅ After: Just wait for UI to update
await waitForDepartmentsAPI(page, 'DELETE');
await page.waitForTimeout(500);  // Give UI time to update
await expect(page.getByText('Deleted Item')).not.toBeVisible();
```

**Why GET might not happen:**
1. Frontend might not refresh if table becomes empty
2. GET request might fire before you start waiting
3. Frontend might use optimistic updates (removes from UI immediately)
4. React state management might not trigger new fetch

**Key Learning:**
- **204 No Content is a success status code**
- `response.ok()` behavior varies - always check specific status codes
- Don't assume frontend makes specific requests after mutations
- Wait for **UI changes** (what user sees) not API calls
- Optimistic UI updates might skip refetch entirely
- Common success status codes:
  - `200 OK` - GET, PUT with body
  - `201 Created` - POST
  - `204 No Content` - DELETE, PUT without body
  - `202 Accepted` - Async operations

**Better pattern for all operations:**
```javascript
async function deleteAndVerify(page, itemName) {
  const deletePromise = waitForAPI(page, 'DELETE');
  await page.getByRole('button', { name: /delete/i }).click();

  const response = await deletePromise;

  // Check success (allow both 200 and 204)
  if (response.status() !== 200 && response.status() !== 204) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Delete failed (${response.status()}): ${error.message}`);
  }

  // Verify UI reflects the change
  await page.waitForTimeout(500);
  await expect(page.getByText(itemName)).not.toBeVisible();
}
```

---

## Best Practices

### 1. Use Helper Functions

**Before (Repetitive):**
```javascript
test('CREATE', async ({ page }) => {
  await page.getByRole('button', { name: /Add Department/i }).click();
  await page.getByLabel('Department Code *').fill('CS-TEST');
  await page.getByLabel('Department Name *').fill('Computer Science');
  // ... 10 more lines
  await page.getByRole('button', { name: /Create/i }).click();
  // ... wait for APIs
});

test('READ', async ({ page }) => {
  // Repeat the same 15 lines to create a department
  // ...
});
```

**After (DRY):**
```javascript
// Helper functions at top of file
async function fillDepartmentForm(page, dept) {
  await page.getByLabel('Department Code *').fill(dept.code);
  await page.getByLabel('Department Name *').fill(dept.name);
  if (dept.description) await page.getByLabel('Description').fill(dept.description);
  // ...
}

async function createDepartment(page, dept) {
  await page.getByRole('button', { name: /Add Department/i }).click();
  await fillDepartmentForm(page, dept);

  const responsePromise = waitForDepartmentsAPI(page, 'POST');
  await page.getByRole('button', { name: /Create/i }).click();

  const response = await responsePromise;

  // Check response status for clear error messages
  if (!response.ok()) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to create department (${response.status()}): ${errorBody.message || errorBody.error || 'Unknown error'}`
    );
  }

  await waitForDepartmentsAPI(page, 'GET');
}

// Now tests are concise
test('CREATE', async ({ page }) => {
  await createDepartment(page, testDepartment);
  await expect(page.getByText(testDepartment.code)).toBeVisible();
});

test('READ', async ({ page }) => {
  await createDepartment(page, testDepartment); // Reuse!
  // Test read operations
});
```

**Benefits:**
- ✅ Less code duplication
- ✅ Easier to maintain
- ✅ Consistent behavior
- ✅ Tests read like documentation
- ✅ Clear error messages when operations fail (not generic timeouts)

---

### 2. Use Semantic Selectors

**Priority Order (Best to Worst):**

1. **Role-based** (Best):
   ```javascript
   page.getByRole('button', { name: 'Add Department' })
   page.getByRole('textbox', { name: 'Department Code' })
   page.getByRole('heading', { name: 'Departments' })
   ```

2. **Label-based**:
   ```javascript
   page.getByLabel('Department Name')
   page.getByLabel('Email')
   ```

3. **Placeholder**:
   ```javascript
   page.getByPlaceholder('Enter email')
   ```

4. **Test ID** (when needed):
   ```javascript
   page.getByTestId('department-form')
   ```

5. **CSS/XPath** (Last resort):
   ```javascript
   page.locator('button.submit') // Avoid if possible
   ```

**Why?**
- Role-based selectors test **accessibility**
- They're **resilient** to UI changes
- They reflect **how users interact** with the app

---

### 3. Test Data Isolation

**Use unique identifiers:**
```javascript
test('CREATE', async ({ page }) => {
  const uniqueCode = `E2E-${Date.now()}`;
  const dept = { ...testDepartment, code: uniqueCode };

  await createDepartment(page, dept);
  // No conflicts with other tests!
});
```

**Clean up after tests:**
```javascript
test.afterEach(async ({ page }) => {
  // Try to clean up test data
  try {
    const testRows = page.locator('tr', {
      has: page.locator('text=/E2E-|TEST-/i')
    });
    // Delete test departments
  } catch (error) {
    console.log('Cleanup failed - non-critical');
  }
});
```

---

### 4. Clear Test Names

**❌ Bad:**
```javascript
test('test1', async ({ page }) => { ... });
test('departments', async ({ page }) => { ... });
```

**✅ Good:**
```javascript
test('CREATE - should add a new department successfully', async ({ page }) => { ... });
test('DELETE - should show confirmation before removing department', async ({ page }) => { ... });
test('VALIDATION - should show error for missing required fields', async ({ page }) => { ... });
```

**Benefits:**
- ✅ Easy to identify which test failed
- ✅ Self-documenting
- ✅ Helps organize test reports

---

### 5. Structure Tests with AAA Pattern

**Arrange - Act - Assert:**
```javascript
test('UPDATE - should edit an existing department', async ({ page }) => {
  // ARRANGE - Set up test data
  await createDepartment(page, testDepartment);
  const row = page.locator('tr', { has: page.getByText(testDepartment.code) });

  // ACT - Perform the action
  await row.getByRole('button', { name: /edit/i }).click();
  await page.getByLabel('Department Name').clear();
  await page.getByLabel('Department Name').fill(updatedName);
  await page.getByRole('button', { name: /Update/i }).click();

  // ASSERT - Verify the outcome
  await expect(page.getByText(updatedName)).toBeVisible();
});
```

---

## Debugging Strategies

### 1. Run in UI Mode (Best for Development)

```bash
npm run test:ui
```

**Features:**
- Interactive test runner
- See tests run in real-time
- Pause and inspect at any step
- View network requests
- Time travel debugging

### 2. Run in Headed Mode

```bash
npm run test:headed
```

**When to use:**
- See the actual browser
- Verify visual behavior
- Debug timing issues

### 3. Use Playwright Inspector

```bash
npm run test:debug
```

**Features:**
- Step through test line by line
- Inspect locators
- Try selectors in real-time
- View console logs

### 4. Add pause() in Tests

```javascript
test('debug this', async ({ page }) => {
  await page.goto('/departments');
  await page.pause(); // ← Execution stops here
  // Continue manually when ready
});
```

### 5. Check Screenshots and Videos

Failed tests automatically capture:
- **Screenshots**: `test-results/*.png`
- **Videos**: `test-results/*.webm`

View in HTML report:
```bash
npm run test:report
```

### 6. Add Logging

```javascript
test('troubleshoot', async ({ page }) => {
  console.log('Current URL:', page.url());

  const buttons = await page.getByRole('button').count();
  console.log('Number of buttons:', buttons);

  await page.screenshot({ path: 'debug.png' });
});
```

---

## What to Test (and What Not to Test)

### ✅ DO Test in E2E

| What | Example |
|------|---------|
| **User workflows** | Create → Edit → Delete department |
| **Data persistence** | Department appears after refresh |
| **Form validation** | Error shown for missing required fields |
| **Navigation** | Clicking link goes to correct page |
| **Integration** | Frontend + Backend + Database work together |
| **Critical paths** | Main user journeys |

### ❌ DON'T Test in E2E

| What | Test With Instead |
|------|-------------------|
| **Component styling** | Visual regression tests (Percy, Chromatic) |
| **Individual component logic** | Unit tests (Jest + React Testing Library) |
| **API endpoints** | Integration tests (Supertest) |
| **Database queries** | Unit tests |
| **Notifications/Toasts** | Component tests |
| **Edge cases** | Unit tests |
| **Performance** | Lighthouse, k6 |

### E2E vs Unit vs Integration

```
┌─────────────────────────────────────────┐
│         E2E Tests (Playwright)          │  ← Full user workflows
│  "Can user create and delete dept?"     │  ← Slower, fewer tests
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│    Integration Tests (Supertest)        │  ← API endpoints
│  "Does POST /departments work?"         │  ← Medium speed
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│   Unit Tests (Jest + RTL)               │  ← Component logic
│  "Does DataTable render rows?"          │  ← Fast, many tests
└─────────────────────────────────────────┘
```

**Testing Pyramid:**
```
       E2E (Few)           ← Slow, expensive, fragile
       /      \
      /        \
  Integration   ← Medium speed and quantity
    /    \
   /      \
  Unit Tests     ← Fast, cheap, many
```

---

## Quick Reference

### Essential Commands

```bash
# Run all tests (headless)
npm test

# Interactive UI mode (BEST for development)
npm run test:ui

# Run with browser visible
npm run test:headed

# Debug mode with Playwright Inspector
npm run test:debug

# Run specific test file
npm run test:departments

# View test report
npm run test:report

# Generate test code by recording
npm run test:codegen
```

### Common Patterns

#### Wait for API Call
```javascript
const apiPromise = page.waitForResponse(res =>
  res.url().includes('/api/departments') &&
  res.request().method() === 'POST'
);
await page.click('button');
await apiPromise;
```

#### Find Element in Table Row
```javascript
const row = page.locator('tr', { has: page.getByText('CS-101') });
await row.getByRole('button', { name: /edit/i }).click();
```

#### Fill Form Fields
```javascript
await page.getByLabel('Name').fill('Test');
await page.getByRole('combobox').selectOption('Option 1');
await page.getByRole('checkbox').check();
```

#### Check Text Exists
```javascript
await expect(page.getByText('Success')).toBeVisible();
await expect(page.getByRole('heading', { name: 'Departments' })).toBeVisible();
```

#### Verify Element NOT Visible
```javascript
await expect(page.getByText('Deleted Item')).not.toBeVisible();
```

### Troubleshooting Checklist

When a test fails:

1. **✓ Are you in the right directory?**
   ```bash
   cd university-management
   ```

2. **✓ Are servers running?**
   ```bash
   # Terminal 1: Server
   cd server && npm run dev

   # Terminal 2: Client
   cd client && npm start
   ```

3. **✓ Is the selector correct?**
   - Use `test:ui` mode to inspect elements
   - Check actual component code for text/attributes

4. **✓ Is it a timing issue?**
   - Wait for API responses, not arbitrary timeouts
   - Use `page.waitForResponse()` or `page.waitForLoadState()`

5. **✓ Is the data correct?**
   - Check if test data conflicts with existing data
   - Use unique identifiers

6. **✓ Check the logs:**
   ```bash
   # Client logs
   Check browser console in test:headed mode

   # Server logs
   Check terminal where server is running
   ```

---

## Summary: Golden Rules

### Critical Prerequisites
1. **🚨 Start both servers FIRST** - Backend (5000) + Frontend (3000) must be running
2. **✅ Run pre-flight check** - `npm test -- --grep="PRE-FLIGHT"` to verify setup
3. **🏃 Always run from project directory** - `cd university-management` first

### Project Structure
4. **🎯 E2E tests at root level** - They test the full stack, not just client
5. **📦 Only install `@playwright/test`** - Don't add `playwright` separately

### Writing Tests
6. **🔍 Use semantic selectors** - `getByRole`, `getByLabel` over CSS/text
7. **⏱️ Wait for APIs, not time** - `waitForResponse()` not `waitForTimeout()`
8. **🎨 Use exact matching** - `getByRole('cell', { name: 'CODE', exact: true })`
9. **⏳ Wait for loading states** - `waitForLoadState('networkidle')` before checking content
10. **🚫 Don't test notifications in E2E** - Test data outcomes instead

### Code Quality
11. **🧪 Use helper functions** - DRY principle for test code
12. **✅ Check response.ok() in helpers** - Don't assume API calls succeed
13. **⚡ Keep timeouts short** - 10s test timeout, 3s expect timeout
14. **📝 Clear test names** - "CREATE - should add department successfully"
15. **🎭 Scope selectors** - Find row first, then search within it

### Debugging
16. **🐛 Use UI mode for debugging** - `npm run test:ui` is your best friend
17. **👀 Check actual code** - Verify button text, roles, and attributes
18. **📊 Review test reports** - HTML reports show screenshots and videos

### Philosophy
19. **✅ Test user workflows** - Not implementation details
20. **🎪 Strict mode is your friend** - It catches ambiguous selectors early
21. **📚 Document as you go** - Future you will thank present you

---

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices Guide](https://playwright.dev/docs/best-practices)
- [Selector Guide](https://playwright.dev/docs/selectors)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Testing Library Principles](https://testing-library.com/docs/guiding-principles/) (applies to E2E too!)

---

**Last Updated:** 2025-01-11

**Contributors:** Lessons learned from real-world implementation of E2E tests for University Management System

---

## Changelog

### 2025-01-11 - Complete Documentation
- **9 Common Pitfalls documented** with full solutions:
  1. Running from wrong directory
  2. Package conflicts
  3. Wrong button selectors
  4. Race conditions with API calls
  5. Testing ephemeral notifications
  6. Timeout values
  7. Strict mode violations
  8. Servers not running ⭐ Most common!
  9. Testing loading states
  10. Test data must match database constraints
  11. Server must catch async errors (Express + Prisma)
  12. Validation schema must allow read-only fields
  13. Parallel tests cause race conditions with shared data
  14. Reduce server log noise from expected errors
  15. HTTP 204 is success, but response.ok() may return false
- **21 Golden Rules** organized by category
- Best practices with before/after examples
- Debugging strategies (6 methods)
- Quick reference with copy-paste code
- Troubleshooting checklist
- Complete examples for all patterns
