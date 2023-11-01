const ios = {
	platformVersion: '16.2', // Supported Sauce Labs platforms can be found here: https://saucelabs.com/rest/v1/info/platforms/appium
	deviceOrientation: 'portrait',
	automationName: 'XCUITest',
	processArguments: {
		args: [ 'uitesting' ],
	},
	autoLaunch: false,
};

exports.iosLocal = ( { iPadDevice = false } ) => ( {
	...ios,
	deviceName: ! iPadDevice ? 'iPhone 14' : 'iPad (10th generation)',
	pixelRatio: ! iPadDevice ? 3 : 2,
	usePrebuiltWDA: true,
} );

exports.iosServer = ( { iPadDevice = false } ) => ( {
	...ios,
	deviceName: ! iPadDevice
		? 'iPhone 14 Simulator'
		: 'iPad (10th generation) Simulator',
	pixelRatio: ! iPadDevice ? 3 : 2,
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

// SauceLabs config
exports.sauceOptions = {
	appiumVersion: '2.0.0',
};

exports.prefixKeysWithAppium = ( obj ) => {
	return Object.fromEntries(
		Object.entries( obj ).map( ( [ key, value ] ) => [
			`appium:${ key }`,
			value,
		] )
	);
};
