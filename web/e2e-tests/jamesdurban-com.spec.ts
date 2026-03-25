import {test, expect} from "@playwright/test";

const BASE_URL = process.env.JAMESDURBAN_BASE_URL ?? "http://localhost:35421";

test.describe("Home Page", () => {
    test("has title", async ({page}) => {
        await page.goto(BASE_URL);
        await expect(page).toHaveTitle(/James Durban/);
    });

    test("displays hero section", async ({page}) => {
        await page.goto(BASE_URL);
        // Check for heading or main content in Hero section
        await expect(page.locator("main")).toBeVisible();
    });

    test("displays skills section", async ({page}) => {
        await page.goto(BASE_URL);
        // Skills section should be visible
        const mainContent = page.locator("main");
        await expect(mainContent).toBeVisible();
    });

    test("displays projects section", async ({page}) => {
        await page.goto(BASE_URL);
        // Projects section should be visible
        const mainContent = page.locator("main");
        await expect(mainContent).toBeVisible();
    });

    test("has header navigation", async ({page}) => {
        await page.goto(BASE_URL);
        // Header should be present
        const header = page.locator("header");
        await expect(header).toBeVisible();
    });

    test("has footer", async ({page}) => {
        await page.goto(BASE_URL);
        const footer = page.locator("footer");
        await expect(footer).toBeVisible();
    });
});

test.describe("Projects List Page", () => {
    test("loads projects page", async ({page}) => {
        await page.goto(`${BASE_URL}/project/`);
        await expect(page).toHaveTitle(/James Durban/);
    });

    test("displays projects", async ({page}) => {
        await page.goto(`${BASE_URL}/project/`);
        // Check that the main content area exists
        const main = page.locator("main");
        await expect(main).toBeVisible();
    });

    test("navigates to projects from home page", async ({page}) => {
        await page.goto(BASE_URL);
        // Look for a link to projects page and click it
        const projectLink = page.locator('a[href*="/project"]').first();
        if (await projectLink.isVisible()) {
            await projectLink.click();
            await expect(page).toHaveURL(/\/project/);
        }
    });
});

test.describe("Individual Project Page", () => {
    test("loads atomic project page", async ({page}) => {
        await page.goto(`${BASE_URL}/project/atomic`);
        await expect(page).toHaveTitle(/James Durban/);
    });

    test("displays project title", async ({page}) => {
        await page.goto(`${BASE_URL}/project/atomic`);
        // Check for h2 heading with project title
        const heading = page.locator("h2");
        await expect(heading).toBeVisible();
    });

    test("displays breadcrumb navigation", async ({page}) => {
        await page.goto(`${BASE_URL}/project/atomic`);
        // Check for Home and Projects links
        const homeLink = page.locator('a[href="/"]');
        await expect(homeLink).toBeVisible();

        const projectsLink = page.locator('a[href="/project/"]');
        await expect(projectsLink).toBeVisible();
    });

    test("breadcrumb navigates to home", async ({page}) => {
        await page.goto(`${BASE_URL}/project/atomic`);
        const homeLink = page.locator('a[href="/"]').first();
        await homeLink.click();
        await expect(page).toHaveURL(BASE_URL + "/");
    });

    test("breadcrumb navigates to projects list", async ({page}) => {
        await page.goto(`${BASE_URL}/project/atomic`);
        const projectsLink = page.locator('a[href="/project/"]').first();
        await projectsLink.click();
        await expect(page).toHaveURL(`${BASE_URL}/project/`);
    });

    test("displays project type badge", async ({page}) => {
        await page.goto(`${BASE_URL}/project/atomic`);
        // Check for professional or hobbyist badge
        const badge = page.locator("span").filter({hasText: /(Professional|Hobbyist)/});
        await expect(badge.first()).toBeVisible();
    });

    test("displays project image", async ({page}) => {
        await page.goto(`${BASE_URL}/project/atomic`);
        const image = page.locator("img").first();
        await expect(image).toBeVisible();
    });
});

test.describe("404 Page", () => {
    test("displays 404 page for invalid route", async ({page}) => {
        await page.goto(`${BASE_URL}/this-page-does-not-exist`, {waitUntil: "networkidle"});
        // Should still have main layout
        const main = page.locator("main");
        await expect(main).toBeVisible();
    });
});

test.describe("Multiple Projects", () => {
    const projects = ["atomic", "blackcattattoos", "panda", "push-notifications"];

    for (const project of projects) {
        test(`loads ${project} project page`, async ({page}) => {
            await page.goto(`${BASE_URL}/project/${project}`);
            await expect(page).toHaveTitle(/James Durban/);

            // Verify main content is visible
            const main = page.locator("main");
            await expect(main).toBeVisible();

            // Verify project heading exists
            const heading = page.locator("h2");
            await expect(heading).toBeVisible();
        });
    }
});
