/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * Path to root project directory.
 */
const ROOT_DIR = path.resolve( __dirname, '../..' );

// Reuse the unit test Jest configuration as the base.
const unitJestConfig = require( '../unit/jest.config.js' );

module.exports = {
	...unitJestConfig,
	// Scope test discovery to this directory only.
	testMatch: [
		path.join( ROOT_DIR, 'test/integration/**/*.test.[jt]s?(x)' ),
	],
};
