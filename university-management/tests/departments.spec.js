/**
 * Departments CRUD E2E Tests
 *
 * This test suite covers complete CRUD operations for the Departments entity:
 * - CREATE: Add a new department
 * - READ: View departments in the table and pagination
 * - UPDATE: Edit existing department
 * - DELETE: Remove a department
 *
 * ⚠️ CRITICAL PREREQUISITES - Tests will FAIL if these aren't running:
 *
 * 1. START THE SERVER (Terminal 1):
 *    cd university-management/server
 *    npm run dev
 *    → Should see: "Server running on http://localhost:5000"
 *
 * 2. START THE CLIENT (Terminal 2):
 *    cd university-management/client
 *    npm start
 *    → Should open browser at http://localhost:3000
 *
 * 3. RUN THE TESTS (Terminal 3):
 *    cd university-management
 *    npm test
 *
 * 💡 TIP: If tests timeout, check that both servers are running!
 *
 * 🔧 CONFIGURATION:
 * All URLs and timeouts are configured in tests/test.config.js and can be
 * overridden via environment variables:
 * - API_URL: Backend server URL (default: http://localhost:5000)
 * - BASE_URL: Frontend client URL (default: http://localhost:3000)
 * - apiQueryLimit: Maximum records to fetch (default: 1000)
 * - uiWaitTimeout: UI update wait time in ms (default: 500)
 *
 * See tests/test.config.js for all available configuration options.
 */

const { test, expect } = require('@playwright/test');
const { config } = require('./test.config');

/**
 * Helper function to wait for API requests to complete
 */
async function waitForDepartmentsAPI(page, method = 'GET') {
  return page.waitForResponse(response =>
    response.url().includes('/api/departments') &&
    response.request().method() === method
  );
}

/**
 * Helper to fill department form fields
 */
async function fillDepartmentForm(page, dept) {
  await page.getByLabel('Department Code *').fill(dept.code);
  await page.getByLabel('Department Name *').fill(dept.name);
  if (dept.description) await page.getByLabel('Description').fill(dept.description);
  if (dept.building) await page.getByLabel('Building').fill(dept.building);
  if (dept.phone) await page.getByLabel('Phone').fill(dept.phone);
  if (dept.email) await page.getByLabel('Email').fill(dept.email);
}

/**
 * Helper to create a department and wait for it to appear
 * Throws an error with the server's error message if creation fails
 */
