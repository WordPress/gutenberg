import childProcess from 'child_process';
import wd from 'wd';
import fs from 'fs';

const defaultPlatform = 'android';
const rnPlatform = process.env.TEST_RN_PLATFORM || defaultPlatform;
const spawn = childProcess.spawn;
const APPIUM_SERVER_ADDRESS = 'localhost';
const APPIUM_SERVER_PORT = 4728;

const timer = ( ms ) => new Promise( ( res ) => setTimeout( res, ms ) );

let config;

if ( rnPlatform === 'android' ) {
	config = {
		platformName: 'android',
		deviceName: 'Android Emulator',
		automationName: 'UiAutomator2',
		appPackage: 'com.gutenberg',
		appActivity: 'com.gutenberg.MainActivity',
		noReset: false,
		fullReset: true,
		app: './android/app/build/outputs/apk/debug/app-debug.apk', // relative to root of project
	};
} else {
	config = {
		platformName: 'iOS',
		platformVersion: 12.1,
		deviceName: 'iPhone XR',
		automationName: 'XCUITest',
		app: './ios/build/Build/Products/Debug-iphonesimulator/gutenberg.app', // relative to root of project
	};
}

const rename = async ( path, newPath ) => {
	await fs.rename( path, newPath, ( error ) => {
		if ( error ) {
			throw error;
		}
	} );
};

const setupDriver = async () => {
	const driver = wd.promiseChainRemote( APPIUM_SERVER_ADDRESS, APPIUM_SERVER_PORT );

	await driver.init( config );
	await driver.status();
	await driver.sleep( 10000 ); // wait for app to load

	await driver.setImplicitWaitTimeout( 2000 );
	return driver;
};

const setupAppium = async () => {
	const out = fs.openSync( './appium-out.log', 'a' );
	const err = fs.openSync( './appium-out.log', 'a' );

	const appium = await spawn( 'appium', [ '-p', '' + APPIUM_SERVER_PORT ], {
		detached: true, stdio: [ 'ignore', out, err ],

	} );
	await timer( 5000 );
	return appium;
};

module.exports = {
	timer,
	setupAppium,
	setupDriver,
	rename,
};
