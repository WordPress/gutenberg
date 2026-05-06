/**
 * External dependencies
 */
import os from 'os';
import { fileURLToPath } from 'url';
import { defineConfig, devices } from '@playwright/test';

/**
 * WordPress dependencies
 */
import baseConfig from '@wordpress/scripts/config/playwright.config.js';

const videoModes = [
	'off',
	'on',
	'retain-on-failure',
	'on-first-retry',
] as const;
const video =
	videoModes.find( ( mode ) => mode === process.env.PLAYWRIGHT_VIDEO ) ??
	baseConfig.use.video;

const config = defineConfig( {
	...baseConfig,
	webServer: {
		...baseConfig.webServer,
		command: 'npm run --prefix ../.. wp-env-test -- start',
	},
	reporter: process.env.CI
		? [
				[ 'github' ],
				[ './config/flaky-tests-reporter.ts' ],
				[ 'blob' ],
				...( process.env.PLAYWRIGHT_JSON_OUTPUT_FILE
					? [
							[
								'json',
								{
									outputFile:
										process.env.PLAYWRIGHT_JSON_OUTPUT_FILE,
								},
							],
					  ]
					: [] ),
		  ]
		: 'list',
	workers: 1,
	globalSetup: fileURLToPath(
		new URL( './config/global-setup.ts', 'file:' + __filename ).href
	),
	use: {
		...baseConfig.use,
		video,
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices[ 'Desktop Chrome' ] },
			grepInvert: /-chromium/,
		},
		{
			name: 'webkit',
			use: {
				...devices[ 'Desktop Safari' ],
				/**
				 * Headless webkit won't receive dataTransfer with custom types in the
				 * drop event on Linux. The solution is to use `xvfb-run` to run the tests.
				 * ```sh
				 * xvfb-run npm run test:e2e
				 * ```
				 * See `.github/workflows/end2end-test-playwright.yml` for advanced usages.
				 */
				headless: os.type() !== 'Linux',
			},
			grep: /@webkit/,
			grepInvert: /-webkit/,
		},
		{
			name: 'firefox',
			use: { ...devices[ 'Desktop Firefox' ] },
			grep: /@firefox/,
			grepInvert: /-firefox/,
		},
	],
} );

export default config;
