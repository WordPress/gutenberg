/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { hasBabelConfig } = require( '../utils' );

const jestA11yBlocks = {
	globalSetup: path.join( __dirname, 'jest-environment-puppeteer', 'setup' ),
	globalTeardown: path.join(
		__dirname,
		'jest-environment-puppeteer',
		'teardown'
	),
	reporters: [
		'default',
		path.join( __dirname, 'jest-github-actions-reporter', 'index.js' ),
	],
	setupFilesAfterEnv: [ 'expect-puppeteer' ],
	testEnvironment: path.join( __dirname, 'jest-environment-puppeteer' ),
	testMatch: [ '**/tests-a11y-blocks/specs/**/*.[jt]s?(x)' ],
	testPathIgnorePatterns: [ '/node_modules/' ],
	testRunner: 'jest-circus/runner',
	testTimeout: 30000,
};

if ( ! hasBabelConfig() ) {
	jestA11yBlocks.transform = {
		'\\.[jt]sx?$': path.join( __dirname, 'babel-transform' ),
	};
}

module.exports = jestA11yBlocks;
