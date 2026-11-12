import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, devices } from '@playwright/test';
import baseConfig from '@wordpress/scripts/config/playwright.config.js';

const baseTestIgnore: Array< string | RegExp > = [];
if ( Array.isArray( baseConfig.testIgnore ) ) {
	baseTestIgnore.push( ...baseConfig.testIgnore );
} else if ( baseConfig.testIgnore ) {
	baseTestIgnore.push( baseConfig.testIgnore );
}

// With a comma-separated list of sites in `WP_BASE_URLS`, each worker runs
// its tests on its own site, so tests can run in parallel.
const sites = process.env.WP_BASE_URLS?.split( ',' );
if ( sites ) {
	const index = Number( process.env.TEST_PARALLEL_INDEX ?? 0 );
	process.env.WP_BASE_URL = sites[ index ];
	process.env.STORAGE_STATE_PATH = path.join(
		process.env.WP_ARTIFACTS_PATH!,
		`storage-states/admin-${ index }.json`
	);
}

const flakinessOptions = {
	/*
	 * Tests dashboard is available at https://flakiness.io/WordPress/gutenberg
	 */
	flakinessProject: 'WordPress/gutenberg',
	/*
	 * Use historical test-duration data to balance shards.
	 * Documentation is available at https://github.com/flakiness/playwright
	 */
	shardBalancing: {
		timingsFile: './timings.json',
	},
	/*
	 * Only upload to Flakiness.io for the official WordPress/Gutenberg
	 * repository. Forks and private mirrors are not configured on the service.
	 */
	disableUpload: process.env.GITHUB_REPOSITORY !== 'WordPress/gutenberg',
};

const config = defineConfig( {
	...baseConfig,
	workers: sites?.length ?? 1,
	webServer: {
		...baseConfig.webServer,
		command: 'npm run --prefix ../.. wp-env-test -- start',
	},
	reporter: process.env.CI
		? [
				[ 'github' ],
				[ './config/flaky-tests-reporter.ts' ],
				[ 'blob' ],
				[ '@flakiness/playwright', flakinessOptions ],
			]
		: [ [ 'list' ], [ '@flakiness/playwright', flakinessOptions ] ],
	use: {
		...baseConfig.use,
		...( sites && {
			baseURL: process.env.WP_BASE_URL,
			storageState: process.env.STORAGE_STATE_PATH,
		} ),
		// Recording a trace for every test costs about a third of the CPU, so
		// only record one when a failed test is retried.
		trace: 'on-first-retry',
	},
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
