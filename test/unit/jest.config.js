const path = require( 'path' );
const glob = require( 'glob' ).sync;
const testMigration = require( './test-migration.json' );

/**
 * Path to root project directory.
 */
const ROOT_DIR = path.resolve( __dirname, '../..' );

const escapeRegExp = ( value ) =>
	value.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
const vitestTestPathIgnorePatterns = [
	...testMigration.vitest.files.map(
		( testPath ) => `<rootDir>/${ escapeRegExp( testPath ) }$`
	),
	...testMigration.vitest.directories.map(
		( directoryPath ) => `<rootDir>/${ escapeRegExp( directoryPath ) }/`
	),
];

// Ensure Babel config resolution works from the repo root,
// even when Jest runs from the workspace directory.
process.chdir( ROOT_DIR );

// Finds all packages which are transpiled with Babel to force Jest to use their source code.
const transpiledPackageNames = glob(
	path.join( ROOT_DIR, 'packages/*/src/index.{js,jsx,ts,tsx}' )
).map( ( fileName ) => {
	const relative = path.relative( ROOT_DIR, fileName );
	return relative.split( path.sep )[ 1 ];
} );

const dependenciesToTransform = [
	'@ariakit/utils',
	'@preact',
	'comctx',
	'docker-compose',
	'marked',
	'parsel-js',
	'preact',
	'uuid',
	'yaml',
];

// Make sure the tests run in UTC timezone, regardless of the system timezone.
process.env.TZ = 'UTC';

/*
 * Resolved rather than hardcoded to `<rootDir>/node_modules`,
 * which is empty under non-hoisting installs.
 */
const ariakitUtilsDir = path.dirname(
	require.resolve( '@ariakit/utils/package.json', {
		paths: [ path.join( ROOT_DIR, 'packages/components' ) ],
	} )
);

module.exports = {
	rootDir: ROOT_DIR,
	moduleNameMapper: {
		/**
		 * Specific mappings first (before generic patterns)
		 */
		'^@ariakit/utils$': path.join( ariakitUtilsDir, 'dist/index.js' ),
		// Mock @wordpress/vips/worker before the general pattern so it doesn't try to load the real file.
		// The worker-code.ts file is auto-generated during full builds and is gitignored.
		'@wordpress/vips/worker':
			'<rootDir>/test/unit/config/vips-worker-code-stub.js',
		// Mock @wordpress/video-conversion/worker before the general pattern so it doesn't try to load the real file.
		// The worker-code.ts file is auto-generated during full builds and is gitignored.
		'@wordpress/video-conversion/worker':
			'<rootDir>/test/unit/config/video-conversion-worker-code-stub.js',
		'@wordpress/theme/design-tokens.js':
			'<rootDir>/packages/theme/prebuilt/js/design-tokens.mjs',
		'@wordpress/block-library/build-module/(.*).mjs':
			'<rootDir>/packages/block-library/src/$1',
		'.+\\.wasm$': '<rootDir>/test/unit/config/wasm-stub.js',
		// Map deep paths (e.g., @wordpress/block-editor/src/hooks/list-view)
		[ `@wordpress\\/(${ transpiledPackageNames.join( '|' ) })\\/(.+)$` ]:
			'packages/$1/$2',
		// Then map exact package imports (e.g., @wordpress/compose)
		[ `@wordpress\\/(${ transpiledPackageNames.join( '|' ) })$` ]:
			'packages/$1/src',
	},
	preset: require.resolve( '@wordpress/jest-preset-default' ),
	testEnvironment: require.resolve( 'jest-environment-jsdom' ),
	testEnvironmentOptions: {
		url: 'http://localhost/',
	},
	testLocationInResults: true,
	testPathIgnorePatterns: [
		'/\\.git($|/)',
		'/node_modules/',
		'/packages/e2e-tests',
		'/packages/e2e-test-utils-playwright/src/test\\.ts$',
		'<rootDir>/.*/build/',
		'<rootDir>/.*/build-module/',
		'<rootDir>/.*/build-types/',
		'<rootDir>/.+\\.d\\.ts$',
		...vitestTestPathIgnorePatterns,
	],
	resolver: '<rootDir>/test/unit/scripts/resolver.js',
	transformIgnorePatterns: [
		`/node_modules/(?!(${ dependenciesToTransform.join( '|' ) })/)`,
		'\\.pnp\\.[^\\/]+$',
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
		/*
		 * Only interact with flakiness.io for the official WordPress/Gutenberg
		 * repository. Forks and private mirrors should behave the same as
		 * running the tests outside a CI environment.
		 */
		process.env.CI &&
		process.env.GITHUB_REPOSITORY === 'WordPress/gutenberg'
			? [
					require.resolve( '@flakiness/jest' ),
					{
						flakinessProject: 'WordPress/gutenberg',
						duplicates: 'rename',
					},
			  ]
			: undefined,
	].filter( Boolean ),
};
