/**
 * @format
 * */

/**
 * Internal dependencies
 */
import EditorPage from './pages/editor-page';
import {
	setupDriver,
	isLocalEnvironment,
	stopDriver,
	isAndroid,
	toggleOrientation,
} from './helpers/utils';
import testData from './helpers/test-data';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 300000;

describe( 'Gutenberg Editor tests', () => {
	let driver;
	let editorPage;
	let allPassed = true;

	// Use reporter for setting status for saucelabs Job
	if ( ! isLocalEnvironment() ) {
		const reporter = {
			specDone: async ( result ) => {
				allPassed = allPassed && result.status !== 'failed';
			},
		};

		jasmine.getEnv().addReporter( reporter );
	}

	beforeAll( async () => {
		driver = await setupDriver();
		editorPage = new EditorPage( driver );
	} );

	it( 'should be able to see visual editor', async () => {
		await expect( editorPage.getBlockList() ).resolves.toBe( true );
	} );

	it( 'should be able to add blocks , rotate device and continue adding blocks', async () => {
		await editorPage.addNewParagraphBlock();
		let paragraphBlockElement = await editorPage.getParagraphBlockAtPosition( 1 );
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.sendTextToParagraphBlock( paragraphBlockElement, testData.mediumText );

		await toggleOrientation( driver );
		// On Android the keyboard hides the add block button, let's hide it after rotation
		if ( isAndroid() ) {
			await driver.hideDeviceKeyboard();
		}

		await editorPage.addNewParagraphBlock();

		if ( isAndroid() ) {
			await driver.hideDeviceKeyboard();
		}

		paragraphBlockElement = await editorPage.getParagraphBlockAtPosition( 2 );
		while ( ! paragraphBlockElement ) {
			await driver.hideDeviceKeyboard();
			paragraphBlockElement = await editorPage.getParagraphBlockAtPosition( 2 );
		}
		await editorPage.sendTextToParagraphBlock( paragraphBlockElement, testData.mediumText );
		await toggleOrientation( driver );

		await editorPage.verifyHtmlContent( testData.deviceRotationHtml );
	} );

	afterAll( async () => {
		if ( ! isLocalEnvironment() ) {
			driver.sauceJobStatus( allPassed );
		}
		await stopDriver( driver );
	} );
} );
