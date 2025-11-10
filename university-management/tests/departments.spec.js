/**
 * Departments CRUD E2E Tests
 *
 * This test suite covers complete CRUD operations for the Departments entity:
 * - CREATE: Add a new department
 * - READ: View departments in the table and pagination
 * - UPDATE: Edit existing department
 * - DELETE: Remove a department
 *
 * Prerequisites:
 * - Server running on http://localhost:5000
 * - Client running on http://localhost:3000
 * - Database accessible and seeded (optional)
 */

const { test, expect } = require('@playwright/test');

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
 */
async function createDepartment(page, dept) {
  await page.getByRole('button', { name: /Add Department/i }).click();
  await fillDepartmentForm(page, dept);

  const createPromise = waitForDepartmentsAPI(page, 'POST');

  await page.getByRole('button', { name: /Create/i }).click();

  // Wait for create to complete
  await createPromise;

  // Wait for success notification to appear (happens before refresh)
  await expect(page.getByText(/Department created successfully/i)).toBeVisible();

  // Wait for the table to refresh
  await waitForDepartmentsAPI(page, 'GET');
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

  test.beforeEach(async ({ page }) => {
    // Navigate to the departments page before each test
    await page.goto('/departments');

    // Wait for the page to load
    await expect(page.getByRole('heading', { name: 'Departments' })).toBeVisible();
  });

  test('should display the departments page with table', async ({ page }) => {
    // Verify page title
    await expect(page.getByRole('heading', { name: 'Departments' })).toBeVisible();

    // Verify "Add Department" button exists
    await expect(page.getByRole('button', { name: /Add Department/i })).toBeVisible();

    // Verify table headers exist
    await expect(page.getByText('Code')).toBeVisible();
    await expect(page.getByText('Name')).toBeVisible();
    await expect(page.getByText('Building')).toBeVisible();
    await expect(page.getByText('Phone')).toBeVisible();
    await expect(page.getByText('Email')).toBeVisible();
  });

  test('CREATE - should add a new department successfully', async ({ page }) => {
    // Create department using helper
    await createDepartment(page, testDepartment);

    // Verify the new department appears in the table
    await expect(page.getByText(testDepartment.code)).toBeVisible();
    await expect(page.getByText(testDepartment.name)).toBeVisible();
  });

  test('READ - should display department details in table', async ({ page }) => {
    // First create a department to ensure we have data
    await createDepartment(page, testDepartment);

    // Verify all fields are visible in the table
    const row = page.locator('tr', { has: page.getByText(testDepartment.code) });
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
    const row = page.locator('tr', { has: page.getByText(testDepartment.code) });
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
    await updatePromise;

    // Wait for success notification (appears before refresh)
    await expect(page.getByText(/Department updated successfully/i)).toBeVisible();

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
    const row = page.locator('tr', { has: page.getByText(testDepartment.code) });
    await row.getByRole('button', { name: /delete/i }).click();

    // Verify confirmation dialog appears
    await expect(page.getByRole('heading', { name: 'Delete Department' })).toBeVisible();
    await expect(page.getByText(`Are you sure you want to delete "${testDepartment.name}"?`)).toBeVisible();

    // Wait for the delete API call
    const deletePromise = waitForDepartmentsAPI(page, 'DELETE');

    // Confirm deletion
    await page.getByRole('button', { name: /Delete/i }).last().click();

    // Wait for delete to complete
    await deletePromise;

    // Wait for success notification (appears before refresh)
    await expect(page.getByText(/Department deleted successfully/i)).toBeVisible();

    // Wait for the table to refresh
    await waitForDepartmentsAPI(page, 'GET');

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
    const uniqueCode = `E2E-${Date.now()}`;
    const dept = { ...testDepartment, code: uniqueCode };

    // CREATE
    await createDepartment(page, dept);

    // READ
    const row = page.locator('tr', { has: page.getByText(dept.code) });
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

    await updatePromise;

    await expect(page.getByText(/Department updated successfully/i)).toBeVisible();

    await waitForDepartmentsAPI(page, 'GET');

    // Verify update
    await expect(page.getByText(newName)).toBeVisible();

    // DELETE
    const updatedRow = page.locator('tr', { has: page.getByText(dept.code) });
    await updatedRow.getByRole('button', { name: /delete/i }).click();
    await expect(page.getByRole('heading', { name: 'Delete Department' })).toBeVisible();

    const deletePromise = waitForDepartmentsAPI(page, 'DELETE');

    await page.getByRole('button', { name: /Delete/i }).last().click();

    await deletePromise;

    await expect(page.getByText(/Department deleted successfully/i)).toBeVisible();

    await waitForDepartmentsAPI(page, 'GET');

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
          await page.waitForTimeout(500);
        }
      }
    } catch (error) {
      // Cleanup failed, but that's okay
      console.log('Cleanup failed:', error.message);
    }
  });
});
