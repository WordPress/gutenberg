const defaultPlatform = 'android';
const rnPlatform = process.env.TEST_RN_PLATFORM || defaultPlatform;
// eslint-disable-next-line import/no-extraneous-dependencies
const glob = require( 'glob' ).sync;
if ( process.env.TEST_RN_PLATFORM ) {
	// eslint-disable-next-line no-console
	console.log( 'Setting RN platform to: ' + process.env.TEST_RN_PLATFORM );
} else {
	// eslint-disable-next-line no-console
	console.log( 'Setting RN platform to: default (' + defaultPlatform + ')' );
}

const transpiledPackageNames = glob( '../../packages/*/src/index.js' ).map(
	( fileName ) => fileName.split( '/' )[ 3 ]
);

module.exports = {
	verbose: true,
	// Automatically clear mock calls and instances between every test
	clearMocks: true,
	preset: 'react-native',
	rootDir: '../..',
	setupFiles: [
		'<rootDir>/test/native/setup.js',
		'<rootDir>/test/native/enzyme.config.js',
	],
	testEnvironment: 'jsdom',
	testMatch: [
		'**/test/*.native.[jt]s?(x)',
		'<rootDir>/src/**/__tests__/**/*.[jt]s?(x)',
		'<rootDir>/src/**/?(*.)+(spec|test).[jt]s?(x)',
	],
	testPathIgnorePatterns: [
		'/node_modules/',
		'/gutenberg/test/',
		'/__device-tests__/',
	],
	testURL: 'http://localhost/',
	moduleDirectories: [ 'node_modules' ],
	moduleNameMapper: {
		// Mock the CSS modules. See https://facebook.github.io/jest/docs/en/webpack.html#handling-static-assets
		'\\.(scss)$': '<rootDir>/test/native/__mocks__/styleMock.js',
		[ `@wordpress\\/(${ transpiledPackageNames.join(
			'|'
		) })$` ]: '<rootDir>/packages/$1/src',
	},
	modulePathIgnorePatterns: [
		'<rootDir>/packages/react-native-editor/node_modules',
	],
	haste: {
		defaultPlatform: rnPlatform,
		platforms: [ 'android', 'ios', 'native' ],
		providesModuleNodeModules: [ 'react-native', 'react-native-svg' ],
	},
	transformIgnorePatterns: [
		// This is required for now to have jest transform some of our modules
		// See: https://github.com/wordpress-mobile/gutenberg-mobile/pull/257#discussion_r234978268
		// There is no overloading in jest so we need to rewrite the config from react-native-jest-preset:
		// https://github.com/facebook/react-native/blob/master/jest-preset.json#L20
		'node_modules/(?!(simple-html-tokenizer|(jest-)?react-native|react-clone-referenced-element))',
	],
	snapshotSerializers: [ 'enzyme-to-json/serializer' ],
	reporters: [ 'default', 'jest-junit' ],
};
