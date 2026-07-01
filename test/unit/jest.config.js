/**
 * External dependencies
 */
const path = require( 'path' );
const glob = require( 'glob' ).sync;

/*
 * Resolve the directory of `@wordpress/jest-preset-default` from this
 * workspace's `node_modules`. Jest's `preset` option expects a directory
 * containing a `jest-preset.js` or `jest-preset.json` file.
 */
const jestPresetDefaultDir = path.dirname(
	require.resolve( '@wordpress/jest-preset-default/jest-preset.js' )
);

/**
 * Path to root project directory.
 */
const ROOT_DIR = path.resolve( __dirname, '../..' );

// Ensure Babel config resolution works from the repo root,
// even when Jest runs from the workspace directory.
process.chdir( ROOT_DIR );

// Finds all packages which are transpiled with Babel to force Jest to use their source code.
const transpiledPackageNames = glob(
	path.join( ROOT_DIR, 'packages/*/src/index.{js,ts,tsx}' )
).map( ( fileName ) => {
	const relative = path.relative( ROOT_DIR, fileName );
	return relative.split( path.sep )[ 1 ];
} );

// Make sure the tests run in UTC timezone, regardless of the system timezone.
process.env.TZ = 'UTC';

module.exports = {
	rootDir: '../../',
	moduleNameMapper: {
		// Mock @wordpress/vips/worker before the general pattern so it doesn't try to load the real file.
		// The worker-code.ts file is auto-generated during full builds and is gitignored.
		'@wordpress/vips/worker':
			'<rootDir>/test/unit/config/vips-worker-code-stub.js',
		// Mock @wordpress/video-conversion/worker before the general pattern so it doesn't try to load the real file.
		// The worker-code.ts file is auto-generated during full builds and is gitignored.
		'@wordpress/video-conversion/worker':
			'<rootDir>/test/unit/config/video-conversion-worker-code-stub.js',
		[ `@wordpress\\/(${ transpiledPackageNames.join( '|' ) })$` ]:
			'packages/$1/src',
		'@wordpress/theme/design-tokens.js':
			'<rootDir>/packages/theme/src/prebuilt/js/design-tokens.mjs',
		'.+\\.wasm$': '<rootDir>/test/unit/config/wasm-stub.js',
	},
	preset: jestPresetDefaultDir,
	setupFiles: [
		'<rootDir>/test/unit/config/global-mocks.js',
		'<rootDir>/test/unit/config/gutenberg-env.js',
	],
	setupFilesAfterEnv: [
		'<rootDir>/test/unit/config/testing-library.js',
		'<rootDir>/test/unit/mocks/match-media.js',
	],
	testEnvironmentOptions: {
		url: 'http://localhost/',
	},
	testLocationInResults: true,
	testPathIgnorePatterns: [
		'/.git/',
		'/node_modules/',
		'/packages/e2e-tests',
		'/packages/e2e-test-utils-playwright/src/test.ts',
		'<rootDir>/.*/build/',
		'<rootDir>/.*/build-module/',
		'<rootDir>/.*/build-types/',
		'<rootDir>/.+.d.ts$',
	],
	resolver: '<rootDir>/test/unit/scripts/resolver.js',
	transform: {
		'^.+\\.m?[jt]sx?$': '<rootDir>/test/unit/scripts/babel-transformer.js',
	},
	transformIgnorePatterns: [
		'/node_modules/(?!(docker-compose|yaml|preact|@preact|parsel-js|comctx|uuid|marked)/)',
		'\\.pnp\\.[^\\/]+$',
	],
	snapshotSerializers: [
		require.resolve( '@emotion/jest/serializer' ),
		require.resolve( 'snapshot-diff/serializer' ),
	],
	snapshotFormat: {
		escapeString: false,
		printBasicPrototype: false,
	},
	watchPlugins: [
		require.resolve( 'jest-watch-typeahead/filename' ),
		require.resolve( 'jest-watch-typeahead/testname' ),
	],
	reporters: [
		'default',
		'<rootDir>packages/scripts/config/jest-github-actions-reporter/index.js',
		process.env.CI
			? [
					'@flakiness/jest',
					{
						flakinessProject: 'WordPress/gutenberg',
						duplicates: 'rename',
					},
			  ]
			: undefined,
	].filter( Boolean ),
};
