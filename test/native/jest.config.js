/**
 * External dependencies
 */
const glob = require( 'glob' ).sync;

const defaultPlatform = 'android';
const rnPlatform = process.env.TEST_RN_PLATFORM || defaultPlatform;
if ( process.env.TEST_RN_PLATFORM ) {
	// eslint-disable-next-line no-console
	console.log( 'Setting RN platform to: ' + process.env.TEST_RN_PLATFORM );
} else {
	// eslint-disable-next-line no-console
	console.log( 'Setting RN platform to: default (' + defaultPlatform + ')' );
}

const configPath = 'test/native';

const transpiledPackageNames = glob( '../../packages/*/src/index.js' ).map(
	( fileName ) => fileName.split( '/' )[ 3 ]
);

module.exports = {
	verbose: true,
	rootDir: '../../',
	// Automatically clear mock calls and instances between every test
	clearMocks: true,
	preset: 'react-native',
	setupFiles: [
		'<rootDir>/' + configPath + '/setup.js',
		'<rootDir>/' + configPath + '/enzyme.config.js',
	],
	testEnvironment: 'jsdom',
	testRunner: 'jest-jasmine2',
	testMatch: [
		'**/test/*.native.[jt]s?(x)',
		'<rootDir>/packages/react-native-*/**/?(*.)+(spec|test).[jt]s?(x)',
	],
	testPathIgnorePatterns: [
		'/node_modules/',
		'/__device-tests__/',
		'<rootDir>/.*/build/',
		'<rootDir>/.*/build-module/',
	],
	testURL: 'http://localhost/',
	// Add the `Libraries/Utilities` subfolder to the module directories, otherwise haste/jest doesn't find Platform.js on Travis,
	// and add it first so https://github.com/facebook/react-native/blob/v0.60.0/Libraries/react-native/react-native-implementation.js#L324-L326 doesn't pick up the Platform npm module.
	moduleDirectories: [
		'node_modules/react-native/Libraries/Utilities',
		'node_modules',
	],
	moduleNameMapper: {
		// Mock the CSS modules. See https://facebook.github.io/jest/docs/en/webpack.html#handling-static-assets
		'\\.(scss)$': '<rootDir>/' + configPath + '/__mocks__/styleMock.js',
		'\\.(eot|otf|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
			'<rootDir>/' + configPath + '/__mocks__/fileMock.js',
		[ `@wordpress\\/(${ transpiledPackageNames.join(
			'|'
		) })$` ]: '<rootDir>/packages/$1/src',
		'test/helpers$': '<rootDir>/test/native/helpers.js',
	},
	modulePathIgnorePatterns: [
		'<rootDir>/packages/react-native-editor/node_modules',
	],
	haste: {
		defaultPlatform: rnPlatform,
		platforms: [ 'android', 'ios', 'native' ],
	},
	transformIgnorePatterns: [
		// This is required for now to have jest transform some of our modules
		// See: https://github.com/wordpress-mobile/gutenberg-mobile/pull/257#discussion_r234978268
		// There is no overloading in jest so we need to rewrite the config from react-native-jest-preset:
		// https://github.com/facebook/react-native/blob/HEAD/jest-preset.json#L20
		'node_modules/(?!(simple-html-tokenizer|(jest-)?react-native|@react-native|react-clone-referenced-element|@react-navigation))',
	],
	snapshotSerializers: [
		'enzyme-to-json/serializer',
		'@emotion/jest/serializer',
	],
	reporters: [ 'default', 'jest-junit' ],
};
