import { test, expect } from "@playwright/test";

const BASE_URL =
  process.env.STCATHERINESGROUP_BASE_URL ?? "http://localhost:35424";

const PAGES = [
  { url: "/", name: "home" },
  { url: "/about-us", name: "about-us" },
  { url: "/contact", name: "contact" },
  { url: "/testimonials", name: "testimonials" },
  { url: "/nurses/carehome-nurses", name: "nurses-carehome" },
  { url: "/nurses/hospital-nurses", name: "nurses-hospital" },
  { url: "/nurses/practice-nurses", name: "nurses-practice" },
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

const NURSES_PAGES = [
  { url: "/nurses/carehome-nurses", name: "Carehome Nurses" },
  { url: "/nurses/hospital-nurses", name: "Hospital Nurses" },
  { url: "/nurses/practice-nurses", name: "Practice Nurses" },
];

const SERVICES_PAGES = [
  { url: "/services/1-1-chaperone-carer", name: "1-1 Chaperone Carer" },
  {
    url: "/services/1-1-companionship-carer",
    name: "1-1 Companionship Carer",
  },
  { url: "/services/1-1-dementia-carer", name: "1-1 Dementia Carer" },
  { url: "/services/1-1-safety-carer", name: "1-1 Safety Carer" },
  { url: "/services/personal-assistants", name: "Personal Assistants" },
];

test.describe("Page Health & Metadata", () => {
  for (const { url, name } of PAGES) {
    test(`${name} page is healthy`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      page.on("pageerror", (err) => pageErrors.push(err.message));

      const response = await page.goto(`${BASE_URL}${url}`);
      expect(response?.status()).toBeLessThan(400);

      await expect(page).toHaveTitle(/St Catherine/i);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        /.+/,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        "https://stcatherinesgroup.com/",
      );
      // .first() - the home page's Hero h1 sits outside <main>, and Astro's
      // dev toolbar (mounted later in the DOM) injects its own h1 elements
      await expect(page.locator("h1").first()).toBeVisible();

      expect(consoleErrors, `console errors on ${url}`).toEqual([]);
      expect(pageErrors, `page errors on ${url}`).toEqual([]);
    });
  }
});

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

