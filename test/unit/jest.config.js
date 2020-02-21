/**
 * External dependencies
 */
const glob = require( 'glob' ).sync;

// Finds all packages which are transpiled with Babel to force Jest to use their source code.
const transpiledPackageNames = glob( 'packages/*/src/index.js' ).map(
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
		'<rootDir>/test/unit/config/gutenberg-phase.js',
		'<rootDir>/test/unit/config/register-context.js',
	],
	testURL: 'http://localhost',
	testPathIgnorePatterns: [
		'/.git/',
		'/node_modules/',
		'/packages/e2e-tests',
		'/wordpress/',
		'<rootDir>/.*/build/',
		'<rootDir>/.*/build-module/',
		'<rootDir>/.+.native.js$',
	],
	transform: {
		'^.+\\.[jt]sx?$': '<rootDir>/test/unit/scripts/babel-transformer.js',
	},
	snapshotSerializers: [ 'enzyme-to-json/serializer', 'jest-emotion' ],
};
