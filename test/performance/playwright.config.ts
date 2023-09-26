/**
 * External dependencies
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from '@playwright/test';

/**
 * WordPress dependencies
 */
const baseConfig = require( '@wordpress/scripts/config/playwright.config' );

process.env.ASSETS_PATH = path.join( __dirname, 'assets' );

const config = defineConfig( {
	...baseConfig.default,
	reporter: process.env.CI
		? './config/performance-reporter.ts'
		: [ [ 'list' ], [ './config/performance-reporter.ts' ] ],
	forbidOnly: !! process.env.CI,
	fullyParallel: false,
	retries: 0,
	timeout: parseInt( process.env.TIMEOUT || '', 10 ) || 600_000, // Defaults to 10 minutes.
	reportSlowTests: null,
	globalSetup: fileURLToPath(
		new URL( './config/global-setup.ts', 'file:' + __filename ).href
	),
	use: {
		...baseConfig.default.use,
		video: 'off',
	},
} );

export default config;
