/**
 * External dependencies
 */
const glob = require( 'glob' ).sync;

// Finds all packages which are transpiled with Babel to force Jest to use their source code.
const transpiledPackageNames = glob( 'packages/*/src/index.js' )
	.map( ( fileName ) => fileName.split( '/' )[ 1 ] );

module.exports = {
	rootDir: '../../',
	moduleNameMapper: {
		[ `@wordpress\\/(${ transpiledPackageNames.join( '|' ) })$` ]: 'packages/$1/src',
	},
	preset: '@wordpress/jest-preset-default',
	setupFiles: [
		'core-js/fn/symbol/async-iterator',
		'<rootDir>/test/unit/config/gutenberg-phase.js',
	],
	testURL: 'http://localhost',
	testPathIgnorePatterns: [
		'/node_modules/',
		'/packages/e2e-tests',
		'<rootDir>/.*/build/',
		'<rootDir>/.*/build-module/',
	],
	transformIgnorePatterns: [
		'node_modules/(?!(simple-html-tokenizer)/)',
	],
};
