import { expect, test, type Page } from '@playwright/test';

/** Development-only demo credentials (see README). */
const PASSWORD = 'DemoPassword!2026';
const MANAGER = 'manager@riverside.example';
const TECHNICIAN = 'tech@riverside.example';

async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test('redirects anonymous users to the login page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
});

test('rejects invalid credentials', async ({ page }) => {
  await signIn(page, MANAGER, 'wrong-password-123');
  await expect(page.getByRole('alert')).toHaveText('Invalid email or password.');
});

test('manager signs in, sees facilities and signs out', async ({ page }) => {
  await signIn(page, MANAGER);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome');
  await expect(page.getByText('Facility Manager')).toBeVisible();

  await page.getByRole('link', { name: 'Facilities' }).click();
  await expect(page.getByRole('heading', { name: 'Facilities' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Riverside Grand Hotel' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Northline Downtown Club' })).toHaveCount(0);
  await expect(page.getByRole('form', { name: 'Add facility' })).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('technician gets role-appropriate navigation and pending screens name their ticket', async ({
  page,
}) => {
  await signIn(page, TECHNICIAN);
  const nav = page.getByRole('navigation').first();
  await expect(nav.getByRole('link', { name: /My work/ })).toBeVisible();
  await expect(nav.getByRole('link', { name: /Approvals/ })).toHaveCount(0);

  await nav.getByRole('link', { name: /Inventory/ }).click();
  await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();
  await expect(page.getByText('AO-044')).toBeVisible();

  await page.goto('/facilities');
  await expect(page.getByRole('cell', { name: 'Riverside Harbour Inn' })).toBeVisible();
  await expect(page.getByRole('form', { name: 'Add facility' })).toHaveCount(0);
});

// TODO(AO-056..AO-059): PRD §9 acceptance scenarios A-01..A-15, see docs/testing/test-strategy.md.
