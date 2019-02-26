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
		console.log("getParagraphBlocks");
	
		await driver.sleep(2000);
		// @content-desc
		const blockName = 'core/paragraph';
		const blockLocator = "//*[contains(@name, '"+ blockName +"')]"
		let paragraphBlocks = await driver.elementsByXPath(blockLocator);

		var currentBlocks = new Set([]);

		for (const paragraphBlock of paragraphBlocks) {
			const elementID = await paragraphBlock.getAttribute("name");
			currentBlocks.add(elementID);
		}

		var newBlocks = currentBlocks.difference(blocks[blockName]);
		console.log("New", newBlocks);
		console.log("Current", currentBlocks);
		if(newBlocks.size === 0) {
			newBlocks = blocks[blockName].difference(currentBlocks);
		}
		console.log("Newnew", newBlocks);

		var newElementAccessibilityId = newBlocks.values().next().value;
		console.log("Accessibility ID:", newElementAccessibilityId);
		const newElement = await driver.elementByAccessibilityId(newElementAccessibilityId);
		blocks[blockName] = currentBlocks;
		return newElement;
	}

	const addParagraphBlock = async () => {
		console.log("Add a block");

		// Click add button
		let addButton = await driver.elementByAccessibilityId('Add block');
		await addButton.click();

		// Click paragraph block 
		let paragraphBlockButton = await driver.elementByAccessibilityId('Paragraph');
		paragraphBlockButton.click();

		return await getNewParagraphBlock();
	}

	it( 'should be able to see editor', async () => {
		var newParagraphBlock = await addParagraphBlock();
		console.log("Block added");
		console.log(await newParagraphBlock.getAttribute("name"))

		var newParagraphBlock = await addParagraphBlock();
		console.log("Block added");
		console.log(await newParagraphBlock.getAttribute("name"))
		expect( await driver.hasElementByAccessibilityId( 'block-list' ) ).toBe( true );
	} );
} );