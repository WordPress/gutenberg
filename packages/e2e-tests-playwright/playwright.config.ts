/**
 * External dependencies
 */
import path from 'path';
import { devices } from '@playwright/test';
import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	reporter: process.env.CI
		? [ [ 'github' ], [ './config/flaky-tests-reporter.ts' ] ]
		: 'list',
	forbidOnly: !! process.env.CI,
	workers: 1,
	retries: process.env.CI ? 2 : 0,
	timeout: parseInt( process.env.TIMEOUT || '', 10 ) || 100_000, // Defaults to 100 seconds.
	// Don't report slow test "files", as we will be running our tests in serial.
	reportSlowTests: null,
	testDir: new URL( './specs', 'file:' + __filename ).pathname,
	outputDir: path.join( process.cwd(), 'artifacts/test-results' ),
	use: {
		headless: true,
		viewport: {
			width: 960,
			height: 700,
		},
		ignoreHTTPSErrors: true,
		locale: 'en-US',
		contextOptions: {
			reducedMotion: 'reduce',
			strictSelectors: true,
		},
		actionTimeout: 10_000, // 10 seconds.
		trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'on-first-retry',
	},
	webServer: {
		command: 'npm run wp-env start',
		port: 8889,
		timeout: 120_000, // 120 seconds.
		reuseExistingServer: true,
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices[ 'Desktop Chrome' ] },
		},
	],
};

export default config;
