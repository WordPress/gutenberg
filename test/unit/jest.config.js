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
		[ `@wordpress\\/(${ transpiledPackageNames.join(
			'|'
		) })$` ]: 'packages/$1/src',
	},
	preset: '@wordpress/jest-preset-default',
	setupFiles: [
		'<rootDir>/test/unit/config/global-mocks.js',
		'<rootDir>/test/unit/config/is-gutenberg-plugin.js',
	],
	setupFilesAfterEnv: [ '<rootDir>/test/unit/config/testing-library.js' ],
	testURL: 'http://localhost',
	testPathIgnorePatterns: [
		'/.git/',
		'/node_modules/',
		'/packages/e2e-tests',
		'<rootDir>/.*/build/',
		'<rootDir>/.*/build-module/',
		'<rootDir>/.+.native.js$',
		'/packages/react-native-*',
	],
	transform: {
		'^.+\\.[jt]sx?$': '<rootDir>/test/unit/scripts/babel-transformer.js',
	},
	snapshotSerializers: [
		'enzyme-to-json/serializer',
		'@emotion/jest/serializer',
		'snapshot-diff/serializer',
	],
	watchPlugins: [
		'jest-watch-typeahead/filename',
		'jest-watch-typeahead/testname',
	],
	reporters: [
		'default',
		'<rootDir>packages/scripts/config/jest-github-actions-reporter/index.js',
	],
};
