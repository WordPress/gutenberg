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
	rootDir: '../../',
	haste: {
		defaultPlatform: rnPlatform,
		platforms: [ 'android', 'ios', 'native' ],
	},
	transform: {
		'^.+\\.(js|ts|tsx)$': 'babel-jest',
	},
	timers: 'real',
	setupFiles: [],
	testMatch: [ '**/__device-tests__/**/*.test.[jt]s?(x)' ],
};
