/**
 * External dependencies
 */
import type { PlaywrightTestConfig } from '@playwright/experimental-ct-react';
import { devices } from '@playwright/experimental-ct-react';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
	testDir: '../../',
	testMatch: /.*\.ct\.[jt]sx?$/,
	outputDir: './test-results',
	/* The base directory, relative to the config file, for snapshot files created with toMatchSnapshot and toHaveScreenshot. */
	snapshotDir: './__snapshots__',
	/* Maximum time one test can run for. */
	timeout: 10 * 1000,
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !! process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: [ [ 'html', { outputFolder: 'playwright-report' } ] ],
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		ctTemplateDir: 'template',

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'retain-on-failure',
		screenshot: 'on',
		video: 'on-first-retry',

		/* Port to use for Playwright component endpoint. */
		ctPort: 3100,

		ctViteConfig: {
			// @ts-ignore: A hack to prevent playwright from overriding the config.
			get esbuild() {
				return {
					loader: 'tsx',
					include: /.*\.[tj]sx?$/,
					exclude: [],
				};
			},
			// @ts-ignore: A hack to prevent playwright from overriding the config.
			set esbuild( _options ) {
				// Ignore setter.
			},
		},
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: 'chromium',
			use: {
				...devices[ 'Desktop Chrome' ],
			},
		},
		{
			name: 'firefox',
			use: {
				...devices[ 'Desktop Firefox' ],
			},
		},
		{
			name: 'webkit',
			use: {
				...devices[ 'Desktop Safari' ],
			},
		},
	],
};

export default config;
