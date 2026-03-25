import { test, expect } from "@playwright/test";

const BASE_URL = process.env.JAMESDURBAN_BASE_URL ?? "http://localhost:35421";
test("has title", async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page).toHaveTitle(/James Durban/);
});
