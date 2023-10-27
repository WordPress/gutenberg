const IOS_IPHONE_SIMULATOR = 'iPhone 14';
const IOS_IPAD_SIMULATOR = 'iPad (10th generation)';

const ios = ( { iPadDevice = false } ) => ( {
	deviceName: ! iPadDevice ? IOS_IPHONE_SIMULATOR : IOS_IPAD_SIMULATOR,
	pixelRatio: ! iPadDevice ? 3 : 2,
	deviceOrientation: 'portrait',
	automationName: 'XCUITest',
	processArguments: {
		args: [ 'uitesting' ],
	},
	autoLaunch: false,
	usePrebuiltWDA: true,
} );

exports.iosLocal = ( { iPadDevice = false } ) => ( {
	...ios( { iPadDevice } ),
	platformVersion: '16.2',
} );

exports.iosServer = ( { iPadDevice = false } ) => ( {
	...ios( { iPadDevice } ),
	platformVersion: '16.4',
	newCommandTimeout: 240,
	simulatorStartupTimeout: 240,
	commandTimeouts: 240,
	reduceMotion: true,
} );

exports.android = {
	platformVersion: '11.0',
	deviceName: 'Google Pixel 3 XL GoogleAPI Emulator',
	automationName: 'UiAutomator2',
	appPackage: 'com.gutenberg',
	appActivity: 'com.gutenberg.MainActivity',
	deviceOrientation: 'portrait',
	disableWindowAnimation: true,
	autoLaunch: false,
};

exports.iOSParallelDevices = [
	{ deviceName: IOS_IPHONE_SIMULATOR, wdaLocalPort: 8100 },
	{ deviceName: `${ IOS_IPHONE_SIMULATOR } Appium`, wdaLocalPort: 8102 },
];

exports.prefixKeysWithAppium = ( obj ) => {
	return Object.fromEntries(
		Object.entries( obj ).map( ( [ key, value ] ) => [
			`appium:${ key }`,
			value,
		] )
	);
};
