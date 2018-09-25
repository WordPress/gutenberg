/** @flow
 * @format */

module.exports = {
	verbose: true,
	preset: 'react-native',
	testEnvironment: 'jsdom',
	testPathIgnorePatterns: [
		'/node_modules/',
		'<rootDir>/gutenberg/gutenberg-mobile/',
		'/gutenberg/test/',
		'/gutenberg/packages/',
	],
	modulePathIgnorePatterns: [ '<rootDir>/gutenberg/gutenberg-mobile' ],
	moduleDirectories: [ 'node_modules', 'symlinked-packages' ],
	moduleNameMapper: {
		// Mock the CSS modules. See https://facebook.github.io/jest/docs/en/webpack.html#handling-static-assets
		'\\.(scss)$': '<rootDir>/__mocks__/styleMock.js',
	},
};
