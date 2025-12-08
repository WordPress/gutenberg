/**
 * Internal dependencies
 */
import {
	ios as iOSConfig,
	android as androidConfig,
} from './device-config.json';

const ios = {
	deviceOrientation: 'portrait',
	automationName: 'XCUITest',
	processArguments: {
		args: [ 'uitesting' ],
	},
	autoLaunch: false,
	usePrebuiltWDA: true,
	simulatorStartupTimeout: 240,
	reduceMotion: true,
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
} );

exports.iosServer = ( { iPadDevice = false } ) => ( {
	...ios,
	deviceName: ! iPadDevice
		? iOSConfig.local.deviceName
		: iOSConfig.local.deviceTabletName,
	platformVersion: iOSConfig.buildkite.platformVersion,
	pixelRatio: ! iPadDevice
		? iOSConfig.pixelRatio.iPhone
		: iOSConfig.pixelRatio.iPad,
} );

exports.android = {
	platformVersion: androidConfig.local.platformVersion,
	deviceName: androidConfig.local.deviceName,
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
