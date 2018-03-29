/** @format */

const defaultPlatform = 'android';
const rnPlatform = process.env.TEST_RN_PLATFORM || defaultPlatform;
if ( process.env.TEST_RN_PLATFORM ) {
	console.log( 'Setting RN platform to: ' + process.env.TEST_RN_PLATFORM );
} else {
	console.log( 'Setting RN platform to: default (' + defaultPlatform + ')' );
}

module.exports = {
	preset: 'jest-react-native',
	testEnvironment: 'jsdom',
	testPathIgnorePatterns: [
		"/node_modules/",
		"/gutenberg/"
	],
	moduleNameMapper: {
		'@wordpress/hooks': '<rootDir>/wordpress/hooks',
		'@wordpress/i18n': '<rootDir>/gutenberg/i18n',
		'@gutenberg': '<rootDir>/gutenberg',
	},
	haste: {
		defaultPlatform: rnPlatform,
		platforms: [ 'android', 'ios', 'native' ],
		providesModuleNodeModules: [ 'react-native' ],
	},
};
