const defaultPlatform = 'android';
const rnPlatform = process.env.TEST_RN_PLATFORM || defaultPlatform;
if ( process.env.TEST_RN_PLATFORM ) {
	// eslint-disable-next-line no-console
	console.log( 'Setting RN platform to: ' + rnPlatform );
} else {
	// eslint-disable-next-line no-console
	console.log( 'Setting RN platform to: default (' + defaultPlatform + ')' );
}

module.exports = {
	verbose: true,
	rootDir: './',
	haste: {
		defaultPlatform: rnPlatform,
		platforms: [ 'android', 'ios', 'native' ],
	},
	transform: {
		'^.+\\.(js|ts|tsx)$': 'babel-jest',
	},
	timers: 'real',
	setupFilesAfterEnv: [ './jest_ui_setup_after_env.js' ],
	testEnvironment: './jest_ui_test_environment.js',
	testMatch: [ '**/__device-tests__/**/*.test.[jt]s?(x)' ],
	testRunner: 'jest-jasmine2',
	reporters: [ 'default', 'jest-junit' ],
};
