/**
 * Playwright is used here purely as a test runner — no browsers are involved.
 * Each test spawns a real, headless agent CLI session, which costs minutes
 * and real tokens: this config must only ever be invoked explicitly via
 * `npm run test:ai-development`, never swept up by CI or default test globs.
 */

/**
 * External dependencies
 */
import { defineConfig } from '@playwright/test';

export default defineConfig( {
	testDir: './specs',
	outputDir: './artifacts/test-results',
	workers: 1,
	fullyParallel: false,
	reporter: 'list',
	// Individual tests set their own timeout from the scenario file.
	timeout: 30 * 60 * 1000,
} );