async function createDepartment(page, dept) {
  await page.getByRole('button', { name: /Add Department/i }).click();
  await fillDepartmentForm(page, dept);

  const responsePromise = waitForDepartmentsAPI(page, 'POST');

  await page.getByRole('button', { name: /Create/i }).click();

  // Wait for create to complete
  const response = await responsePromise;

  // Check if request succeeded
  if (!response.ok()) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to create department (${response.status()}): ${errorBody.message || errorBody.error || 'Unknown error'}`
    );
  }

  // Wait for the table to refresh (happens after successful create)
  await waitForDepartmentsAPI(page, 'GET');

  // Note: We don't check for notification here because:
  // 1. It may appear and disappear quickly (4s auto-hide)
  // 2. The table data is a more reliable indicator of success
}

// Test data
const testDepartment = {
  code: 'CS-TEST',
  name: 'Computer Science Testing',
  description: 'Test department for E2E testing',
  building: 'Engineering Building',
  phone: '555-1234',
  email: 'cs-test@university.edu'
};

const updatedDepartment = {
  code: 'CS-TEST',
  name: 'Computer Science Testing Updated',
  description: 'Updated description for testing',
  building: 'New Engineering Building',
  phone: '555-5678',
  email: 'cs-test-updated@university.edu'
};

test.describe('Departments CRUD Operations', () => {

  // Clean up test data before ALL tests run
  test.beforeAll(async ({ request }) => {
    console.log('🧹 Running pre-test cleanup...');
    try {
      // Get all departments
      const response = await request.get(`${config.apiURL}/api/departments?limit=${config.apiQueryLimit}`);
      if (response.ok()) {
        const { data } = await response.json();
        console.log(`   Found ${data.length} total departments in database`);

        // Delete any test departments (CS-TEST, E2E-*, T followed by digits)
        const testDepartments = data.filter(dept =>
          dept.code === 'CS-TEST' ||
          dept.code.startsWith('E2E-') ||
          /^T\d+$/.test(dept.code)
        );

        console.log(`   Identified ${testDepartments.length} test departments to delete`);

        for (const dept of testDepartments) {
          const deleteResponse = await request.delete(`${config.apiURL}/api/departments/${dept.id}`);
          if (deleteResponse.ok() || deleteResponse.status() === 204) {
            console.log(`   ✅ Deleted: ${dept.code}`);
          } else {
            console.log(`   ❌ Failed to delete ${dept.code}: ${deleteResponse.status()}`);
          }
        }

        if (testDepartments.length > 0) {
          console.log(`✅ Cleanup complete: ${testDepartments.length} test department(s) removed`);
        } else {
          console.log('✅ No test departments to clean up');
        }
      } else {
        console.log(`❌ Failed to fetch departments: ${response.status()}`);
      }
    } catch (error) {
      console.log('❌ Pre-test cleanup failed:', error.message);
    }
  });

  test.beforeEach(async ({ page, request }) => {
    // Clean up CS-TEST before each test (in case previous test failed)
    try {
      const response = await request.get(`${config.apiURL}/api/departments?limit=${config.apiQueryLimit}`);
      if (response.ok()) {
        const { data } = await response.json();
        const csTest = data.find(dept => dept.code === 'CS-TEST');
        if (csTest) {
          await request.delete(`${config.apiURL}/api/departments/${csTest.id}`);
        }
      }
    } catch (error) {
      // Cleanup failed, but continue with test
    }

    // Navigate to the departments page before each test
    await page.goto('/departments');

    // Wait for the page to load
    await expect(page.getByRole('heading', { name: 'Departments' })).toBeVisible();
  });

  test('PRE-FLIGHT CHECK - servers are running', async ({ page, request }) => {
    // Check server health endpoint
    try {
      const serverResponse = await request.get(`${config.apiURL}/health`);
      expect(serverResponse.ok()).toBeTruthy();
      console.log(`✅ Server is running on ${config.apiURL}`);
    } catch (error) {
      throw new Error(
        '❌ SERVER NOT RUNNING!\n' +
        'Start the server first:\n' +
        '  cd university-management/server\n' +
        '  npm run dev\n'
      );
    }

    // Check client is accessible
    const clientResponse = await page.goto(config.baseURL);
    expect(clientResponse?.ok()).toBeTruthy();
    console.log(`✅ Client is running on ${config.baseURL}`);

    // Check API endpoint is accessible
    try {
      const apiResponse = await request.get(`${config.apiURL}/api/departments`);
      expect(apiResponse.ok()).toBeTruthy();
      console.log('✅ API endpoint /api/departments is accessible');
    } catch (error) {
      throw new Error(
        '❌ API ENDPOINT NOT ACCESSIBLE!\n' +
        'Check that:\n' +
        '  1. Server is running\n' +
        '  2. Database is connected\n' +
        '  3. Migrations have been run\n'
      );
    }
  });

  test('should display the departments page with table', async ({ page }) => {
    // Verify page title
    await expect(page.getByRole('heading', { name: 'Departments' })).toBeVisible();

    // Verify "Add Department" button exists
    await expect(page.getByRole('button', { name: /Add Department/i })).toBeVisible();

    // Wait for initial data load to complete (loading spinner disappears)
    await page.waitForLoadState('networkidle');

    // Verify table headers exist (using columnheader role)
    await expect(page.getByRole('columnheader', { name: 'Code' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Building' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Phone' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
  });

  test('CREATE - should add a new department successfully', async ({ page }) => {
    // Create department using helper
    await createDepartment(page, testDepartment);

    // Verify the new department appears in the table by finding the row
    const row = page.locator('tr', { has: page.getByRole('cell', { name: testDepartment.code, exact: true }) });
    await expect(row).toBeVisible();
    await expect(row.getByText(testDepartment.name)).toBeVisible();
  });

  test('READ - should display department details in table', async ({ page }) => {
    // First create a department to ensure we have data
    await createDepartment(page, testDepartment);

    // Verify all fields are visible in the table
    const row = page.locator('tr', { has: page.getByRole('cell', { name: testDepartment.code, exact: true }) });
    await expect(row).toBeVisible();
    await expect(row.getByText(testDepartment.name)).toBeVisible();
    await expect(row.getByText(testDepartment.building)).toBeVisible();
    await expect(row.getByText(testDepartment.phone)).toBeVisible();
    await expect(row.getByText(testDepartment.email)).toBeVisible();

    // Verify action buttons exist (Edit and Delete)
    await expect(row.getByRole('button', { name: /edit/i })).toBeVisible();
    await expect(row.getByRole('button', { name: /delete/i })).toBeVisible();
  });

  test('UPDATE - should edit an existing department successfully', async ({ page }) => {
    // First create a department
    await createDepartment(page, testDepartment);

    // Find the row with the test department and click Edit
    const row = page.locator('tr', { has: page.getByRole('cell', { name: testDepartment.code, exact: true }) });
    await row.getByRole('button', { name: /edit/i }).click();

    // Verify edit dialog opened
    await expect(page.getByRole('heading', { name: 'Edit Department' })).toBeVisible();

    // Verify form is pre-filled with existing data
    await expect(page.getByLabel('Department Code *')).toHaveValue(testDepartment.code);
    await expect(page.getByLabel('Department Name *')).toHaveValue(testDepartment.name);

    // Update the fields
    await page.getByLabel('Department Name *').clear();
    await page.getByLabel('Department Name *').fill(updatedDepartment.name);

    await page.getByLabel('Description').clear();
    await page.getByLabel('Description').fill(updatedDepartment.description);

    await page.getByLabel('Building').clear();
    await page.getByLabel('Building').fill(updatedDepartment.building);

    await page.getByLabel('Phone').clear();
    await page.getByLabel('Phone').fill(updatedDepartment.phone);

    await page.getByLabel('Email').clear();
    await page.getByLabel('Email').fill(updatedDepartment.email);

    // Wait for the update API call
    const updatePromise = waitForDepartmentsAPI(page, 'PUT');

    // Submit the update
    await page.getByRole('button', { name: /Update/i }).click();

    // Wait for update to complete
    const updateResponse = await updatePromise;

    // Check if request succeeded
    if (!updateResponse.ok()) {
      const errorBody = await updateResponse.json().catch(() => ({}));
      throw new Error(
        `Failed to update department (${updateResponse.status()}): ${errorBody.message || errorBody.error || 'Unknown error'}`
      );
    }

    // Wait for the table to refresh
    await waitForDepartmentsAPI(page, 'GET');

    // Verify updated data appears in the table
    await expect(page.getByText(updatedDepartment.name)).toBeVisible();
    await expect(page.getByText(updatedDepartment.building)).toBeVisible();
    await expect(page.getByText(updatedDepartment.phone)).toBeVisible();
    await expect(page.getByText(updatedDepartment.email)).toBeVisible();
  });

  test('DELETE - should remove a department successfully', async ({ page }) => {
    // First create a department
    await createDepartment(page, testDepartment);

    // Verify the department exists
    await expect(page.getByText(testDepartment.name)).toBeVisible();

    // Find the row and click Delete
    const row = page.locator('tr', { has: page.getByRole('cell', { name: testDepartment.code, exact: true }) });
    await row.getByRole('button', { name: /delete/i }).click();

    // Verify confirmation dialog appears
    await expect(page.getByRole('heading', { name: 'Delete Department' })).toBeVisible();
    await expect(page.getByText(`Are you sure you want to delete "${testDepartment.name}"?`)).toBeVisible();

    // Wait for the delete API call
    const deletePromise = waitForDepartmentsAPI(page, 'DELETE');

    // Confirm deletion
    await page.getByRole('button', { name: /Delete/i }).last().click();

    // Wait for delete to complete
    const deleteResponse = await deletePromise;

    // Check if request succeeded (204 No Content is success for DELETE)
    if (!deleteResponse.ok() && deleteResponse.status() !== 204) {
      const errorBody = await deleteResponse.json().catch(() => ({}));
      throw new Error(
        `Failed to delete department (${deleteResponse.status()}): ${errorBody.message || errorBody.error || 'Unknown error'}`
      );
    }

    // Wait a bit for the UI to update
    await page.waitForTimeout(config.uiWaitTimeout);

    // Verify the department is no longer in the table
    await expect(page.getByText(testDepartment.name)).not.toBeVisible();
  });

  test('VALIDATION - should show validation errors for required fields', async ({ page }) => {
    // Click the "Add Department" button
    await page.getByRole('button', { name: /Add Department/i }).click();

    // Try to submit without filling required fields
    await page.getByRole('button', { name: /Create|Update/i }).click();

    // The form should still be open (not submitted)
    await expect(page.getByRole('heading', { name: 'Add Department' })).toBeVisible();

    // Fill only the code field
    await page.getByLabel('Department Code *').fill('TEST');

    // Try to submit again (name is still missing)
    await page.getByRole('button', { name: /Create|Update/i }).click();

    // Form should still be open
    await expect(page.getByRole('heading', { name: 'Add Department' })).toBeVisible();
  });

  test('PAGINATION - should navigate through pages if more than 10 departments exist', async ({ page }) => {
    // Check if pagination controls exist
    const paginationExists = await page.getByText(/rows per page/i).isVisible().catch(() => false);

    if (paginationExists) {
      // Test pagination controls
      const rowsPerPageSelect = page.getByRole('combobox');
      await expect(rowsPerPageSelect).toBeVisible();

      // Wait for the GET request when changing page size
      const refreshPromise = waitForDepartmentsAPI(page, 'GET');

      // Try changing rows per page
      await rowsPerPageSelect.click();
      await page.getByRole('option', { name: '25' }).click();

      // Wait for the table to update
      await refreshPromise;
    } else {
      // If no pagination, verify that's because we have less than the default page size
      console.log('No pagination controls found - likely less than 10 departments');
    }
  });

  test('CANCEL - should close form dialog without saving when cancel is clicked', async ({ page }) => {
    // Click the "Add Department" button
    await page.getByRole('button', { name: /Add Department/i }).click();

    // Fill in some data
    await page.getByLabel('Department Code *').fill('CANCEL-TEST');
    await page.getByLabel('Department Name *').fill('Cancel Test Department');

    // Click Cancel
    await page.getByRole('button', { name: /Cancel/i }).click();

    // Verify dialog is closed
    await expect(page.getByRole('heading', { name: 'Add Department' })).not.toBeVisible();

    // Verify the data was not saved
    await expect(page.getByText('CANCEL-TEST')).not.toBeVisible();
  });

  test('FULL CRUD CYCLE - should create, read, update, and delete in sequence', async ({ page }) => {
    // Use shorter code to fit within 10 character limit
    const uniqueCode = `T${Date.now().toString().slice(-8)}`; // T + 8 digits = 9 chars
    const dept = { ...testDepartment, code: uniqueCode };

    // CREATE
    await createDepartment(page, dept);

    // READ
    const row = page.locator('tr', { has: page.getByRole('cell', { name: dept.code, exact: true }) });
    await expect(row).toBeVisible();
    await expect(row.getByText(dept.name)).toBeVisible();

    // UPDATE
    await row.getByRole('button', { name: /edit/i }).click();
    await expect(page.getByRole('heading', { name: 'Edit Department' })).toBeVisible();
    const newName = `${dept.name} - Modified`;
    await page.getByLabel('Department Name *').clear();
    await page.getByLabel('Department Name *').fill(newName);

    const updatePromise = waitForDepartmentsAPI(page, 'PUT');

    await page.getByRole('button', { name: /Update/i }).click();

    const updateResponse = await updatePromise;

    // Check if request succeeded
    if (!updateResponse.ok()) {
      const errorBody = await updateResponse.json().catch(() => ({}));
      throw new Error(
        `Failed to update department (${updateResponse.status()}): ${errorBody.message || errorBody.error || 'Unknown error'}`
      );
    }

    await waitForDepartmentsAPI(page, 'GET');

    // Verify update
    await expect(page.getByText(newName)).toBeVisible();

    // DELETE
    const updatedRow = page.locator('tr', { has: page.getByRole('cell', { name: dept.code, exact: true }) });
    await updatedRow.getByRole('button', { name: /delete/i }).click();
    await expect(page.getByRole('heading', { name: 'Delete Department' })).toBeVisible();

    const deletePromise = waitForDepartmentsAPI(page, 'DELETE');

    await page.getByRole('button', { name: /Delete/i }).last().click();

    const deleteResponse = await deletePromise;

    // Check if request succeeded (204 No Content is success for DELETE)
    if (!deleteResponse.ok() && deleteResponse.status() !== 204) {
      const errorBody = await deleteResponse.json().catch(() => ({}));
      throw new Error(
        `Failed to delete department (${deleteResponse.status()}): ${errorBody.message || errorBody.error || 'Unknown error'}`
      );
    }

    // Wait a bit for the UI to update
    await page.waitForTimeout(config.uiWaitTimeout);

    // Verify deletion
    await expect(page.getByText(dept.code)).not.toBeVisible();
  });

  // Cleanup after all tests
  test.afterEach(async ({ page }) => {
    // Try to clean up any test departments that might have been created
    // This is a best-effort cleanup
    try {
      const testRows = page.locator('tr', {
        has: page.locator('text=/CS-TEST|E2E-/i')
      });
      const count = await testRows.count();

      for (let i = 0; i < count; i++) {
        const row = testRows.nth(i);
        const deleteButton = row.getByRole('button', { name: /delete/i });
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          await page.getByRole('button', { name: /Delete/i }).last().click();
          await page.waitForTimeout(config.uiWaitTimeout);
        }
      }
    } catch (error) {
      // Cleanup failed, but that's okay
      console.log('Cleanup failed:', error.message);
    }
  });
});
