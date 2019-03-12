/**
 * @format
 * */

import wd from 'wd';
import { child_process as childProcess } from 'child_process';
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

	const setupAppium = async function() {
		const spawn = childProcess.spawn;
		appium = spawn( 'appium', [ '-p', '' + APPIUM_SERVER_PORT ], {
			detached: true, stdio: [ 'ignore', out, err ],

		} );
		await timer( 5000 );
	};

	beforeAll( async () => {
		await setupAppium();
	} );

	afterAll( async () => {
		appium.kill( 'SIGINT' );
	} );

	beforeEach( async () => {
		driver = wd.promiseChainRemote( APPIUM_SERVER_ADDRESS, APPIUM_SERVER_PORT );

		await driver.init( config );
		await driver.status();
		await driver.sleep( 10000 ); // wait for app to load

		await driver.setImplicitWaitTimeout( 2000 );
	} );

	afterEach( async () => {
		await driver.quit();
	} );

	it( 'should be able to add a new Paragraph block', async () => {
		const editorPage = new EditorPage( driver ).expect( );
		const paragraphBlock = await editorPage.addNewBlock( new ParagraphBlock( driver, 'Paragraph' ) );
		await paragraphBlock.sendText( 'Hello Gutenberg!' );

		expect( await paragraphBlock.getText() ).toBe( 'Hello Gutenberg!' );
	} );
} );
