/**
 * External dependencies
 */
const glob = require( 'glob' ).sync;
const path = require( 'path' );

const defaultPlatform = 'android';
const rnPlatform = process.env.TEST_RN_PLATFORM || defaultPlatform;
if ( process.env.TEST_RN_PLATFORM ) {
	// eslint-disable-next-line no-console
	console.log( 'Setting RN platform to: ' + process.env.TEST_RN_PLATFORM );
} else {
	// eslint-disable-next-line no-console
	console.log( 'Setting RN platform to: default (' + defaultPlatform + ')' );
}

const transpiledPackageNames = glob( 'packages/*/src/index.{js,ts}' ).map(
	( fileName ) => fileName.split( '/' )[ 1 ]
);

// The following unit tests related to the `raw-handling` API will be enabled when addressing
// the various errors we encounter when running them in the native version.
// Reference: https://github.com/WordPress/gutenberg/issues/55652
const RAW_HANDLING_UNSUPPORTED_UNIT_TESTS = [
	'html-formatting-remover',
	'phrasing-content-reducer',
	'figure-content-reducer',
	'normalise-blocks',
	'image-corrector',
];

module.exports = {
	rootDir: '../../',
	// Automatically clear mock calls and instances between every test.
	clearMocks: true,
	preset: 'react-native',
	setupFiles: [ '<rootDir>/test/native/setup.js' ],
	setupFilesAfterEnv: [ '<rootDir>/test/native/setup-after-env.js' ],
	testMatch: [
		'<rootDir>/test/**/*.native.[jt]s?(x)',
		'<rootDir>/**/test/!(helper)*.native.[jt]s?(x)',
		'<rootDir>/packages/react-native-*/**/?(*.)+(spec|test).[jt]s?(x)',
		// Enable `raw-handling` API unit tests to check jsdom patches.
		`<rootDir>/packages/blocks/src/api/raw-handling/**/test/!(${ RAW_HANDLING_UNSUPPORTED_UNIT_TESTS.join(
			'|'
		) }).[jt]s?(x)`,
	],
	testPathIgnorePatterns: [ '/node_modules/', '/__device-tests__/' ],
	testEnvironmentOptions: {
		url: 'http://localhost/',
	},
	resolver: '<rootDir>/test/unit/scripts/resolver.js',
	// Add the `Libraries/Utilities` subfolder to the module directories, otherwise haste/jest doesn't find Platform.js on Travis,
	// and add it first so https://github.com/facebook/react-native/blob/v0.60.0/Libraries/react-native/react-native-implementation.js#L324-L326 doesn't pick up the Platform npm module.
	moduleDirectories: [
		'node_modules/react-native/Libraries/Utilities',
		'node_modules',
	],
	moduleNameMapper: {
		// Mock the CSS modules. See https://jestjs.io/docs/webpack#handling-static-assets
		'\\.(scss)$': '<rootDir>/test/native/__mocks__/styleMock.js',
		'\\.(eot|otf|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
			'<rootDir>/test/native/__mocks__/fileMock.js',
		[ `@wordpress\\/(${ transpiledPackageNames.join( '|' ) })$` ]:
			'<rootDir>/packages/$1/src',
		'test/helpers$': '<rootDir>/test/native/helpers.js',
	},
	modulePathIgnorePatterns: [
		'<rootDir>/packages/react-native-editor/node_modules',
	],
	haste: {
		defaultPlatform: rnPlatform,
		platforms: [ 'android', 'ios', 'native' ],
	},
	transform: {
		'\\.[jt]sx?$': [
			'babel-jest',
			// https://git.io/JYiYc
			{
				configFile: path.resolve( __dirname, 'babel.config.js' ),
			},
		],
	},
	transformIgnorePatterns: [
		// This is required for now to have jest transform some of our modules
		// See: https://github.com/wordpress-mobile/gutenberg-mobile/pull/257#discussion_r234978268
		// There is no overloading in jest so we need to rewrite the config from react-native-jest-preset:
		// https://github.com/facebook/react-native/blob/HEAD/jest-preset.json#L20
		'node_modules/(?!(simple-html-tokenizer|(jest-)?react-native|@react-native|react-clone-referenced-element|@react-navigation))',
	],
	snapshotSerializers: [ '@emotion/jest/serializer' ],
	snapshotFormat: {
		escapeString: false,
		printBasicPrototype: false,
	},
	reporters: [ 'default', 'jest-junit' ],
	watchPlugins: [
		'jest-watch-typeahead/filename',
		'jest-watch-typeahead/testname',
	],
};
