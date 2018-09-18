/** @flow
 * @format */

const main = require( './jest.config.js' );

module.exports = {
	...main,
	moduleNameMapper: {
		'@wordpress\\/(blocks|data|element|deprecated|editor|block-library|components|keycodes|url|a11y|viewport|core-data|api-fetch|nux|block-serialization-default-parser)$':
			'<rootDir>/../packages/$1/build/index',

		// Mock the CSS modules. See https://facebook.github.io/jest/docs/en/webpack.html#handling-static-assets
		'\\.(scss)$': '<rootDir>/__mocks__/styleMock.js',
	},
};
