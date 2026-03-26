import { test, expect } from "@playwright/test";

const BASE_URL =
  process.env.THECONTOURCLINICRICHMOND_BASE_URL ?? "http://localhost:35425";

test.describe("Home Page", () => {
  test("has title", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Contour Clinic/i);
  });

  test("displays main content", async ({ page }) => {
    await page.goto(BASE_URL);
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("loads without errors", async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response?.status()).toBeLessThan(400);
  });

  test("page is responsive", async ({ page }) => {
    await page.goto(BASE_URL);

    await page.setViewportSize({ width: 375, height: 667 });
    const body = page.locator("body");
    await expect(body).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(body).toBeVisible();

    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(body).toBeVisible();
  });
});
