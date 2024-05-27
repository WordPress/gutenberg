/**
 * External dependencies
 */
const childProcess = require( 'child_process' );
// eslint-disable-next-line import/no-extraneous-dependencies, import/named
import { remote, Key } from 'webdriverio';

const crypto = require( 'crypto' );
const path = require( 'path' );
/**
 * Internal dependencies
 */
const serverConfigs = require( './serverConfigs' );
const {
	iosServer,
	iosLocal,
	android,
	sauceOptions,
	prefixKeysWithAppium,
} = require( './caps' );
const AppiumLocal = require( './appium-local' );
import { getAndroidEmulatorID } from './get-android-emulator-id';

// Platform setup.
const defaultPlatform = 'android';
const rnPlatform = process.env.TEST_RN_PLATFORM || defaultPlatform;
const iPadDevice = process.env.IPAD;

// Environment setup, local environment or Sauce Labs.
const defaultEnvironment = 'local';
const testEnvironment = process.env.TEST_ENV || defaultEnvironment;

// Local App Paths.
const defaultAndroidAppPath =
	'./android/app/build/outputs/apk/debug/app-debug.apk';
const defaultIOSAppPath =
	'./ios/build/GutenbergDemo/Build/Products/Release-iphonesimulator/GutenbergDemo.app';
const webDriverAgentPath = process.env.WDA_PATH || './ios/build/WDA';

const localAndroidAppPath =
	process.env.ANDROID_APP_PATH || defaultAndroidAppPath;
const localIOSAppPath = process.env.IOS_APP_PATH || defaultIOSAppPath;

const localAppiumPort = serverConfigs.local.port; // Port to spawn appium process for local runs.
let appiumProcess;

const backspace = '\u0008';

const IOS_BUNDLE_ID = 'org.wordpress.gutenberg.development';
const ANDROID_COMPONENT_NAME = 'com.gutenberg/.MainActivity';
const SAUCE_LABS_TIMEOUT = 240;

const timer = ( ms ) => new Promise( ( res ) => setTimeout( res, ms ) );

const isAndroid = () => {
	return rnPlatform.toLowerCase() === 'android';
};

const isLocalEnvironment = () => {
	return testEnvironment.toLowerCase() === 'local';
};

const getIOSPlatformVersions = ( { requiredVersion } ) => {
	const { runtimes = [] } = JSON.parse(
		childProcess.execSync( 'xcrun simctl list runtimes --json' ).toString()
	);

	const majorVersion = requiredVersion.split( '.' )[ 0 ];
	return runtimes
		.reverse()
		.filter(
			( { name, isAvailable, version } ) =>
				name.startsWith( 'iOS' ) &&
				new RegExp( `^${ majorVersion }(\\.\\d+)*$` ).test( version ) &&
				isAvailable
		);
};

const PLATFORM_NAME = isAndroid() ? 'Android' : 'iOS';

