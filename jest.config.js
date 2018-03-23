/** @format */

const defaultPlatform = 'android';
const rnPlatform = process.env.RN_TEST_PLATFORM || defaultPlatform;
if ( process.env.RN_TEST_PLATFORM ) {
	console.log( 'Setting RN platform to: ' + process.env.RN_TEST_PLATFORM );
} else {
	console.log( 'Setting RN platform to: default (' + defaultPlatform + ')' );
}

module.exports = {
	preset: 'jest-expo',
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
