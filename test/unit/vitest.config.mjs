/**
 * Node dependencies
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * External dependencies
 */
import { transformAsync } from '@babel/core';
import globPackage from 'glob';
import commonjs from 'vite-plugin-commonjs';
import { defineConfig } from 'vitest/config';

/**
 * Internal dependencies
 */
import { getVitestTestsByProject } from './scripts/discover-test-files.mjs';

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
const vitestTests = getVitestTestsByProject( ROOT_DIR, testMigration );
const { sync: glob } = globPackage;
const reporters = [ 'default' ];

if ( process.env.GITHUB_ACTIONS === 'true' ) {
	reporters.push( 'github-actions' );
}
if (
	process.env.CI &&
	process.env.GITHUB_REPOSITORY === 'WordPress/gutenberg'
) {
	reporters.push( [
		'@flakiness/vitest',
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
	path.join( ROOT_DIR, 'packages/*/src/index.{js,ts,tsx}' )
).map( ( fileName ) => {
	const relative = path.relative( ROOT_DIR, fileName );
	return relative.split( path.sep )[ 1 ];
} );

function wordpressBabelTransform() {
	return {
		name: 'wordpress-babel-transform',
		enforce: 'pre',
		async transform( source, id ) {
			const filename = id.split( '?', 1 )[ 0 ];

			if (
				! filename.startsWith( `${ ROOT_DIR }${ path.sep }` ) ||
				filename.includes( `${ path.sep }node_modules${ path.sep }` ) ||
				! /\.m?[jt]sx?$/.test( filename )
			) {
				return;
			}

			const result = await transformAsync( source, {
				caller: {
					name: 'vite',
					supportsDynamicImport: true,
					supportsExportNamespaceFrom: true,
					supportsStaticESM: true,
					supportsTopLevelAwait: true,
				},
				envName: 'test',
				filename,
				root: ROOT_DIR,
				sourceMaps: true,
			} );

			if ( ! result?.code ) {
				return;
			}

			return {
				code: result.code,
				map: result.map,
			};
		},
	};
}

export default defineConfig( {
	root: ROOT_DIR,
	plugins: [
		wordpressBabelTransform(),
		commonjs( {
			filter: ( id ) =>
				[
					`${ ROOT_DIR }/packages/block-serialization-spec-parser/parser.js`,
					`${ ROOT_DIR }/packages/env/lib/`,
					`${ ROOT_DIR }/packages/project-management-automation/lib/`,
					`${ ROOT_DIR }/packages/scripts/utils/`,
					`${ ROOT_DIR }/tools/release/commands/changelog.js`,
				].some( ( directory ) => id.startsWith( directory ) ) &&
				! id.endsWith( '/packages/scripts/utils/license.js' ),
		} ),
	],
	resolve: {
		alias: [
			{
				find: /^.*\.(?:css|scss)$/,
				replacement: path.join(
					ROOT_DIR,
					'test/unit/config/style-mock.vitest.js'
				),
			},
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
	server: {
		deps: {
			external: [ /^@babel\// ],
		},
	},
	test: {
		globals: false,
		includeTaskLocation: true,
		passWithNoTests: false,
		projects: [
			{
				extends: true,
				test: {
					// The Flakiness.io reporter uses the project name as part
					// of its environment identity. Preserve the historical
					// default while the manifest records explicit jsdom
					// ownership.
					name: 'vitest',
					environment: 'jsdom',
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
						path.join(
							ROOT_DIR,
							'test/unit/mocks/match-media.vitest.js'
						),
					],
				},
			},
			{
				extends: true,
				test: {
					name: 'node',
					environment: 'node',
					include: vitestTests.node,
				},
			},
		],
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
