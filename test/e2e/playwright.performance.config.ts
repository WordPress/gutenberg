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
	fullyParallel: false,
	workers: 1,
	testDir: fileURLToPath(
		new URL( './specs/performance', 'file:' + __filename ).href
	),
	testIgnore: undefined,
	reporter: process.env.CI
		? undefined // We're using another reporter in CI.
		: [ [ 'list' ], [ './config/performance-reporter.ts' ] ],
} );

export default config;
