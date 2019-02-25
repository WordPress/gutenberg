/** @format */

import wd from 'wd';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
const APPIUM_SERVER_ADDRESS = 'localhost';
const APPIUM_SERVER_PORT = 4723;
// const config = {
// 	platformName: 'iOS',
// 	platformVersion: 12.1,
// 	deviceName: 'iPhone XR',
// 	automationName: 'XCUITest',
// 	app: '/Users/javon/Projects/gutenberg-mobile/ios/build/Build/Products/Debug-iphonesimulator/gutenberg.app', // relative to root of project
// };

const config = {
	platformName: 'android',
	deviceName: 'Android Emulator',
	automationName: 'UiAutomator2',
	app: '/Users/javon/Projects/gutenberg-mobile/android/app/build/outputs/apk/debug/app-debug.apk',
};

describe( 'Gutenberg Editor tests', () => {
	let driver;

	beforeEach( async () => {
		driver = wd.promiseChainRemote( APPIUM_SERVER_ADDRESS, APPIUM_SERVER_PORT );
		await driver.init( config );
		await driver.status();
		await driver.sleep( 10000 ); // wait for app to load
	} );

	afterEach( async () => {
		await driver.quit();
	} );

	it( 'should be able to see editor', async () => {
		expect( await driver.hasElementByAccessibilityId( 'block-list' ) ).toBe( true );
	} );
} );