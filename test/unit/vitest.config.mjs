import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import {
	discoverTestFiles,
	getVitestTestsByProject,
} from './scripts/discover-test-files.mjs';

const ROOT_DIR = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../..'
);
const testMigration = JSON.parse(
	readFileSync(
		path.join( ROOT_DIR, 'test/unit/test-migration.json' ),
		'utf8'
	)
);
const vitestTests = getVitestTestsByProject(
	discoverTestFiles( ROOT_DIR ),
	testMigration
);

// Preserve Jest's repository-root configuration discovery and default timezone.
process.chdir( ROOT_DIR );
process.env.TZ = 'UTC';

export default defineConfig( {
	root: ROOT_DIR,
	test: {
		projects: [
			{
				extends: true,
				test: {
					name: 'node',
					environment: 'node',
					include: vitestTests.node,
				},
			},
			{
				extends: true,
				test: {
					name: 'jsdom',
					environment: 'jsdom',
					environmentOptions: {
						jsdom: {
							url: 'http://localhost/',
						},
					},
					include: vitestTests.jsdom,
				},
			},
			{
				extends: true,
				test: {
					name: 'browser',
					include: vitestTests.browser,
					browser: {
						enabled: true,
						headless: true,
						instances: [ { browser: 'chromium' } ],
						provider: playwright(),
					},
				},
			},
		],
		globals: false,
		includeTaskLocation: true,
		passWithNoTests: false,
		reporters:
			process.env.CI &&
			process.env.GITHUB_REPOSITORY === 'WordPress/gutenberg'
				? [
						'default',
						'github-actions',
						[
							/*
							 * Resolve to an absolute path so Vitest can load
							 * the reporter regardless of hoisting layout.
							 */
							createRequire( import.meta.url ).resolve(
								'@flakiness/vitest'
							),
							{
								duplicates: 'rename',
								flakinessProject: 'WordPress/gutenberg',
							},
						],
				  ]
				: [ 'default' ],
		sequence: {
			hooks: 'list',
			setupFiles: 'list',
		},
		snapshotFormat: {
			escapeString: false,
			printBasicPrototype: false,
		},
	},
} );
