const ios = ( { iPadDevice = false } ) => ( {
	deviceName: ! iPadDevice ? 'iPhone 14' : 'iPad (10th generation)',
	pixelRatio: ! iPadDevice ? 3 : 2,
	deviceOrientation: 'portrait',
	automationName: 'XCUITest',
	processArguments: {
		args: [ 'uitesting' ],
	},
	autoLaunch: false,
} );

exports.iosLocal = ( { iPadDevice = false } ) => ( {
	...ios( { iPadDevice } ),
	platformVersion: '16.2',
	usePrebuiltWDA: true,
} );

exports.iosServer = ( { iPadDevice = false } ) => ( {
	...ios( { iPadDevice } ),
	platformVersion: '16.4',
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

exports.prefixKeysWithAppium = ( obj ) => {
	return Object.fromEntries(
		Object.entries( obj ).map( ( [ key, value ] ) => [
			`appium:${ key }`,
			value,
		] )
	);
};
