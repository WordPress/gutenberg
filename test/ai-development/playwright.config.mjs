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
	// Safety net only. Tests run the agent with spawnSync, which blocks the
	// worker — Playwright can't interrupt a session in progress, so a hung
	// session is actually killed by the session timeout in agent.mjs. Keep
	// this value larger than that one: the session then dies first and the
	// test fails with a saved transcript instead of a torn-down worker.
	timeout: 12 * 60 * 1000,
} );
