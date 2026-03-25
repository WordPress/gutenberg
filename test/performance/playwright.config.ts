/**
 * External dependencies
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from '@playwright/test';

/**
 * WordPress dependencies
 */
import baseConfig from '@wordpress/scripts/config/playwright.config.js';

process.env.ASSETS_PATH = path.join( __dirname, 'assets' );

const config = defineConfig( {
	...baseConfig,
	reporter: [ [ 'list' ], [ './config/performance-reporter.ts' ] ],
	forbidOnly: !! process.env.CI,
	fullyParallel: false,
	retries: 0,
	timeout: parseInt( process.env.TIMEOUT || '', 10 ) || 600_000, // Defaults to 10 minutes.
	reportSlowTests: null,
	globalSetup: fileURLToPath(
		new URL( './config/global-setup.ts', 'file:' + __filename ).href
	),
	use: {
		...baseConfig.use,
		actionTimeout: 120_000, // 2 minutes.
		video: 'off',
		launchOptions: {
			...baseConfig.use?.launchOptions,
			args: [
				...( baseConfig.use?.launchOptions?.args || [] ),
				// Enable SharedArrayBuffer for vips WASM-based image processing.
				// Required when Document-Isolation-Policy alone is insufficient.
				'--enable-features=SharedArrayBuffer',
			],
		},
	},
} );

export default config;
