import { test, expect } from "@playwright/test";

const BASE_URL =
  process.env.STCATHERINESGROUP_BASE_URL ?? "http://localhost:35424";

test.describe("Home Page", () => {
  test("has title", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/St Catherine/i);
  });

  test("displays main content", async ({ page }) => {
    await page.goto(BASE_URL);
    const main = page.locator("main");
    await expect(main).toBeVisible();
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

test.describe("About Us Page", () => {
  test("loads about us page", async ({ page }) => {
    await page.goto(`${BASE_URL}/about-us`);
    await expect(page).toHaveTitle(/St Catherine/i);
  });

  test("displays about content", async ({ page }) => {
    await page.goto(`${BASE_URL}/about-us`);
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("navigates to about from home", async ({ page }) => {
    await page.goto(BASE_URL);
    const aboutLink = page.locator('a[href*="/about"]').first();
    if (await aboutLink.isVisible()) {
      await aboutLink.click();
      await expect(page).toHaveURL(/\/about/);
    }
  });
});

test.describe("Contact Page", () => {
  test("loads contact page", async ({ page }) => {
    await page.goto(`${BASE_URL}/contact`);
    await expect(page).toHaveTitle(/St Catherine/i);
  });

  test("displays contact content", async ({ page }) => {
    await page.goto(`${BASE_URL}/contact`);
    const main = page.locator("main");
    await expect(main).toBeVisible();
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

test.describe("Enquiries Page", () => {
  test("loads enquiries page", async ({ page }) => {
    await page.goto(`${BASE_URL}/enquiries`);
    await expect(page).toHaveTitle(/St Catherine/i);
  });

  test("displays enquiries content", async ({ page }) => {
    await page.goto(`${BASE_URL}/enquiries`);
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("navigates to enquiries from home", async ({ page }) => {
    await page.goto(BASE_URL);
    const enquiriesLink = page.locator('a[href*="/enquiries"]').first();
    if (await enquiriesLink.isVisible()) {
      await enquiriesLink.click();
      await expect(page).toHaveURL(/\/enquiries/);
    }
  });
});

test.describe("Nurses Pages", () => {
  const nursesPages = [
    { url: "/nurses/carehome-nurses", name: "Carehome Nurses" },
    { url: "/nurses/hospital-nurses", name: "Hospital Nurses" },
    { url: "/nurses/practice-nurses", name: "Practice Nurses" },
    { url: "/nurses/vaccination-nurses", name: "Vaccination Nurses" },
  ];

  for (const { url, name } of nursesPages) {
    test(`loads ${name} page`, async ({ page }) => {
      await page.goto(`${BASE_URL}${url}`);
      await expect(page).toHaveTitle(/St Catherine/i);
    });

    test(`displays ${name} content`, async ({ page }) => {
      await page.goto(`${BASE_URL}${url}`);
      const main = page.locator("main");
      await expect(main).toBeVisible();
    });
  }
});

test.describe("Services Pages", () => {
  const servicesPages = [
    { url: "/services/1-1-chaperone-carer", name: "1-1 Chaperone Carer" },
    {
      url: "/services/1-1-companionship-carer",
      name: "1-1 Companionship Carer",
    },
    { url: "/services/1-1-dementia-carer", name: "1-1 Dementia Carer" },
    { url: "/services/1-1-safety-carer", name: "1-1 Safety Carer" },
    { url: "/services/personal-assistants", name: "Personal Assistants" },
  ];

  for (const { url, name } of servicesPages) {
    test(`loads ${name} page`, async ({ page }) => {
      await page.goto(`${BASE_URL}${url}`);
      await expect(page).toHaveTitle(/St Catherine/i);
    });

    test(`displays ${name} content`, async ({ page }) => {
      await page.goto(`${BASE_URL}${url}`);
      const main = page.locator("main");
      await expect(main).toBeVisible();
    });
  }
});

test.describe("All Pages Load", () => {
  const pages = [
    { url: "/", name: "home" },
    { url: "/about-us", name: "about-us" },
    { url: "/contact", name: "contact" },
    { url: "/enquiries", name: "enquiries" },
    { url: "/nurses/carehome-nurses", name: "nurses-carehome" },
    { url: "/nurses/hospital-nurses", name: "nurses-hospital" },
    { url: "/nurses/practice-nurses", name: "nurses-practice" },
    { url: "/nurses/vaccination-nurses", name: "nurses-vaccination" },
    { url: "/services/1-1-chaperone-carer", name: "services-chaperone" },
    {
      url: "/services/1-1-companionship-carer",
      name: "services-companionship",
    },
    { url: "/services/1-1-dementia-carer", name: "services-dementia" },
    { url: "/services/1-1-safety-carer", name: "services-safety" },
    {
      url: "/services/personal-assistants",
      name: "services-personal-assistants",
    },
  ];

  for (const { url, name } of pages) {
    test(`${name} page loads without errors`, async ({ page }) => {
      const response = await page.goto(`${BASE_URL}${url}`);
      expect(response?.status()).toBeLessThan(400);
    });
  }
});
