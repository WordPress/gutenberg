/** @flow
 * @format */

const main = require( './jest.config.js' );

module.exports = {
	...main,
	setupFiles: [],
	testMatch: [ '**/__device-tests__/**/*.test.[jt]s?(x)' ],
	testPathIgnorePatterns: [
		'/node_modules/',
		'<rootDir>/gutenberg/gutenberg-mobile/',
		'/gutenberg/test/',
		'/gutenberg/packages/',
	],
};
