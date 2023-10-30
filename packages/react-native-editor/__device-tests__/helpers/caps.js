/**
 * Internal dependencies
 */
import deviceConfig from './device-config.json';

const { ios: iOSConfig, android: androidConfig } = deviceConfig;

const ios = {
	deviceOrientation: 'portrait',
	automationName: 'XCUITest',
	processArguments: {
		args: [ 'uitesting' ],
	},
	autoLaunch: false,
};

exports.iosLocal = ( { iPadDevice = false } ) => ( {
	...ios,
	deviceName: ! iPadDevice
		? iOSConfig.local.deviceName
		: iOSConfig.local.deviceTabletName,
	platformVersion: iOSConfig.local.platformVersion,
	pixelRatio: ! iPadDevice
		? iOSConfig.pixelRatio.iPhone
		: iOSConfig.pixelRatio.iPad,
	usePrebuiltWDA: true,
} );

exports.iosServer = ( { iPadDevice = false } ) => ( {
	...ios,
	deviceName: ! iPadDevice
		? iOSConfig.saucelabs.deviceName
		: iOSConfig.saucelabs.deviceTabletName,
	platformVersion: iOSConfig.local.platformVersion,
	pixelRatio: ! iPadDevice
		? iOSConfig.pixelRatio.iPhone
		: iOSConfig.pixelRatio.iPad,
} );

exports.android = {
	platformVersion: androidConfig.local.platformVersion,
	deviceName: androidConfig.saucelabs.deviceName,
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
