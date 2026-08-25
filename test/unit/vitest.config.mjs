import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { playwright } from '@vitest/browser-playwright';
import globPackage from 'glob';
import commonjs from 'vite-plugin-commonjs';
import { defineConfig } from 'vitest/config';
import {
	discoverTestFiles,
	getVitestTestsByProject,
} from './scripts/discover-test-files.mjs';

const ROOT_DIR = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../..'
);
const NORMALIZED_ROOT_DIR = ROOT_DIR.split( path.sep ).join( '/' );
const gutenbergEnvSetupFile = path.join(
	ROOT_DIR,
	'test/unit/config/gutenberg-env.js'
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
const { sync: glob } = globPackage;
const styleMockAlias = {
	find: /^.*\.(?:css|scss)$/,
	replacement: path.join( ROOT_DIR, 'test/unit/config/style-mock.vitest.js' ),
};

// Preserve Jest's repository-root configuration discovery and default timezone.
process.chdir( ROOT_DIR );
process.env.TZ = 'UTC';

const transpiledPackageNames = glob(
	path.join( ROOT_DIR, 'packages/*/src/index.{js,ts,tsx}' )
).map( ( fileName ) => {
	const relative = path.relative( ROOT_DIR, fileName );
	return relative.split( path.sep )[ 1 ];
} );

export default defineConfig( {
	root: ROOT_DIR,
	oxc: {
		jsx: {
			runtime: 'automatic',
		},
	},
	plugins: [
		commonjs( {
			filter: ( id ) =>
				[
					`${ NORMALIZED_ROOT_DIR }/packages/block-serialization-spec-parser/parser.js`,
					`${ NORMALIZED_ROOT_DIR }/packages/env/lib/`,
					`${ NORMALIZED_ROOT_DIR }/packages/project-management-automation/lib/`,
					`${ NORMALIZED_ROOT_DIR }/packages/scripts/utils/`,
					`${ NORMALIZED_ROOT_DIR }/tools/release/commands/changelog.js`,
				].some( ( directory ) => id.startsWith( directory ) ) &&
				! id.endsWith( '/packages/scripts/utils/license.js' ),
		} ),
	],
	resolve: {
		alias: [
			{
				find: /^yargs$/,
				replacement: path.join(
					ROOT_DIR,
					'test/unit/config/yargs.vitest.js'
				),
			},
			{
				find: '@wordpress/vips/worker',
				replacement: path.join(
					ROOT_DIR,
					'test/unit/config/vips-worker-code-stub.vitest.js'
				),
			},
			{
				find: '@wordpress/video-conversion/worker',
				replacement: path.join(
					ROOT_DIR,
					'test/unit/config/video-conversion-worker-code-stub.vitest.js'
				),
			},
			{
				find: /^@wordpress\/([^/]+)\/src\/(.+)$/,
				replacement: path.join( ROOT_DIR, 'packages/$1/src/$2' ),
			},
			{
				find: new RegExp(
					`^@wordpress/(${ transpiledPackageNames.join( '|' ) })$`
				),
				replacement: path.join( ROOT_DIR, 'packages/$1/src' ),
			},
			{
				find: '@wordpress/theme/design-tokens.js',
				replacement: path.join(
					ROOT_DIR,
					'packages/theme/prebuilt/js/design-tokens.mjs'
				),
			},
			{
				find: /^@wordpress\/block-library\/build-module\/(.*)\.mjs$/,
				replacement: path.join(
					ROOT_DIR,
					'packages/block-library/src/$1.js'
				),
			},
			{
				find: /.+\.wasm$/,
				replacement: path.join(
					ROOT_DIR,
					'test/unit/config/wasm-stub.js'
				),
			},
		],
	},
	test: {
		projects: [
			{
				extends: true,
				resolve: {
					alias: [ styleMockAlias ],
				},
				test: {
					name: 'node',
					environment: 'node',
					pool: 'threads',
					include: vitestTests.node,
					setupFiles: [ gutenbergEnvSetupFile ],
				},
			},
			{
				extends: true,
				resolve: {
					alias: [ styleMockAlias ],
				},
				test: {
					name: 'jsdom',
					environment: 'jsdom',
					pool: 'threads',
					environmentOptions: {
						jsdom: {
							url: 'http://localhost/',
						},
					},
					include: vitestTests.jsdom,
					setupFiles: [
						path.join(
							ROOT_DIR,
							'test/unit/config/setup-globals.vitest.js'
						),
						path.join(
							ROOT_DIR,
							'test/unit/config/global-mocks.vitest.js'
						),
						gutenbergEnvSetupFile,
						path.join(
							ROOT_DIR,
							'test/unit/config/testing-library.vitest.js'
						),
					],
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
