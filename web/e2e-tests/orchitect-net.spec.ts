import { test, expect } from "@playwright/test";

const BASE_URL = process.env.ORCHITECT_BASE_URL ?? "http://localhost:35423";

test.describe("Home Page", () => {
  test("has title", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Orchitect/i);
  });

  test("displays main content", async ({ page }) => {
    await page.goto(BASE_URL);
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("has header navigation", async ({ page }) => {
    await page.goto(BASE_URL);
    const header = page.locator("header");
    await expect(header).toBeVisible();
  });

  test("has footer", async ({ page }) => {
    await page.goto(BASE_URL);
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
  });

  test("loads without errors", async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response?.status()).toBeLessThan(400);
  });
});

test.describe("Features Page", () => {
  test("loads features page", async ({ page }) => {
    await page.goto(`${BASE_URL}/features`);
    await expect(page).toHaveTitle(/Orchitect/i);
  });

  test("displays features content", async ({ page }) => {
    await page.goto(`${BASE_URL}/features`);
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("navigates to features from home", async ({ page }) => {
    await page.goto(BASE_URL);
    const featuresLink = page.locator('a[href*="/features"]').first();
    if (await featuresLink.isVisible()) {
      await featuresLink.click();
      await expect(page).toHaveURL(/\/features/);
    }
  });

  test("loads without errors", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/features`);
    expect(response?.status()).toBeLessThan(400);
  });
});

test.describe("Navigation", () => {
  test("navigates from home to features and back", async ({ page }) => {
    await page.goto(BASE_URL);

    const featuresLink = page.locator('a[href*="/features"]').first();
    if (await featuresLink.isVisible()) {
      await featuresLink.click();
      await expect(page).toHaveURL(/\/features/);

      const homeLink = page.locator('a[href="/"]').first();
      if (await homeLink.isVisible()) {
        await homeLink.click();
        await expect(page).toHaveURL(BASE_URL + "/");
      }
    }
  });
});

test.describe("All Pages Load", () => {
  const pages = [
    { url: "/", name: "home" },
    { url: "/features", name: "features" },
  ];

  for (const { url, name } of pages) {
    test(`${name} page loads without errors`, async ({ page }) => {
      const response = await page.goto(`${BASE_URL}${url}`);
      expect(response?.status()).toBeLessThan(400);
    });
  }
});
