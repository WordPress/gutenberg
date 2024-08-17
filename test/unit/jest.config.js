/**
 * External dependencies
 */
const glob = require( 'glob' ).sync;

// Finds all packages which are transpiled with Babel to force Jest to use their source code.
const transpiledPackageNames = glob( 'packages/*/src/index.{js,ts,tsx}' ).map(
	( fileName ) => fileName.split( '/' )[ 1 ]
);

module.exports = {
	rootDir: '../../',
	moduleNameMapper: {
		[ `@wordpress\\/(${ transpiledPackageNames.join( '|' ) })$` ]:
			'packages/$1/src',
	},
	preset: '@wordpress/jest-preset-default',
	setupFiles: [
		'<rootDir>/test/unit/config/global-mocks.js',
		'<rootDir>/test/unit/config/gutenberg-env.js',
	],
	setupFilesAfterEnv: [ '<rootDir>/test/unit/config/testing-library.js' ],
	testEnvironmentOptions: {
		url: 'http://localhost/',
	},
	testPathIgnorePatterns: [
		'/.git/',
		'/node_modules/',
		'/packages/e2e-tests',
		'/packages/e2e-test-utils-playwright/src/test.ts',
		'<rootDir>/.*/build/',
		'<rootDir>/.*/build-module/',
		'<rootDir>/.*/build-types/',
		'<rootDir>/.+.d.ts$',
		'<rootDir>/.+.native.js$',
		'/packages/react-native-*',
	],
	resolver: '<rootDir>/test/unit/scripts/resolver.js',
	transform: {
		'^.+\\.[jt]sx?$': '<rootDir>/test/unit/scripts/babel-transformer.js',
	},
	transformIgnorePatterns: [
		'/node_modules/(?!(docker-compose|yaml|preact|@preact)/)',
		'\\.pnp\\.[^\\/]+$',
	],
	snapshotSerializers: [
		'@emotion/jest/serializer',
		'snapshot-diff/serializer',
	],
	snapshotFormat: {
		escapeString: false,
		printBasicPrototype: false,
	},
	watchPlugins: [
		'jest-watch-typeahead/filename',
		'jest-watch-typeahead/testname',
	],
	reporters: [
		'default',
		'<rootDir>packages/scripts/config/jest-github-actions-reporter/index.js',
	],
};
