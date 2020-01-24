/**
 * @flow
 * @format
 * */

/**
 * External dependencies
 */
import childProcess from 'child_process';
import wd from 'wd';
import crypto from 'crypto';
import path from 'path';

/**
 * Internal dependencies
 */
import serverConfigs from './serverConfigs';
import { ios, android8 } from './caps';
import AppiumLocal from './appium-local';
import _ from 'underscore';

// Platform setup
const defaultPlatform = 'android';
const rnPlatform = process.env.TEST_RN_PLATFORM || defaultPlatform;

// Environment setup, local environment or Sauce Labs
const defaultEnvironment = 'local';
const testEnvironment = process.env.TEST_ENV || defaultEnvironment;

// Local App Paths
const defaultAndroidAppPath = './android/app/build/outputs/apk/debug/app-debug.apk';
const defaultIOSAppPath = './ios/build/gutenberg/Build/Products/Release-iphonesimulator/GutenbergDemo.app';

const localAndroidAppPath = process.env.ANDROID_APP_PATH || defaultAndroidAppPath;
const localIOSAppPath = process.env.IOS_APP_PATH || defaultIOSAppPath;

const localAppiumPort = serverConfigs.local.port; // Port to spawn appium process for local runs
let appiumProcess: ?childProcess.ChildProcess;

// Used to map unicode and special values to keycodes on Android
// Docs for keycode values: https://developer.android.com/reference/android/view/KeyEvent.html
const strToKeycode = {
	'\n': 66,
	'\u0008': 67,
};

const timer = ( ms: number ) => new Promise < {} > ( ( res ) => setTimeout( res, ms ) );

const isAndroid = () => {
	return rnPlatform.toLowerCase() === 'android';
};

const isLocalEnvironment = () => {
	return testEnvironment.toLowerCase() === 'local';
};

