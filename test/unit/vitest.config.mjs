import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { playwright } from '@vitest/browser-playwright';
import react from '@vitejs/plugin-react-swc';
import { globSync } from 'glob';
import { defineConfig } from 'vitest/config';
import {
	discoverTestFiles,
	getVitestTestsByProject,
} from './scripts/discover-test-files.mjs';
import { compileInlineStyle } from '../../packages/wp-build/lib/compile-inline-style.mjs';

const CONFIG_DIR = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = path.resolve( CONFIG_DIR, '../..' );
const nodeRequire = createRequire( import.meta.url );
const emotionPlugin = nodeRequire.resolve( '@swc/plugin-emotion' );
const gutenbergEnvSetupFile = path.join(
	ROOT_DIR,
	'test/unit/config/gutenberg-env.js'
);
const isolationSetupFile = path.join(
	ROOT_DIR,
	'test/unit/config/isolation.vitest.js'
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
const styleMockAlias = {
	find: /^.*\.(?:css|scss)$/,
	replacement: path.join( ROOT_DIR, 'test/unit/config/style-mock.vitest.js' ),
};
const WP_BUILD_CSS_MODULE_STYLE_FIXTURE_ID = 'virtual:wp-build-style-injection';
const WP_BUILD_ORDINARY_STYLE_FIXTURE_ID =
	'virtual:wp-build-ordinary-style-injection';
const wpBuildStyleFixtureSources = new Map( [
	[
		WP_BUILD_CSS_MODULE_STYLE_FIXTURE_ID,
		await compileInlineStyle( {
			cssModules: true,
			minify: false,
		} )(
			`@layer wp-build-test {
				.fixture {
					--wp-build-style-injection-test: true;
					color: rgb(1, 2, 3);
				}
			}`,
			ROOT_DIR,
			path.join(
				ROOT_DIR,
				'test/unit/config/wp-build-style-fixture.module.css'
			)
		),
	],
	[
		WP_BUILD_ORDINARY_STYLE_FIXTURE_ID,
		await compileInlineStyle( { minify: false } )(
			`.ordinary-fixture {
				background-color: rgb(4, 5, 6);
			}`,
			ROOT_DIR,
			path.join(
				ROOT_DIR,
				'test/unit/config/wp-build-ordinary-style-fixture.css'
			)
		),
	],
] );
const wpBuildStyleFixturePlugin = {
	name: 'wp-build-style-injection-fixture',
	resolveId( id ) {
		return wpBuildStyleFixtureSources.has( id ) ? `\0${ id }` : null;
	},
	load( id ) {
		return id.startsWith( '\0' )
			? wpBuildStyleFixtureSources.get( id.slice( 1 ) ) ?? null
			: null;
	},
};
const reporters = [ 'default' ];

if ( process.env.GITHUB_ACTIONS === 'true' ) {
	reporters.push( 'github-actions' );
}
if (
	process.env.CI &&
	process.env.GITHUB_REPOSITORY === 'WordPress/gutenberg'
) {
	reporters.push( [
		/*
		 * Resolve to an absolute path so Vitest can load the reporter regardless
		 * of hoisting layout.
		 */
		nodeRequire.resolve( '@flakiness/vitest' ),
		{
			duplicates: 'rename',
			flakinessProject: 'WordPress/gutenberg',
		},
	] );
}

// Preserve repository-root configuration discovery and default to UTC while
// allowing the date-test matrix to supply another timezone.
process.chdir( ROOT_DIR );
process.env.TZ ||= 'UTC';

const transpiledPackageNames = globSync(
	'packages/*/src/index.{js,jsx,ts,tsx}',
	{ cwd: ROOT_DIR, absolute: true }
)
	.sort()
	.map( ( fileName ) => {
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
		wpBuildStyleFixturePlugin,
		react( {
			plugins: [
				[
					emotionPlugin,
					{
						autoLabel: 'always',
						labelFormat: '[local]',
					},
				],
			],
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
					'packages/block-library/src/$1'
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
					setupFiles: [
						gutenbergEnvSetupFile,
						path.join(
							ROOT_DIR,
							'test/unit/config/console.vitest.js'
						),
						isolationSetupFile,
					],
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
							'test/unit/config/console.vitest.js'
						),
						path.join(
							ROOT_DIR,
							'test/unit/config/testing-library.vitest.js'
						),
						isolationSetupFile,
					],
				},
			},
			{
				extends: true,
				/*
				 * Browser mode pre-bundles the Vitest runtime, which Vite resolves
				 * from the project root. Root the project where the test
				 * dependencies are declared so resolution stays layout agnostic.
				 */
				root: CONFIG_DIR,
				optimizeDeps: {
					entries: vitestTests.browser.map( ( testPath ) =>
						path.join( ROOT_DIR, testPath )
					),
				},
				test: {
					name: 'browser',
					dir: ROOT_DIR,
					attachmentsDir: path.join(
						ROOT_DIR,
						'test-results/vitest-browser-attachments'
					),
					include: vitestTests.browser,
					setupFiles: [
						path.join(
							ROOT_DIR,
							'test/unit/config/browser.vitest.js'
						),
						path.join(
							ROOT_DIR,
							'test/unit/config/gutenberg-env.js'
						),
						path.join(
							ROOT_DIR,
							'test/unit/config/console.vitest.js'
						),
						isolationSetupFile,
					],
					browser: {
						enabled: true,
						headless: true,
						instances: [ { browser: 'chromium' } ],
						provider: playwright(),
						screenshotDirectory: path.join(
							ROOT_DIR,
							'test-results/vitest-browser-screenshots'
						),
						screenshotFailures: true,
					},
				},
			},
		],
		// mockReset already clears every mock. Keep clearMocks disabled to make
		// that overlap explicit and avoid a redundant cleanup pass.
		clearMocks: false,
		globals: false,
		includeTaskLocation: true,
		isolate: true,
		mockReset: true,
		passWithNoTests: false,
		reporters,
		sequence: {
			hooks: 'list',
			setupFiles: 'list',
		},
		snapshotFormat: {
			escapeString: false,
			printBasicPrototype: false,
		},
		restoreMocks: true,
		unstubEnvs: true,
		unstubGlobals: true,
	},
} );
