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

const baseTestIgnore: Array< string | RegExp > = [];
if ( Array.isArray( baseConfig.testIgnore ) ) {
	baseTestIgnore.push( ...baseConfig.testIgnore );
} else if ( baseConfig.testIgnore ) {
	baseTestIgnore.push( baseConfig.testIgnore );
}

const config = defineConfig( {
	...baseConfig,
	webServer: {
		...baseConfig.webServer,
		command: 'npm run --prefix ../.. wp-env-test -- start',
	},
	reporter: process.env.CI
		? [ [ 'github' ], [ './config/flaky-tests-reporter.ts' ], [ 'blob' ] ]
		: 'list',
	workers: 1,
	globalSetup: fileURLToPath(
		new URL( './config/global-setup.ts', 'file:' + __filename ).href
	),
	// The default suite runs RTC tests on the HTTP polling provider. Specs
	// that rely on WebSocket-only semantics live under `websocket-only/` and
	// are picked up by playwright.rtc-websocket.config.ts instead.
	testIgnore: [
		...baseTestIgnore,
		'**/specs/editor/collaboration/websocket-only/**',
	],
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