// Initialises the driver and desired capabilities for appium
const setupDriver = async () => {
	const branch = process.env.CIRCLE_BRANCH || '';
	const safeBranchName = branch.replace( /\//g, '-' );
	if ( isLocalEnvironment() ) {
		try {
			appiumProcess = await AppiumLocal.start( localAppiumPort );
		} catch ( err ) {
			// Ignore error here, Appium is probably already running (Appium desktop has its own server for instance)
			// eslint-disable-next-line no-console
			await console.log( 'Could not start Appium server', err.toString() );
		}
	}

	const serverConfig = isLocalEnvironment() ? serverConfigs.local : serverConfigs.sauce;
	const driver = wd.promiseChainRemote( serverConfig );

	let desiredCaps;
	if ( isAndroid() ) {
		desiredCaps = _.clone( android8 );
		if ( isLocalEnvironment() ) {
			desiredCaps.app = path.resolve( localAndroidAppPath );
			try {
				const androidVersion = childProcess
					.execSync( 'adb shell getprop ro.build.version.release' )
					.toString()
					.replace( /^\s+|\s+$/g, '' );
				delete desiredCaps.platformVersion;
				desiredCaps.deviceName = 'Android Emulator';
				// eslint-disable-next-line no-console
				console.log( 'Detected Android device running Android %s', androidVersion );
			} catch ( error ) {
				// ignore error
			}
		} else {
			desiredCaps.app = `sauce-storage:Gutenberg-${ safeBranchName }.apk`; // App should be preloaded to sauce storage, this can also be a URL
		}
	} else {
		desiredCaps = _.clone( ios );
		if ( isLocalEnvironment() ) {
			desiredCaps.app = path.resolve( localIOSAppPath );
			delete desiredCaps.platformVersion;
			desiredCaps.deviceName = 'iPhone 11';
		} else {
			desiredCaps.app = `sauce-storage:Gutenberg-${ safeBranchName }.app.zip`; // App should be preloaded to sauce storage, this can also be a URL
		}
	}

	if ( ! isLocalEnvironment() ) {
		desiredCaps.name = `Gutenberg Editor Tests[${ rnPlatform }]-${ branch }`;
		desiredCaps.tags = [ 'Gutenberg', branch ];
	}

	await driver.init( desiredCaps );

	const status = await driver.status();
	// Display the driver status
	// eslint-disable-next-line no-console
	console.log( status );

	await driver.setImplicitWaitTimeout( 2000 );
	await timer( 3000 );

	await driver.setOrientation( 'PORTRAIT' );
	return driver;
};

const stopDriver = async ( driver: wd.PromiseChainWebdriver ) => {
	if ( ! isLocalEnvironment() ) {
		const jobID = driver.sessionID;

		const hash = crypto.createHmac( 'md5', jobID )
			.update( serverConfigs.sauce.auth )
			.digest( 'hex' );
		const jobURL = `https://saucelabs.com/jobs/${ jobID }?auth=${ hash }.`;
		// eslint-disable-next-line no-console
		console.log( `You can view the video of this test run at ${ jobURL }` );
	}
	if ( driver === undefined ) {
		return;
	}
	await driver.quit();

	if ( appiumProcess !== undefined ) {
		await AppiumLocal.stop( appiumProcess );
	}
};

/*
 * The 'clear' parameter is defaulted to true because not clearing the text requires Android to use ADB, which
 * has demonstrated itself to be very flaky, particularly on CI. In other words, clear the view unless you absolutely
 * have to append the new text and, in that case, append fewest number of characters possible.
 */
const typeString = async ( driver: wd.PromiseChainWebdriver, element: wd.PromiseChainWebdriver.Element, str: string, clear: boolean = true ) => {
	if ( isAndroid() ) {
		await typeStringAndroid( driver, element, str, clear );
	} else {
		await typeStringIos( driver, element, str, clear );
	}
};

const typeStringIos = async ( driver: wd.PromiseChainWebdriver, element: wd.PromiseChainWebdriver.Element, str: string, clear: boolean ) => {
	if ( clear ) {
		await element.clear();
	}
	await element.type( str );
};

const typeStringAndroid = async ( driver: wd.PromiseChainWebdriver, element: wd.PromiseChainWebdriver.Element, str: string, clear: boolean ) => {
	if ( str in strToKeycode ) {
		return await driver.pressKeycode( strToKeycode[ str ] );
	} else if ( clear ) {
		/*
		 * On Android `element.type` deletes the contents of the EditText before typing and, unfortunately,
		 * with our blocks it also deletes the block entirely. We used to avoid this by using adb to enter
		 * long text along these lines:
		 *         await driver.execute( 'mobile: shell', { command: 'input',
		 *                                                  args: [ 'text', 'text I want to enter...' ] } )
		 * but using adb in this way proved to be very flakey (frequently all of the text would not get entered,
		 * particularly on CI). We are now using the `type` approach again, but adding a space to the block to
		 * insure it is not empty, which avoids the deletion of the block when `type` executes.
		 *
		 * Note that this approach does not allow appending text to the text in a block on account
		 * of `type` always clearing the block (on Android).
		 */

		await driver.execute( 'mobile: shell', { command: 'input', args: [ 'text', '%s' ] } );
		await element.type( str );
	} else {
		// eslint-disable-next-line no-console
		console.log( 'Warning: Using `adb shell input text` on Android which is rather flaky.' );

		const paragraphs = str.split( '\n' );
		for ( let i = 0; i < paragraphs.length; i++ ) {
			const paragraph = paragraphs[ i ].replace( /[ ]/g, '%s' );
			if ( paragraph in strToKeycode ) {
				await driver.pressKeycode( strToKeycode[ paragraph ] );
			} else {
				// Execute with adb shell input <text> since normal type auto clears field on Android
				await driver.execute( 'mobile: shell', { command: 'input', args: [ 'text', paragraph ] } );
			}
			if ( i !== paragraphs.length - 1 ) {
				await driver.pressKeycode( strToKeycode[ '\n' ] );
			}
		}
	}
};

// Calculates middle x,y and clicks that position
const clickMiddleOfElement = async ( driver: wd.PromiseChainWebdriver, element: wd.PromiseChainWebdriver.Element ) => {
	const location = await element.getLocation();
	const size = await element.getSize();

	const action = await new wd.TouchAction( driver );
	action.press( { x: location.x + ( size.width / 2 ), y: location.y } );
	action.release();
	await action.perform();
};

// Clicks in the top left of an element
const clickBeginningOfElement = async ( driver: wd.PromiseChainWebdriver, element: wd.PromiseChainWebdriver.Element ) => {
	const location = await element.getLocation();
	const action = await new wd.TouchAction( driver );
	action.press( { x: location.x, y: location.y } );
	action.release();
	await action.perform();
};

// long press to activate context menu
const longPressMiddleOfElement = async ( driver: wd.PromiseChainWebdriver, element: wd.PromiseChainWebdriver.Element ) => {
	const location = await element.getLocation();
	const size = await element.getSize();

	const action = await new wd.TouchAction( driver );
	const x = location.x + ( size.width / 2 );
	const y = location.y + ( size.height / 2 );
	action.press( { x, y } );
	action.wait( 2000 );
	action.release();
	await action.perform();
};

// press "Select All" in floating context menu
const tapSelectAllAboveElement = async ( driver: wd.PromiseChainWebdriver, element: wd.PromiseChainWebdriver.Element ) => {
	const location = await element.getLocation();
	const action = await new wd.TouchAction( driver );
	const x = location.x + 300;
	const y = location.y - 50;
	action.press( { x, y } );
	action.release();
	await action.perform();
};

// press "Copy" in floating context menu
const tapCopyAboveElement = async ( driver: wd.PromiseChainWebdriver, element: wd.PromiseChainWebdriver.Element ) => {
	const location = await element.getLocation();
	const action = await new wd.TouchAction( driver );
	const x = location.x + 220;
	const y = location.y - 50;
	action.wait( 2000 );
	action.press( { x, y } );
	action.wait( 2000 );
	action.release();
	await action.perform();
};

// press "Paste" in floating context menu
const tapPasteAboveElement = async ( driver: wd.PromiseChainWebdriver, element: wd.PromiseChainWebdriver.Element ) => {
	const location = await element.getLocation();
	const action = await new wd.TouchAction( driver );
	action.wait( 2000 );
	action.press( { x: location.x + 100, y: location.y - 50 } );
	action.wait( 2000 );
	action.release();
	await action.perform();
};

// Starts from the middle of the screen or the element(if specified)
// and swipes upwards
const swipeUp = async ( driver: wd.PromiseChainWebdriver, element: wd.PromiseChainWebdriver.Element = undefined ) => {
	let size = await driver.getWindowSize();
	let y = 0;
	if ( element !== undefined ) {
		size = await element.getSize();
		const location = await element.getLocation();
		y = location.y;
	}

	const startX = size.width / 2;
	const startY = y + ( size.height / 3 );
	const endX = startX;
	const endY = startY + ( startY * -1 * 0.5 );

	const action = await new wd.TouchAction( driver );
	action.press( { x: startX, y: startY } );
	action.wait( 3000 );
	action.moveTo( { x: endX, y: endY } );
	action.release();
	await action.perform();
};

// Starts from the middle of the screen and swipes downwards
const swipeDown = async ( driver: wd.PromiseChainWebdriver ) => {
	const size = await driver.getWindowSize();
	const y = 0;

	const startX = size.width / 2;
	const startY = y + ( size.height / 3 );
	const endX = startX;
	const endY = startY - ( startY * -1 * 0.5 );

	const action = await new wd.TouchAction( driver );
	action.press( { x: startX, y: startY } );
	action.wait( 3000 );
	action.moveTo( { x: endX, y: endY } );
	action.release();
	await action.perform();
};

const toggleHtmlMode = async ( driver: wd.PromiseChainWebdriver, toggleOn: boolean ) => {
	if ( isAndroid() ) {
		// Hit the "Menu" key
		await driver.pressKeycode( 82 );

		// Go at the end of the popup to hit the "Show html"
		// TODO: c'mon, find a more robust way to hit that item! :(
		for ( let i = 0; i < 10; i++ ) {
			await driver.pressKeycode( 20 );
		}

		// hit Enter
		await driver.pressKeycode( 66 );
	} else {
		const menuButton = await driver.elementByAccessibilityId( '...' );
		await menuButton.click();
		let toggleHtmlButton;
		if ( toggleOn ) {
			toggleHtmlButton = await driver.elementByAccessibilityId( 'Switch to HTML' );
		} else {
			toggleHtmlButton = await driver.elementByAccessibilityId( 'Switch To Visual' );
		}
		await toggleHtmlButton.click();
	}
};

const toggleOrientation = async ( driver: wd.PromiseChainWebdriver ) => {
	const orientation = await driver.getOrientation();
	if ( orientation === 'LANDSCAPE' ) {
		await driver.setOrientation( 'PORTRAIT' );
	} else {
		await driver.setOrientation( 'LANDSCAPE' );
	}
};

module.exports = {
	timer,
	setupDriver,
	isLocalEnvironment,
	isAndroid,
	typeString,
	clickMiddleOfElement,
	clickBeginningOfElement,
	longPressMiddleOfElement,
	tapSelectAllAboveElement,
	tapCopyAboveElement,
	tapPasteAboveElement,
	swipeDown,
	swipeUp,
	stopDriver,
	toggleHtmlMode,
	toggleOrientation,
};
