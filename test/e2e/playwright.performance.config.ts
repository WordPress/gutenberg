/**
 * External dependencies
 */
import { fileURLToPath } from 'url';
import { defineConfig } from '@playwright/test';

/**
 * Internal dependencies
 */
import baseConfig from './playwright.config';

const config = defineConfig( {
	...baseConfig,
	testDir: fileURLToPath(
		new URL( './specs/performance', 'file:' + __filename ).href
	),
	reporter: process.env.CI
		? undefined // We're using another reporter in CI.
		: [ [ 'list' ], [ './config/performance-reporter.ts' ] ],
} );

export default config;
