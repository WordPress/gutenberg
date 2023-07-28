/**
 * External dependencies
 */
import { fileURLToPath } from 'url';
import { defineConfig } from '@playwright/test';

/**
 * WordPress dependencies
 */
const baseConfig = require( '@wordpress/scripts/config/playwright.config' );

const config = defineConfig( {
	...baseConfig,
	reporter: process.env.CI
		? undefined // We're using another reporter in CI.
		: [ [ 'list' ], [ './config/performance-reporter.ts' ] ],
	forbidOnly: !! process.env.CI,
	fullyParallel: false,
	retries: 0,
	timeout: parseInt( process.env.TIMEOUT || '', 10 ) || 600_000, // Defaults to 10 minutes.
	globalSetup: fileURLToPath(
		new URL( './config/global-setup.ts', 'file:' + __filename ).href
	),
	use: {
		...baseConfig.use,
		video: 'off',
	},
} );

export default config;
