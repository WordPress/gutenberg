/**
 * @format
 * */

import wd from 'wd';
import childProcess from 'child_process';
import fs from 'fs';
import EditorPage from './pages/editor-page';
import ParagraphBlock from './blocks/paragraph-block';
const out = fs.openSync( './appium-out.log', 'a' );
const err = fs.openSync( './appium-out.log', 'a' );

const timer = ( ms ) => new Promise( ( res ) => setTimeout( res, ms ) );

jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
const APPIUM_SERVER_ADDRESS = 'localhost';
const APPIUM_SERVER_PORT = 4728;

const defaultPlatform = 'android';
const rnPlatform = process.env.TEST_RN_PLATFORM || defaultPlatform;
const spawn = childProcess.spawn;

let config;
let appium;

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

describe( 'Gutenberg Editor tests', () => {
	let driver;
	let editorPage;

	const rename = async ( path, newPath ) => {
		await fs.rename( path, newPath, ( error ) => {
			if ( error ) {
				throw error;
			}
		} );
	};

	const setupData = async () => {
		await rename( 'src/app/initial-html.js', 'src/app/initial-html.tmp.js' );
		await rename( 'src/app/initial-device-tests-html.js', 'src/app/initial-html.js' );
	};

	const setupAppium = async () => {
		appium = await spawn( 'appium', [ '-p', '' + APPIUM_SERVER_PORT ], {
			detached: true, stdio: [ 'ignore', out, err ],

		} );
		await timer( 5000 );
	};

	const setupDriver = async () => {
		driver = wd.promiseChainRemote( APPIUM_SERVER_ADDRESS, APPIUM_SERVER_PORT );

		await driver.init( config );
		await driver.status();
		await driver.sleep( 10000 ); // wait for app to load

		await driver.setImplicitWaitTimeout( 2000 );
	};

	beforeAll( async () => {
		await setupAppium();
		await setupData();
		await setupDriver();
	} );

	afterAll( async () => {
		await rename( 'src/app/initial-html.js', 'src/app/initial-device-tests-html.js' );
		await rename( 'src/app/initial-html.tmp.js', 'src/app/initial-html.js' );
		await driver.quit();
		await appium.kill( 'SIGINT' );
	} );

	it( 'should be able to see visual editor', async () => {
		editorPage = new EditorPage( driver );
		await editorPage.expect();
	} );

	it( 'should be able to add a new Paragraph block', async () => {
		let paragraphBlock = new ParagraphBlock( driver, 'Paragraph' );
		paragraphBlock = await editorPage.addNewBlock( paragraphBlock );
		await paragraphBlock.sendText( 'Hello Gutenberg!' );

		expect( await paragraphBlock.getText() ).toBe( 'Hello Gutenberg!' );
	} );
} );
