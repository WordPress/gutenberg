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

jest.setTimeout( 1000000 );

describe( 'Gutenberg Editor tests', () => {
	let driver;
	let editorPage;
	let allPassed = true;
	const paragraphBlockName = 'Paragraph';

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
		await editorPage.addNewBlock( paragraphBlockName );
		let paragraphBlockElement = await editorPage.getBlockAtPosition(
			paragraphBlockName
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			testData.mediumText
		);

		await toggleOrientation( driver );
		// On Android the keyboard hides the add block button, let's hide it after rotation
		if ( isAndroid() ) {
			await driver.hideDeviceKeyboard();
		}

		await editorPage.addNewBlock( paragraphBlockName );

		if ( isAndroid() ) {
			await driver.hideDeviceKeyboard();
		}

		paragraphBlockElement = await editorPage.getBlockAtPosition(
			paragraphBlockName,
			2
		);
		while ( ! paragraphBlockElement ) {
			await driver.hideDeviceKeyboard();
			paragraphBlockElement = await editorPage.getBlockAtPosition(
				paragraphBlockName,
				2
			);
		}
		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			testData.mediumText
		);
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
