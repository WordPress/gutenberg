import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import {
	discoverTestFiles,
	getVitestTests,
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
const vitestTests = getVitestTests(
	discoverTestFiles( ROOT_DIR ),
	testMigration
);

// Preserve Jest's repository-root configuration discovery and default timezone.
process.chdir( ROOT_DIR );
process.env.TZ = 'UTC';

export default defineConfig( {
	root: ROOT_DIR,
	test: {
		environment: 'jsdom',
		environmentOptions: {
			jsdom: {
				url: 'http://localhost/',
			},
		},
		globals: false,
		include: vitestTests,
		includeTaskLocation: true,
		passWithNoTests: false,
		reporters:
			process.env.CI &&
			process.env.GITHUB_REPOSITORY === 'WordPress/gutenberg'
				? [
						'default',
						'github-actions',
						[
							'@flakiness/vitest',
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
