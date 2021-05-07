/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { hasBabelConfig } = require( '../utils' );

const jestE2EConfig = {
	testRunner: 'jest-circus/runner',
	globalSetup: path.join( __dirname, 'jest-environment-puppeteer', 'setup' ),
	globalTeardown: path.join(
		__dirname,
		'jest-environment-puppeteer',
		'teardown'
	),
	testEnvironment: path.join( __dirname, 'jest-environment-puppeteer' ),
	setupFilesAfterEnv: [ 'expect-puppeteer' ],
	testMatch: [ '**/specs/**/*.[jt]s', '**/?(*.)spec.[jt]s' ],
	testPathIgnorePatterns: [ '/node_modules/' ],
	reporters: [
		'default',
		path.join( __dirname, 'jest-github-actions-reporter.js' ),
	],
};

if ( ! hasBabelConfig() ) {
	jestE2EConfig.transform = {
		'^.+\\.[jt]sx?$': path.join( __dirname, 'babel-transform' ),
	};
}

module.exports = jestE2EConfig;
