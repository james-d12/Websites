import { test, expect } from "@playwright/test";

const BASE_URL =
  process.env.STCATHERINESGROUP_BASE_URL ?? "http://localhost:35424";

// Tailwind's default 2xl breakpoint (1536px) is where the desktop nav swaps
// in for the mobile hamburger menu (see Navbar.astro: "hidden 2xl:flex" /
// "2xl:hidden").
const DESKTOP_VIEWPORT = { width: 1920, height: 1080 };
const MOBILE_VIEWPORT = { width: 375, height: 667 };

test.describe("Navbar - Desktop", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(BASE_URL);
  });

  test("utility bar phone link is correct", async ({ page }) => {
    const phone = page.locator('a[href="tel:+442036633074"]').first();
    await expect(phone).toBeVisible();
  });

  test("utility bar Contact Us CTA links to /contact", async ({ page }) => {
    // scope to the sticky navbar wrapper - the footer also has a "Contact
    // Us" link, but with different text/href-adjacent markup elsewhere.
    const stickyNav = page.locator(".sticky.top-0").first();
    await expect(
      stickyNav.getByRole("link", { name: "Contact Us" }),
    ).toHaveAttribute("href", "/contact");
  });

  test("primary nav links have correct hrefs", async ({ page }) => {
    // scope to the desktop <ul> - the same links also exist in the (hidden)
    // mobile menu markup, so an unscoped locator would be ambiguous.
    // attribute selector avoids CSS class-selector parsing issues with the
    // leading digit in the "2xl:flex" Tailwind class
    const desktopNav = page.locator('ul[class*="2xl:flex"]');
    await expect(
      desktopNav.getByRole("link", { name: "About", exact: true }),
    ).toHaveAttribute("href", "/about-us");
    await expect(
      desktopNav.getByRole("link", { name: "Testimonials", exact: true }),
    ).toHaveAttribute("href", "/testimonials");
    await expect(
      desktopNav.getByRole("link", { name: "Contact", exact: true }),
    ).toHaveAttribute("href", "/contact");
  });

  test("Services dropdown reveals all 5 service links on hover", async ({
    page,
  }) => {
    const desktopNav = page.locator('ul[class*="2xl:flex"]');
    await desktopNav.getByText("Services", { exact: true }).hover();

    const expected = [
      "/services/1-1-chaperone-carer",
      "/services/1-1-companionship-carer",
      "/services/1-1-dementia-carer",
      "/services/1-1-safety-carer",
      "/services/personal-assistants",
    ];
    for (const href of expected) {
      await expect(desktopNav.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });

  test("Nurses dropdown reveals all 3 nurse links on hover", async ({
    page,
  }) => {
    const desktopNav = page.locator('ul[class*="2xl:flex"]');
    await desktopNav.getByText("Nurses", { exact: true }).hover();

    const expected = [
      "/nurses/carehome-nurses",
      "/nurses/hospital-nurses",
      "/nurses/practice-nurses",
    ];
    for (const href of expected) {
      await expect(desktopNav.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });
});

test.describe("Navbar - Mobile Menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(BASE_URL);
  });

  test("hamburger button is visible and starts collapsed", async ({ page }) => {
    const btn = page.locator("#mobile-menu-btn");
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  test("clicking the hamburger opens the menu", async ({ page }) => {
    const btn = page.locator("#mobile-menu-btn");
    await btn.click();
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#mobile-menu")).toBeVisible();
  });

  test("expanding the Services dropdown reveals its links", async ({
    page,
  }) => {
    await page.locator("#mobile-menu-btn").click();
    const toggle = page.locator(".mobile-dropdown-toggle", {
      hasText: "Services",
    });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    const panelId = await toggle.getAttribute("aria-controls");
    await expect(page.locator(`#${panelId} a`)).toHaveCount(5);
  });

  test("pressing Escape closes the menu", async ({ page }) => {
    const btn = page.locator("#mobile-menu-btn");
    await btn.click();
    await expect(page.locator("#mobile-menu")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator("#mobile-menu")).toBeHidden();
    await expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  test("clicking outside the menu closes it", async ({ page }) => {
    const btn = page.locator("#mobile-menu-btn");
    await btn.click();
    await expect(page.locator("#mobile-menu")).toBeVisible();

    // top-left corner sits inside the sticky nav bar but outside both the
    // hamburger button and the dropdown menu panel below it.
    await page.mouse.click(5, 5);
    await expect(page.locator("#mobile-menu")).toBeHidden();
    await expect(btn).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("Responsive Layout", () => {
  test("body remains visible across viewport sizes", async ({ page }) => {
    await page.goto(BASE_URL);
    for (const size of [
      MOBILE_VIEWPORT,
      { width: 768, height: 1024 },
      DESKTOP_VIEWPORT,
    ]) {
      await page.setViewportSize(size);
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("mobile hamburger shows and desktop nav hides at a narrow viewport", async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(BASE_URL);
    await expect(page.locator("#mobile-menu-btn")).toBeVisible();
    await expect(page.locator('ul[class*="2xl:flex"]')).toBeHidden();
  });

  test("desktop nav shows and mobile hamburger hides at a wide viewport", async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(BASE_URL);
    await expect(page.locator("#mobile-menu-btn")).toBeHidden();
    await expect(page.locator('ul[class*="2xl:flex"]')).toBeVisible();
  });
});
