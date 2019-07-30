/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { hasBabelConfig } = require( '../utils' );

const jestE2EConfig = {
	preset: 'jest-puppeteer',
	testMatch: [
		'**/__tests__/**/*.js',
		'**/?(*.)(spec|test).js',
		'**/test/*.js',
	],
};

if ( ! hasBabelConfig() ) {
	jestE2EConfig.transform = {
		'^.+\\.[jt]sx?$': path.join( __dirname, 'babel-transform' ),
	};
}

module.exports = jestE2EConfig;
