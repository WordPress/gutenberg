/** @flow
 * @format */

const defaultPlatform = 'android';
const rnPlatform = process.env.TEST_RN_PLATFORM || defaultPlatform;
if ( process.env.TEST_RN_PLATFORM ) {
	// eslint-disable-next-line no-console
	console.log( 'Setting RN platform to: ' + process.env.TEST_RN_PLATFORM );
} else {
	// eslint-disable-next-line no-console
	console.log( 'Setting RN platform to: default (' + defaultPlatform + ')' );
}

module.exports = {
	verbose: true,
	preset: 'react-native',
	setupFiles: [ './jest/setup.js' ],
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
	haste: {
		defaultPlatform: rnPlatform,
		platforms: [
			'android',
			'ios',
			'native',
		],
		hasteImplModulePath: '<rootDir>/node_modules/react-native/jest/hasteImpl.js',
		providesModuleNodeModules: [
			'react-native',
			'react-native-svg',
		],
	},
};
