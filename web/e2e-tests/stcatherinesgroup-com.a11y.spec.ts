import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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

test.describe("Accessibility", () => {
  for (const { url, name } of PAGES) {
    test(`${name} page has no automatically detectable accessibility violations`, async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}${url}`);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
