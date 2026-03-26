import { test, expect } from "@playwright/test";

const BASE_URL =
  process.env.BLACKCATTATTOOS_BASE_URL ?? "http://localhost:35422";

test.describe("Home Page", () => {
  test("has title", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Black Cat Tattoo/i);
  });

  test("displays main content", async ({ page }) => {
    await page.goto(BASE_URL);
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("has navigation", async ({ page }) => {
    await page.goto(BASE_URL);
    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible();
  });

  test("has footer", async ({ page }) => {
    await page.goto(BASE_URL);
    const footer = page.locator("footer").first();
    await expect(footer).toBeVisible();
  });
});

test.describe("Gallery Page", () => {
  test("loads gallery page", async ({ page }) => {
    await page.goto(`${BASE_URL}/gallery`);
    await expect(page).toHaveTitle(/Black Cat Tattoo/i);
  });

  test("displays gallery content", async ({ page }) => {
    await page.goto(`${BASE_URL}/gallery`);
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("navigates to gallery from home", async ({ page }) => {
    await page.goto(BASE_URL);
    const galleryLink = page.locator('a[href*="/gallery"]').first();
    if (await galleryLink.isVisible()) {
      await galleryLink.click();
      await expect(page).toHaveURL(/\/gallery/);
    }
  });
});

test.describe("Piercing Parlour Page", () => {
  test("loads piercing parlour page", async ({ page }) => {
    await page.goto(`${BASE_URL}/piercing-parlour`);
    await expect(page).toHaveTitle(/Black Cat Tattoo/i);
  });

  test("displays piercing parlour content", async ({ page }) => {
    await page.goto(`${BASE_URL}/piercing-parlour`);
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("navigates to piercing parlour from home", async ({ page }) => {
    await page.goto(BASE_URL);
    const piercingLink = page.locator('a[href*="/piercing-parlour"]').first();
    if (await piercingLink.isVisible()) {
      await piercingLink.click();
      await expect(page).toHaveURL(/\/piercing-parlour/);
    }
  });
});

test.describe("Shop Page", () => {
  test("loads shop page", async ({ page }) => {
    await page.goto(`${BASE_URL}/shop`);
    await expect(page).toHaveTitle(/Black Cat Tattoo/i);
  });

  test("displays shop content", async ({ page }) => {
    await page.goto(`${BASE_URL}/shop`);
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("navigates to shop from home", async ({ page }) => {
    await page.goto(BASE_URL);
    const shopLink = page.locator('a[href*="/shop"]').first();
    if (await shopLink.isVisible()) {
      await shopLink.click();
      await expect(page).toHaveURL(/\/shop/);
    }
  });
});

test.describe("Contact Us Page", () => {
  test("loads contact page", async ({ page }) => {
    await page.goto(`${BASE_URL}/contact-us`);
    await expect(page).toHaveTitle(/Black Cat Tattoo/i);
  });

  test("displays contact content", async ({ page }) => {
    await page.goto(`${BASE_URL}/contact-us`);
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("navigates to contact from home", async ({ page }) => {
    await page.goto(BASE_URL);
    const contactLink = page.locator('a[href*="/contact"]').first();
    if (await contactLink.isVisible()) {
      await contactLink.click();
      await expect(page).toHaveURL(/\/contact/);
    }
  });
});

test.describe("Styles Page", () => {
  test("loads styles page", async ({ page }) => {
    await page.goto(`${BASE_URL}/styles`);
    await expect(page).toHaveTitle(/Black Cat Tattoo/i);
  });

  test("displays styles content", async ({ page }) => {
    await page.goto(`${BASE_URL}/styles`);
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("navigates to styles from home", async ({ page }) => {
    await page.goto(BASE_URL);
    const stylesLink = page.locator('a[href*="/styles"]').first();
    if (await stylesLink.isVisible()) {
      await stylesLink.click();
      await expect(page).toHaveURL(/\/styles/);
    }
  });
});

test.describe("404 Page", () => {
  test("displays 404 page for invalid route", async ({ page }) => {
    await page.goto(`${BASE_URL}/this-page-does-not-exist`, {
      waitUntil: "networkidle",
    });
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

test.describe("All Pages Load", () => {
  const pages = [
    { url: "/", name: "home" },
    { url: "/gallery", name: "gallery" },
    { url: "/piercing-parlour", name: "piercing-parlour" },
    { url: "/shop", name: "shop" },
    { url: "/contact-us", name: "contact-us" },
    { url: "/styles", name: "styles" },
  ];

  for (const { url, name } of pages) {
    test(`${name} page loads without errors`, async ({ page }) => {
      const response = await page.goto(`${BASE_URL}${url}`);
      expect(response?.status()).toBeLessThan(400);
    });
  }
});
