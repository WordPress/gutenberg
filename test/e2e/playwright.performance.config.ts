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
	// reporter: './config/performance-reporter.js',
} );

export default config;
