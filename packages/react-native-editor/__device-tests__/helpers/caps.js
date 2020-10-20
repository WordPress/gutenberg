const ios = {
	browserName: '',
	platformName: 'iOS',
	platformVersion: '14.0',
	os: 'iOS',
	deviceOrientation: 'portrait',
	automationName: 'XCUITest',
	appiumVersion: '1.16.0', // SauceLabs requires appiumVersion to be specified.
	app: undefined, // will be set later, locally this is relative to root of project
	processArguments: {
		args: [ 'uitesting' ],
	},
};

exports.iosLocal = {
	...ios,
	deviceName: 'iPhone 11',
};

exports.iosServer = {
	...ios,
	deviceName: 'iPhone 11 Simulator',
};

exports.android = {
	browserName: '',
	platformName: 'Android',
	platformVersion: '9.0',
	deviceName: 'Google Pixel 3 XL GoogleAPI Emulator',
	automationName: 'UiAutomator2',
	os: 'Android',
	appPackage: 'com.gutenberg',
	appActivity: 'com.gutenberg.MainActivity',
	deviceOrientation: 'portrait',
	appiumVersion: '1.16.0',
	app: undefined,
};
