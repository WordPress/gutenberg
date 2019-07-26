exports.ios12 = {
	browserName: '',
	platformName: 'iOS',
	platformVersion: '12.2',
	deviceName: 'iPhone Simulator',
	os: 'iOS',
	deviceOrientation: 'portrait',
	automationName: 'XCUITest',
	appiumVersion: '1.13.0', // SauceLabs requires appiumVersion to be specified.
	app: undefined, // will be set later, locally this is relative to root of project
};

exports.android8 = {
	browserName: '',
	platformName: 'Android',
	platformVersion: '9.0',
	deviceName: 'Google Pixel 3 GoogleAPI Emulator',
	automationName: 'UiAutomator2',
	os: 'Android',
	appPackage: 'com.gutenberg',
	appActivity: 'com.gutenberg.MainActivity',
	deviceOrientation: 'portrait',
	appiumVersion: '1.13.0',
	app: undefined,
};
