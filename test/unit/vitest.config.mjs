import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { playwright } from '@vitest/browser-playwright';
import react from '@vitejs/plugin-react-swc';
import fastGlob from 'fast-glob';
import { defineConfig } from 'vitest/config';
import { compileInlineStyle } from '../../packages/wp-build/lib/compile-inline-style.mjs';
import { getVitestTestsByProject } from './scripts/test-projects.mjs';

const ROOT_DIR = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../..'
);
const nodeRequire = createRequire( import.meta.url );
const emotionPlugin = nodeRequire.resolve( '@swc/plugin-emotion' );
const flakinessReporter = nodeRequire.resolve( '@flakiness/vitest' );
const vitestTests = getVitestTestsByProject( ROOT_DIR );
const { sync: glob } = fastGlob;
const styleMockAlias = {
	find: /^.*\.(?:css|scss)$/,
	replacement: fileURLToPath(
		import.meta.resolve( '@wordpress/vitest-preset-default/style-mock' )
	),
};
const WP_BUILD_STYLE_FIXTURE_ID = 'virtual:wp-build-style-injection';
const wpBuildStyleFixtureSource = await compileInlineStyle( {
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
	path.join( ROOT_DIR, 'test/unit/config/wp-build-style-fixture.module.css' )
);
const wpBuildStyleFixturePlugin = {
	name: 'wp-build-style-injection-fixture',
	resolveId( id ) {
		return id === WP_BUILD_STYLE_FIXTURE_ID ? `\0${ id }` : null;
	},
	load( id ) {
		return id === `\0${ WP_BUILD_STYLE_FIXTURE_ID }`
			? wpBuildStyleFixtureSource
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
		flakinessReporter,
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

const transpiledPackageNames = glob(
	path.join( ROOT_DIR, 'packages/*/src/index.{js,jsx,ts,tsx}' )
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
					env: {
						WP_TESTS_SKIP_STYLE_INJECTION: 'true',
					},
					environment: 'node',
					pool: 'threads',
					include: vitestTests.node,
					setupFiles: [
						path.join(
							ROOT_DIR,
							'test/unit/config/gutenberg-env.js'
						),
						path.join(
							ROOT_DIR,
							'test/unit/config/console.vitest.js'
						),
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
					env: {
						WP_TESTS_SKIP_STYLE_INJECTION: 'true',
					},
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
						path.join(
							ROOT_DIR,
							'test/unit/config/gutenberg-env.js'
						),
						path.join(
							ROOT_DIR,
							'test/unit/config/console.vitest.js'
						),
						path.join(
							ROOT_DIR,
							'test/unit/config/testing-library.vitest.js'
						),
					],
				},
			},
			{
				extends: true,
				optimizeDeps: {
					entries: vitestTests.browser,
				},
				test: {
					name: 'browser',
					attachmentsDir: 'test-results/vitest-browser-attachments',
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
					],
					browser: {
						enabled: true,
						headless: true,
						instances: [ { browser: 'chromium' } ],
						provider: playwright(),
						screenshotDirectory:
							'test-results/vitest-browser-screenshots',
						screenshotFailures: true,
					},
				},
			},
		],
		globals: false,
		includeTaskLocation: true,
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
	},
} );
