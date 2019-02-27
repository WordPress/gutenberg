/** @format */

import wd from 'wd';
import child_process from 'child_process';
import fs from 'fs';
var out = fs.openSync('./appium-out.log', 'a');
var err = fs.openSync('./appium-out.log', 'a');

const timer = ms => new Promise( res => setTimeout(res, ms));


jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
const APPIUM_SERVER_ADDRESS = 'localhost';
const APPIUM_SERVER_PORT = 4728;

const defaultPlatform = 'android';
const rnPlatform = process.env.TEST_RN_PLATFORM || defaultPlatform;

var config;
var appium;

var accessibilityIdKey = 'name';
if(rnPlatform === 'android' ) {
	accessibilityIdKey = 'content-desc';
}

if(rnPlatform === 'android' ) {
	config = {
		platformName: 'android',
		deviceName: 'Android Emulator',
		automationName: 'UiAutomator2',
		appPackage: 'com.gutenberg',
		appActivity: 'com.gutenberg.MainActivity',
		noReset: false,
		fullReset: true,
		app: '/Users/javon/Projects/gutenberg-mobile/android/app/build/outputs/apk/debug/app-debug.apk',
	};
} else {
	config = {
		platformName: 'iOS',
		platformVersion: 12.1,
		deviceName: 'iPhone XR',
		automationName: 'XCUITest',
		app: '/Users/javon/Projects/gutenberg-mobile/ios/build/Build/Products/Debug-iphonesimulator/gutenberg.app', // relative to root of project
	};
}

Set.prototype.difference = function(nextSet) 
{ 
    // creating new set to store differnce 
     var differenceSet = new Set(); 
  
    // iterate over the values 
    for(var elem of this) 
    { 
        // if the value[i] is not present  
        // in nextSet add to the differenceSet 
        if(!nextSet.has(elem)) 
            differenceSet.add(elem); 
    } 
  
    // returns values of differenceSet 
    return differenceSet; 
} 

describe( 'Gutenberg Editor tests', () => {
	let driver;
	var blocks={
		'core/paragraph': new Set([])
	};

	const setupAppium = async function(){
		console.log("Waiting for Appium server to finish booting");
		var spawn = child_process.spawn;
		appium = spawn('appium', ['-p', ''+APPIUM_SERVER_PORT],{
			detached: true, stdio: [ 'ignore', out, err ]
			
		});
		console.log("Spawned child PID is " + appium.pid);
		await timer(5000);
		console.log("booted");
	};

	beforeAll( async() => {
		console.log("Setting up appium");
		await setupAppium();
	});

	afterAll( async() => {
		console.log("Killing Appium process");
		appium.kill('SIGINT');
	});

	beforeEach( async () => {
		driver = wd.promiseChainRemote( APPIUM_SERVER_ADDRESS, APPIUM_SERVER_PORT );

		await driver.init( config );
		await driver.status();
		await driver.sleep( 10000 ); // wait for app to load

		await driver.setImplicitWaitTimeout(2000);
	} );

	afterEach( async () => {
		await driver.quit();
	} );

	const getNewParagraphBlock = async () => {
		console.log("getNewParagraphBlock");
	
		await driver.sleep(2000);
		const blockName = 'core/paragraph';
		const blockLocator = "//*[starts-with(@"+ accessibilityIdKey+", '"+ blockName +"')]"
		let paragraphBlocks = await driver.elementsByXPath(blockLocator);

		var currentBlocks = new Set([]);

		for (const paragraphBlock of paragraphBlocks) {
			const elementID = await paragraphBlock.getAttribute(accessibilityIdKey);
			currentBlocks.add(elementID);
		}

		var newBlocks = currentBlocks.difference(blocks[blockName]);
		if(newBlocks.size === 0) {
			newBlocks = blocks[blockName].difference(currentBlocks);
		}

		var newElementAccessibilityId = newBlocks.values().next().value;
		const newElement = await driver.elementByAccessibilityId(newElementAccessibilityId);
		blocks[blockName] = currentBlocks;
		return newElement;
	};

	const getNewParagraphBlockTextView = async (newParagraphBlock) => {
		console.log("getNewParagraphBlocktextTextView");
	

		await driver.sleep(2000);
		var textViewElement = 'XCUIElementTypeTextView';
		if(rnPlatform === 'android') {
			textViewElement = 'android.widget.EditText';
		}
		let newParagraphBlockId = await newParagraphBlock.getAttribute(accessibilityIdKey);
		const blockLocator = "//*[starts-with(@"+ accessibilityIdKey+", '"+ newParagraphBlockId +"')]//" + textViewElement;
		return await driver.elementByXPath(blockLocator);
	};

	const addParagraphBlock = async () => {
		console.log("Add a block");

		// Click add button
		let addButton = await driver.elementByAccessibilityId('Add block');
		await addButton.click();

		// Click paragraph block 
		let paragraphBlockButton = await driver.elementByAccessibilityId('Paragraph');
		paragraphBlockButton.click();

		return await getNewParagraphBlock();
	};

	const typeString = async (element, str) => { // Problem with Appium type function needing to be cleared after first attempt
		await element.clear();
		await element.type(str);
		await element.clear();
		await element.type(str);
	};

	it( 'should be able to see editor', async () => {
		var newParagraphBlock = await addParagraphBlock();

		let newParagraphBlockTextView = await getNewParagraphBlockTextView(newParagraphBlock);
		await newParagraphBlockTextView.click();
		await newParagraphBlockTextView.type("Hello Gutenberg!");

		expect( await driver.hasElementByAccessibilityId( 'block-list' ) ).toBe( true );
	} );
} );