// Initialises the driver and desired capabilities for appium.
const setupDriver = async () => {
	const branch = process.env.CIRCLE_BRANCH || '';
	const safeBranchName = branch.replace( /\//g, '-' );
	if ( isLocalEnvironment() ) {
		try {
			appiumProcess = await AppiumLocal.start( {
				port: localAppiumPort,
			} );
		} catch ( err ) {
			// Ignore error here, Appium is probably already running (Appium Inspector has its own server for instance)
			// eslint-disable-next-line no-console
			await console.log(
				'Could not start Appium server',
				err.toString()
			);
		}
	}

	let desiredCaps;
	if ( isAndroid() ) {
		desiredCaps = { ...android };
		if ( isLocalEnvironment() ) {
			const androidDeviceID = getAndroidEmulatorID();
			desiredCaps.app = path.resolve( localAndroidAppPath );
			desiredCaps.udid = androidDeviceID;
			try {
				const androidVersion = childProcess
					.execSync(
						`adb -s ${ androidDeviceID } shell getprop ro.build.version.release`
					)
					.toString()
					.replace( /^\s+|\s+$/g, '' );
				delete desiredCaps.platformVersion;
				desiredCaps.deviceName = 'Android Emulator';
				// eslint-disable-next-line no-console
				console.log(
					'Detected Android device running Android %s',
					androidVersion
				);
			} catch ( error ) {
				// Ignore error.
			}
		} else {
			desiredCaps.app = `storage:filename=Gutenberg-${ safeBranchName }.apk`; // App should be preloaded to sauce storage, this can also be a URL.
			desiredCaps.newCommandTimeout = SAUCE_LABS_TIMEOUT;
		}
	} else {
		desiredCaps = iosServer( { iPadDevice } );
		desiredCaps.newCommandTimeout = SAUCE_LABS_TIMEOUT;
		desiredCaps.app = `storage:filename=Gutenberg-${ safeBranchName }.app.zip`; // App should be preloaded to sauce storage, this can also be a URL.
		if ( isLocalEnvironment() ) {
			desiredCaps = iosLocal( { iPadDevice } );

			const iosPlatformVersions = getIOSPlatformVersions( {
				requiredVersion: desiredCaps.platformVersion,
			} );
			if ( iosPlatformVersions.length === 0 ) {
				throw new Error(
					`No compatible iOS simulators available! Please verify that you have iOS ${ desiredCaps.platformVersion } simulators installed.`
				);
			}
			// eslint-disable-next-line no-console
			console.log(
				'Available iOS platform versions:',
				iosPlatformVersions.map( ( { name } ) => name )
			);

			if ( ! desiredCaps.platformVersion ) {
				desiredCaps.platformVersion = iosPlatformVersions[ 0 ].version;

				// eslint-disable-next-line no-console
				console.log(
					`Using iOS ${ desiredCaps.platformVersion } platform version`
				);
			}

			desiredCaps.app = path.resolve( localIOSAppPath );
			desiredCaps.derivedDataPath = path.resolve( webDriverAgentPath );
		}
	}

	const sauceOptionsConfig = ! isLocalEnvironment()
		? {
				'sauce:options': {
					...sauceOptions,
					name: `Gutenberg Editor Tests[${ rnPlatform }]-${ branch }`,
					tags: [ 'Gutenberg', branch ],
				},
		  }
		: {};
	const serverConfig = isLocalEnvironment()
		? serverConfigs.local
		: serverConfigs.sauce;

	const driver = await remote( {
		...serverConfig,
		logLevel: 'error',
		capabilities: {
			platformName: PLATFORM_NAME,
			...prefixKeysWithAppium( desiredCaps ),
			...sauceOptionsConfig,
		},
	} );

	await driver.setOrientation( 'PORTRAIT' );
	return driver;
};

const stopDriver = async ( driver ) => {
	if ( ! isLocalEnvironment() ) {
		const sessionId = driver.sessionId;

		const secret = `${ serverConfigs.sauce.user }:${ serverConfigs.sauce.key }`;
		const token = crypto
			.createHmac( 'md5', secret )
			.update( sessionId )
			.digest( 'hex' );
		const jobURL = `https://app.saucelabs.com/tests/${ sessionId }?auth=${ token }`;
		// eslint-disable-next-line no-console
		console.log( `You can view the video of this test run at ${ jobURL }` );
	}
	if ( driver === undefined ) {
		return;
	}
	await driver.deleteSession();

	if ( appiumProcess !== undefined ) {
		await AppiumLocal.stop( appiumProcess );
	}
};

const typeString = async ( driver, element, str, clear ) => {
	if ( isKeycode( str ) ) {
		const keyCode = isAndroid() ? getKeycode( str ) : str;
		return await pressKeycode( driver, keyCode );
	}

	if ( clear ) {
		await element.clearValue();
		// This helps prevent skipping characters when the initial
		// value was previously removed.
		await driver.pause( 2000 );
	}

	await element.addValue( str );

	if ( ! isAndroid() ) {
		// Await the completion of the scroll-to-text-input animation
		await driver.pause( 3000 );
	}
};

/**
 * Returns the mapped keycode for a string to use in `pressKeycode` function.
 *
 * @param {string} str String associated to a keycode
 */
const getKeycode = ( str ) => {
	if ( isAndroid() ) {
		// On Android, we map keycodes using Android values.
		// Reference: https://developer.android.com/reference/android/view/KeyEvent.html
		return {
			'\n': 66,
			[ backspace ]: 67,
		}[ str ];
	}
	// On iOS, we map keycodes using the special keys defined in WebdriverIO.
	// Reference: https://webdriver.io/docs/api/browser/action/#special-characters
	return {
		'\n': Key.Enter,
		[ backspace ]: Key.Backspace,
	}[ str ];
};

/**
 * Determines if the string is mapped to a keycode.
 *
 * @param {string} str String potentially associated to a keycode
 */
const isKeycode = ( str ) => {
	return !! getKeycode( str );
};

/**
 * Presses the specified keycode.
 *
 * @param {*} driver  WebDriver instance
 * @param {*} keycode Keycode to press
 */
const pressKeycode = async ( driver, keycode ) => {
	if ( isAndroid() ) {
		// `pressKeyCode` command is only implemented on Android
		return await driver.pressKeyCode( keycode );
	}
	// `sendKeys` command only works on iOS. On Android, executing this
	// results in typing a special character instead.
	return await driver.sendKeys( [ keycode ] );
};

// Calculates middle x,y and clicks that position
const clickMiddleOfElement = async ( driver, element ) => {
	const location = await element.getLocation();
	const size = await element.getSize();

	await driver
		.action( 'pointer', {
			parameters: { pointerType: 'touch' },
		} )
		.move( { x: location.x + size.width / 2, y: location.y } )
		.down()
		.up()
		.perform();
};

// Clicks in the top left of an element.
const clickBeginningOfElement = async ( driver, element ) => {
	const location = await element.getLocation();
	await driver
		.action( 'pointer', {
			parameters: { pointerType: 'touch' },
		} )
		.move( { x: location.x, y: location.y } )
		.down()
		.up()
		.perform();
};

async function longPressElement(
	driver,
	element,
	{ waitTime = 1000, offset = { x: 0, y: 0 } } = {}
) {
	// Focus on the element first, otherwise on iOS it fails to open the context menu.
	// We can't do it all in one action because it detects it as a force press and it
	// is not supported by the simulator.
	await driver
		.action( 'pointer', {
			parameters: { pointerType: 'touch' },
		} )
		.move( { origin: element } )
		.down()
		.up()
		.perform();

	const location = await element.getLocation();
	const size = await element.getSize();

	let offsetX = offset.x;
	if ( typeof offset.x === 'function' ) {
		offsetX = offset.x( size.width );
	}
	let offsetY = offset.y;
	if ( typeof offset.y === 'function' ) {
		offsetY = offset.y( size.height );
	}

	// Long-press
	await driver
		.action( 'pointer', {
			parameters: { pointerType: 'touch' },
		} )
		.move( { x: location.x + offsetX, y: location.y + offsetY } )
		.down()
		.pause( waitTime )
		.up()
		.perform();
}

// Long press to activate context menu.
const longPressMiddleOfElement = async (
	driver,
	element,
	{ waitTime = 1000 } = {}
) => {
	await longPressElement( driver, element, {
		waitTime,
		offset: {
			x: ( width ) => width / 2,
			y: ( height ) => height / 2,
		},
	} );
};

const tapStatusBariOS = async ( driver ) => {
	await driver
		.action( 'pointer', {
			parameters: { pointerType: 'touch' },
		} )
		.move( { x: 20, y: 20 } )
		.down()
		.up()
		.pause( 100 )
		.perform();

	// Wait for the scroll animation to finish
	await driver.pause( 3000 );
};

const selectTextFromElement = async ( driver, element ) => {
	const timeout = 1000;

	// On Android we can't "locate" the context menu options,
	// To avoid having fixed coordinates to be able to
	// select all text, it just selects all text by
	// long-pressing and dragging.
	if ( isAndroid() ) {
		await element.click();

		const location = await element.getLocation();
		const size = await element.getSize();
		const paddingPercentage = 0.2;
		const leftPaddingOffset = size.width * paddingPercentage;
		const startX = location.x + leftPaddingOffset;
		const endX = location.x + size.width;
		const centerY = location.y + size.height / 2;

		await driver
			.action( 'pointer', {
				parameters: { pointerType: 'touch' },
			} )
			.move( { x: startX, y: centerY } )
			.down()
			.pause( timeout ) // Long-press at the start of the element
			.move( { x: endX, y: centerY, duration: 1000 } ) // Slowly drag to the end of the element to highlight all text
			.up()
			.pause( timeout ) // Pause to wait for the context menu to show up
			.perform();
	} else {
		// On iOS we can use the context menu to "Select all" text.
		await longPressMiddleOfElement( driver, element );

		const selectAllElement = await driver.$(
			'//XCUIElementTypeMenuItem[@name="Select All"]'
		);
		await selectAllElement.waitForDisplayed( { timeout } );
		await selectAllElement.click();
	}
};

/**
 * Starts from the middle of the screen or the element(if specified)
 * and swipes upwards.
 *
 * @param {Object} driver                  WebdriverIO driver
 * @param {Object} element                 Element to swipe from
 * @param {Object} options                 Options
 * @param {number} options.delay           Delay between the swipe and the next action
 * @param {number} options.endYCoefficient Multiplier for the end Y coordinate
 */
const swipeUp = async (
	driver,
	element = undefined,
	{ delay = 3000, endYCoefficient = 0.5 } = {}
) => {
	let size = await driver.getWindowSize();
	let y = 0;
	if ( element !== undefined ) {
		size = await element.getSize();
		const location = await element.getLocation();
		y = location.y;
	}

	const startX = size.width / 2;
	const startY = y + size.height / 3;
	const endX = startX;
	const endY = startY + startY * -1 * endYCoefficient;

	await swipeFromTo(
		driver,
		{ x: startX, y: startY },
		{ x: endX, y: endY },
		delay
	);
};

const defaultCoordinates = { x: 0, y: 0 };
const swipeFromTo = async (
	driver,
	from = defaultCoordinates,
	to = defaultCoordinates,
	delay = 0
) =>
	await driver
		.action( 'pointer', {
			parameters: { pointerType: 'touch' },
		} )
		.move( { ...from, duration: 0 } )
		.down( { button: 0 } )
		.move( { ...to, duration: 300 } )
		.up( { button: 0 } )
		.pause( delay )
		.perform();

/**
 * Starts from the middle of the screen and swipes downwards
 *
 * @param {Object} driver                  WebdriverIO driver
 * @param {Object} options                 Options
 * @param {number} options.delay           Delay between the swipe and the next action
 * @param {number} options.endYCoefficient Multiplier for the end Y coordinate
 */
const swipeDown = async (
	driver,
	{ delay = 3000, endYCoefficient = 0.5 } = {}
) => {
	const size = await driver.getWindowSize();
	const y = 0;

	const startX = size.width / 2;
	const startY = y + size.height / 3;
	const endX = startX;
	const endY = startY - startY * -1 * endYCoefficient;

	await swipeFromTo(
		driver,
		{ x: startX, y: startY },
		{ x: endX, y: endY },
		delay
	);
};

// Drag & Drop after element
const dragAndDropAfterElement = async ( driver, element, nextElement ) => {
	// Element to drag & drop
	const elementLocation = await element.getLocation();
	const elementSize = await element.getSize();
	const x = elementLocation.x + elementSize.width / 2;
	const y = elementLocation.y + elementSize.height / 2;

	// Element to drag & drop to
	const nextElementLocation = await nextElement.getLocation();
	const nextElementSize = await nextElement.getSize();
	const nextYPosition = isAndroid()
		? elementLocation.y + nextElementLocation.y + nextElementSize.height
		: nextElementLocation.y + nextElementSize.height;

	await driver
		.action( 'pointer', {
			parameters: { pointerType: 'touch' },
		} )
		.move( { x, y } )
		.down()
		.pause( 5000 )
		.move( { x, y: nextYPosition, duration: 500 } )
		.up()
		.perform();
};

const toggleHtmlMode = async ( driver, toggleOn ) => {
	if ( isAndroid() ) {
		const moreOptionsButton = await driver.$( '~More options' );
		await moreOptionsButton.click();

		const showHtmlButtonXpath =
			'/hierarchy/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.ListView/android.widget.TextView[9]';

		await clickIfClickable( driver, showHtmlButtonXpath );
	} else if ( toggleOn ) {
		const moreOptionsButton = await driver.$( '~editor-menu-button' );
		await moreOptionsButton.click();

		await clickIfClickable(
			driver,
			'//XCUIElementTypeButton[@name="Switch to HTML"]'
		);
	} else {
		// This is to wait for the clipboard paste notification to disappear, currently it overlaps with the menu button
		await driver.pause( 3000 );
		const moreOptionsButton = await driver.$( '~editor-menu-button' );
		await moreOptionsButton.click();
		await clickIfClickable(
			driver,
			'//XCUIElementTypeButton[@name="Switch To Visual"]'
		);
	}
};

const toggleOrientation = async ( driver ) => {
	const orientation = await driver.getOrientation();
	if ( orientation === 'LANDSCAPE' ) {
		await driver.setOrientation( 'PORTRAIT' );
	} else {
		await driver.setOrientation( 'LANDSCAPE' );
	}
};

/**
 * Toggle the device dark mode.
 *
 * @param {Object}  driver   Driver
 * @param {boolean} darkMode Whether to enable dark mode or not
 */
const toggleDarkMode = ( driver, darkMode = true ) => {
	if ( isAndroid() ) {
		return driver.executeScript( 'mobile: shell', [
			{
				command: `cmd uimode night  ${ darkMode ? 'yes' : 'no' }`,
			},
		] );
	}

	return driver.executeScript( 'mobile: setAppearance', [
		{
			style: darkMode ? 'dark' : 'light',
		},
	] );
};

const isEditorVisible = async ( driver ) => {
	const postTitleLocator = isAndroid()
		? `//android.widget.EditText[contains(@content-desc, "Post title")]`
		: `(//XCUIElementTypeScrollView/XCUIElementTypeOther/XCUIElementTypeOther[contains(@name, "Post title")])`;

	await driver.$( postTitleLocator ).waitForDisplayed( { timeout: 30000 } );
};

const waitForMediaLibrary = async ( driver ) => {
	const accessibilityIdXPathAttrib = isAndroid() ? 'content-desc' : 'name';
	const accessibilityId = 'WordPress Media Library';
	const locator = `//*[@${ accessibilityIdXPathAttrib }="${ accessibilityId }"]`;
	await waitForVisible( driver, locator );
};

/**
 * @param {string} driver
 * @param {string} elementLocator
 * @param {number} maxIteration    - Default value is 25
 * @param {string} elementToReturn - Options are allElements, lastElement, firstElement. Defaults to "firstElement"
 * @param {number} iteration       - Default value is 0
 * @return {string} - Returns the first element found, empty string if not found
 */
const waitForVisible = async (
	driver,
	elementLocator,
	maxIteration = 25,
	elementToReturn = 'firstElement',
	iteration = 0
) => {
	const timeout = 1000;

	if ( iteration >= maxIteration ) {
		// if element not found, print error and return empty string
		// eslint-disable-next-line no-console
		console.error(
			`"${ elementLocator }" is still not visible after ${ iteration } retries!`
		);
		return '';
	} else if ( iteration !== 0 ) {
		// wait before trying to locate element again
		await driver.pause( timeout );
	}

	const elements = await driver.$$( elementLocator );
	if ( elements.length === 0 ) {
		// if locator is not visible, try again
		return waitForVisible(
			driver,
			elementLocator,
			maxIteration,
			elementToReturn,
			iteration + 1
		);
	}

	switch ( elementToReturn ) {
		case 'allElements':
			return elements;
		case 'lastElement':
			return elements[ elements.length - 1 ];
		default:
			// Default is to return first element
			return elements[ 0 ];
	}
};

/**
 * @param {string} driver
 * @param {string} elementLocator
 * @param {number} maxIteration    - Default value is 25, can be adjusted to be less to wait for element to not be visible
 * @param {string} elementToReturn - Options are allElements, lastElement, firstElement. Defaults to "firstElement"
 * @return {boolean} - Returns true if element is found, false otherwise
 */
const isElementVisible = async (
	driver,
	elementLocator,
	maxIteration = 25,
	elementToReturn = 'firstElement'
) => {
	const element = await waitForVisible(
		driver,
		elementLocator,
		maxIteration,
		elementToReturn
	);

	// if there is no element, return false
	if ( ! element ) {
		return false;
	}

	return true;
};

const clickIfClickable = async (
	driver,
	elementLocator,
	maxIteration = 25,
	elementToReturn = 'firstElement',
	iteration = 0
) => {
	const element = await waitForVisible(
		driver,
		elementLocator,
		maxIteration,
		elementToReturn,
		iteration
	);

	try {
		return await element.click();
	} catch ( error ) {
		if ( iteration >= maxIteration ) {
			// eslint-disable-next-line no-console
			console.error(
				`"${ elementLocator }" still not clickable after "${ iteration }" retries`
			);
			return '';
		}

		return clickIfClickable(
			driver,
			elementLocator,
			maxIteration,
			elementToReturn,
			iteration + 1
		);
	}
};

const launchApp = async ( driver, initialProps = {} ) => {
	if ( isAndroid() ) {
		await driver.execute( 'mobile: startActivity', {
			component: ANDROID_COMPONENT_NAME,
			stop: true,
			extras: [
				[
					's',
					'initialProps',
					`'${ JSON.stringify( initialProps ) }'`,
				],
			],
		} );
	} else {
		await driver.execute( 'mobile: terminateApp', {
			bundleId: IOS_BUNDLE_ID,
		} );
		await driver.execute( 'mobile: launchApp', {
			bundleId: IOS_BUNDLE_ID,
			arguments: [ 'uitesting', JSON.stringify( initialProps ) ],
		} );
	}
};

module.exports = {
	backspace,
	clickBeginningOfElement,
	clickIfClickable,
	clickMiddleOfElement,
	dragAndDropAfterElement,
	isAndroid,
	isEditorVisible,
	isElementVisible,
	isLocalEnvironment,
	launchApp,
	longPressElement,
	longPressMiddleOfElement,
	selectTextFromElement,
	setupDriver,
	stopDriver,
	swipeDown,
	swipeFromTo,
	swipeUp,
	tapStatusBariOS,
	timer,
	toggleDarkMode,
	toggleHtmlMode,
	toggleOrientation,
	typeString,
	waitForMediaLibrary,
	waitForVisible,
};
