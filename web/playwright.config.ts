import {defineConfig, devices} from '@playwright/test';
/*
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({path: path.resolve(__dirname, '.env')});
*/

export default defineConfig({
    testDir: '././e2e-tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: {...devices['Desktop Chrome']},
        },
        {
            name: 'firefox',
            use: {...devices['Desktop Firefox']},
        },
        {
            name: 'webkit',
            use: {...devices['Desktop Safari']},
        }
    ],
    webServer: [
        {
            command: 'pnpm --filter jamesdurban.com dev',
            url: 'http://localhost:35421',
            timeout: 120 * 1000,
            reuseExistingServer: !process.env.CI,
        },
    ]
});
