import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:35424";
const CARD_URL = `${BASE_URL}/christmas`;

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const MOBILE_VIEWPORT = { width: 375, height: 667 };

test.describe("Christmas Card", () => {
  test("loads as a standalone, unindexed page without errors", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    const response = await page.goto(CARD_URL);
    expect(response?.status()).toBeLessThan(400);

    await expect(page).toHaveTitle(/Christmas.*St Catherine/i);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex",
    );
    await expect(
      page.getByRole("heading", { level: 1, name: /Christmas!/ }),
    ).toBeVisible();
    // Link-only card page: no site navbar or footer
    await expect(page.locator("#site-navbar")).toHaveCount(0);
    await expect(page.locator("footer")).toHaveCount(0);

    expect(errors, "console/page errors").toEqual([]);
  });

  test("desktop: opens, closes and turns over", async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(CARD_URL);

    const card = page.locator("[data-xmas]");
    const face = (name: string) => page.locator(`[data-face="${name}"]`);
    const toggle = page.locator('[data-action="toggle"]');
    const flip = page.locator('[data-action="flip"]');

    // Closed: only the front can be interacted with
    await expect(card).toHaveAttribute("data-state", "closed");
    await expect(face("front")).not.toHaveAttribute("inert");
    await expect(face("inside-left")).toHaveAttribute("inert");

    // Clicking the cover opens the card onto the inside spread
    await face("front").click();
    await expect(card).toHaveAttribute("data-state", "open");
    await expect(toggle).toHaveText("Close the card");
    await expect(face("front")).toHaveAttribute("inert");
    await expect(face("inside-left")).not.toHaveAttribute("inert");
    await expect(face("inside-right")).not.toHaveAttribute("inert");
    await expect(
      face("inside-left").locator('a[href="mailto:clientservices@stcatherinesgroup.com"]'),
    ).toBeVisible();

    await toggle.click();
    await expect(card).toHaveAttribute("data-state", "closed");

    // Turning it over shows the social links on the back
    await flip.click();
    await expect(card).toHaveAttribute("data-state", "back");
    await expect(flip).toHaveText("Turn to the front");
    await expect(face("back")).not.toHaveAttribute("inert");
    await expect(face("back").getByRole("link")).toHaveCount(3);

    await flip.click();
    await expect(card).toHaveAttribute("data-state", "closed");
  });

  test("mobile: shows all four panels stacked, without controls", async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(CARD_URL);

    const faces = page.locator("[data-face]");
    await expect(faces).toHaveCount(4);
    for (const name of ["front", "inside-left", "inside-right", "back"]) {
      const face = page.locator(`[data-face="${name}"]`);
      await face.scrollIntoViewIfNeeded();
      await expect(face).toBeVisible();
      await expect(face).not.toHaveAttribute("inert");
    }
    await expect(page.locator('[data-action="toggle"]')).toBeHidden();

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(scrollWidth, "no horizontal scroll").toBeLessThanOrEqual(
      MOBILE_VIEWPORT.width,
    );
  });
});
