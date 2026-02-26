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

// The Playground runtime (WASM PHP) is ~3x slower than Docker.
// Scale up timeouts to avoid false negatives in CI.
const timeoutMultiplier = process.env.TIMEOUT_MULTIPLIER
	? Number( process.env.TIMEOUT_MULTIPLIER )
	: 1;

const config = defineConfig( {
	...baseConfig,
	timeout: ( baseConfig.timeout ?? 100_000 ) * timeoutMultiplier,
	expect: {
		...baseConfig.expect,
		timeout: ( baseConfig.expect?.timeout ?? 5_000 ) * timeoutMultiplier,
	},
	webServer: {
		...baseConfig.webServer,
		command: 'npm run wp-env-test -- start',
	},
	reporter: process.env.CI
		? [ [ 'github' ], [ './config/flaky-tests-reporter.ts' ] ]
		: 'list',
	workers: 1,
	globalSetup: fileURLToPath(
		new URL( './config/global-setup.ts', 'file:' + __filename ).href
	),
	use: {
		...baseConfig.use,
		actionTimeout:
			( baseConfig.use?.actionTimeout ?? 10_000 ) * timeoutMultiplier,
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
