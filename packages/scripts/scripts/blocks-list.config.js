/**
 * Internal dependencies
 */
const originalConfig = require( '../../../test/unit/jest.config' );

module.exports = {
	...originalConfig,
	rootDir: __dirname + '/../../../',
	testPathIgnorePatterns: [],
	testMatch: [ '<rootDir>/**/*.js' ],
};