test.describe("Footer", () => {
  test("care services links resolve correctly", async ({ page }) => {
    await page.goto(BASE_URL);
    const footer = page.locator("footer").first();
    const expected = [
      {
        name: "1-1 Companionship Carer",
        href: "/services/1-1-companionship-carer",
      },
      { name: "1-1 Chaperone Carer", href: "/services/1-1-chaperone-carer" },
      { name: "1-1 Dementia Carer", href: "/services/1-1-dementia-carer" },
      { name: "1-1 Safety Carer", href: "/services/1-1-safety-carer" },
      { name: "Personal Assistant", href: "/services/personal-assistants" },
    ];
    for (const { name, href } of expected) {
      await expect(footer.getByRole("link", { name })).toHaveAttribute(
        "href",
        href,
      );
    }
  });

  test("nursing services links resolve correctly", async ({ page }) => {
    await page.goto(BASE_URL);
    const footer = page.locator("footer").first();
    const expected = [
      { name: "Hospital Nurses", href: "/nurses/hospital-nurses" },
      { name: "Care Home Nurses", href: "/nurses/carehome-nurses" },
      { name: "Practice Nurses", href: "/nurses/practice-nurses" },
    ];
    for (const { name, href } of expected) {
      await expect(footer.getByRole("link", { name })).toHaveAttribute(
        "href",
        href,
      );
    }
  });

  test("quick links resolve correctly", async ({ page }) => {
    await page.goto(BASE_URL);
    const footer = page.locator("footer").first();
    const expected = [
      { name: "About Us", href: "/about-us" },
      { name: "Contact Us", href: "/contact" },
    ];
    for (const { name, href } of expected) {
      await expect(footer.getByRole("link", { name })).toHaveAttribute(
        "href",
        href,
      );
    }
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
    await expect(main.locator("h1")).toBeVisible();
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

  test("has correct phone and email contact links", async ({ page }) => {
    await page.goto(`${BASE_URL}/contact`);
    const main = page.locator("main");
    await expect(main.locator('a[href="tel:+442036633074"]')).toBeVisible();
    await expect(main.locator('a[href="tel:+447780149826"]')).toBeVisible();
    await expect(
      main.locator('a[href="mailto:clientservices@stcatherinesgroup.com"]'),
    ).toBeVisible();
  });

  test("primary phone number is consistent between navbar and page content", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/contact`);
    // one instance in the navbar utility bar, one in the page's own content
    await expect(page.locator('a[href="tel:+442036633074"]')).toHaveCount(2);
  });
});

test.describe("Testimonials Page", () => {
  test("has title", async ({ page }) => {
    await page.goto(`${BASE_URL}/testimonials`);
    await expect(page).toHaveTitle(/St Catherine/i);
  });

  test("displays testimonials content", async ({ page }) => {
    await page.goto(`${BASE_URL}/testimonials`);
    await expect(page.locator("main")).toBeVisible();
  });

  test("shows both testimonial sections with correct headings", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/testimonials`);
    await expect(
      page.getByRole("heading", { name: "What Families Say" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "What Our Clients Say" }),
    ).toBeVisible();
  });

  test("care services section renders unique, well-formed testimonial cards", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/testimonials`);
    const section = page.locator("section", {
      has: page.getByRole("heading", { name: "What Families Say" }),
    });

    const quotes = await section.locator("blockquote").allTextContents();
    expect(quotes.length).toBeGreaterThan(0);
    expect(new Set(quotes).size).toBe(quotes.length);

    const firstCard = section.locator(".grid > div").first();
    await expect(firstCard.locator("blockquote")).not.toBeEmpty();
    const meta = await firstCard.locator("p").nth(1).textContent();
    expect(meta).toContain("•");
  });

  test("nursing services section renders unique, well-formed testimonial cards", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/testimonials`);
    const section = page.locator("section", {
      has: page.getByRole("heading", { name: "What Our Clients Say" }),
    });

    const quotes = await section.locator("blockquote").allTextContents();
    expect(quotes.length).toBeGreaterThan(0);
    expect(new Set(quotes).size).toBe(quotes.length);

    const firstCard = section.locator(".grid > div").first();
    await expect(firstCard.locator("blockquote")).not.toBeEmpty();
    const meta = await firstCard.locator("p").nth(1).textContent();
    expect(meta).toContain("•");
  });
});

test.describe("Nurses Pages", () => {
  for (const { url, name } of NURSES_PAGES) {
    test(`loads ${name} page`, async ({ page }) => {
      await page.goto(`${BASE_URL}${url}`);
      await expect(page).toHaveTitle(/St Catherine/i);
    });

    test(`displays ${name} content`, async ({ page }) => {
      await page.goto(`${BASE_URL}${url}`);
      const main = page.locator("main");
      await expect(main).toBeVisible();
    });

    test(`${name} page has a visible heading and testimonial`, async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}${url}`);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator("main h1")).not.toBeEmpty();
      await expect(page.locator("blockquote").first()).toBeVisible();
    });
  }
});

test.describe("Services Pages", () => {
  for (const { url, name } of SERVICES_PAGES) {
    test(`loads ${name} page`, async ({ page }) => {
      await page.goto(`${BASE_URL}${url}`);
      await expect(page).toHaveTitle(/St Catherine/i);
    });

    test(`displays ${name} content`, async ({ page }) => {
      await page.goto(`${BASE_URL}${url}`);
      const main = page.locator("main");
      await expect(main).toBeVisible();
    });

    test(`${name} page has a visible heading and testimonial`, async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}${url}`);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator("main h1")).not.toBeEmpty();
      await expect(page.locator("blockquote").first()).toBeVisible();
    });
  }
});

test.describe("404 Handling", () => {
  test("returns a 404 status for an unknown route", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/this-page-does-not-exist`);
    expect(response?.status()).toBe(404);
  });
});
