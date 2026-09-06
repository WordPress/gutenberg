const path = require( 'path' );
const { globSync } = require( 'glob' );
const testMigration = require( './test-migration.json' );

/**
 * Path to root project directory.
 */
const ROOT_DIR = path.resolve( __dirname, '../..' );

// Ensure Babel config resolution works from the repo root,
// even when Jest runs from the workspace directory.
process.chdir( ROOT_DIR );

// Finds all packages which are transpiled with Babel to force Jest to use their source code.
const transpiledPackageNames = globSync(
	'packages/*/src/index.{js,jsx,ts,tsx}',
	{ cwd: ROOT_DIR, absolute: true }
)
	.sort()
	.map( ( fileName ) => {
		const relative = path.relative( ROOT_DIR, fileName );
		return relative.split( path.sep )[ 1 ];
	} );

const dependenciesToTransform = [
	'@ariakit/test',
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
const ariakitTestDir = path.dirname(
	require.resolve( '@ariakit/test/package.json', {
		paths: [ path.join( ROOT_DIR, 'packages/components' ) ],
	} )
);
const ariakitUtilsDir = path.dirname(
	require.resolve( '@ariakit/utils/package.json', {
		paths: [ ariakitTestDir ],
	} )
);

const commonProjectConfig = {
	rootDir: ROOT_DIR,
	moduleNameMapper: {
		/**
		 * Specific mappings first (before generic patterns)
		 */
		// Jest resolves dependencies from CommonJS and cannot select import-only
		// package exports. Map Ariakit's ESM test helpers explicitly.
		'^@ariakit/test$': path.join( ariakitTestDir, 'dist/index.js' ),
		'^@ariakit/test/react$': path.join( ariakitTestDir, 'dist/react.js' ),
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
	setupFiles: [
		'<rootDir>/test/unit/config/global-mocks.js',
		'<rootDir>/test/unit/config/gutenberg-env.js',
	],
	setupFilesAfterEnv: [
		'<rootDir>/test/unit/config/testing-library.js',
		'<rootDir>/test/unit/mocks/match-media.js',
	],
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
	],
	resolver: '<rootDir>/test/unit/scripts/resolver.js',
	transform: {
		'^.+\\.m?[jt]sx?$': '<rootDir>/test/unit/scripts/babel-transformer.js',
	},
	transformIgnorePatterns: [
		`/node_modules/(?!(${ dependenciesToTransform.join( '|' ) })/)`,
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
};

module.exports = {
	rootDir: ROOT_DIR,
	projects: [
		{
			...commonProjectConfig,
			displayName: 'jsdom',
			testEnvironment: require.resolve( 'jest-environment-jsdom' ),
			testEnvironmentOptions: {
				url: 'http://localhost/',
			},
			testMatch: testMigration.jest.files.map(
				( testPath ) => `<rootDir>/${ testPath }`
			),
		},
	],
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
