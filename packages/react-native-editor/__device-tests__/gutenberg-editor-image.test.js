/**
 * Internal dependencies
 */
import EditorPage from './pages/editor-page';
import {
	setupDriver,
	isLocalEnvironment,
	stopDriver,
	isAndroid,
	clickMiddleOfElement,
	swipeUp,
} from './helpers/utils';
import testData from './helpers/test-data';

jest.setTimeout( 1000000 );

describe( 'Gutenberg Editor Image Block tests @canary', () => {
	let driver;
	let editorPage;
	let allPassed = true;
	const imageBlockName = 'Image';
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

	it( 'should be able to add an image block', async () => {
		await editorPage.addNewBlock( imageBlockName );
		let imageBlock = await editorPage.getBlockAtPosition( imageBlockName );

		// Can only add image from media library on iOS
		if ( ! isAndroid() ) {
			await editorPage.selectEmptyImageBlock( imageBlock );
			await editorPage.chooseMediaLibrary();

			// Workaround because of #952
			const titleElement = await editorPage.getTitleElement();
			await clickMiddleOfElement( driver, titleElement );
			await editorPage.dismissKeyboard();
			// end workaround

			imageBlock = await editorPage.getBlockAtPosition( imageBlock );
			await swipeUp( driver, imageBlock );
			await editorPage.enterCaptionToSelectedImageBlock(
				testData.imageCaption,
				true
			);
			await editorPage.dismissKeyboard();
		}
		await editorPage.addNewBlock( paragraphBlockName );
		const paragraphBlockElement = await editorPage.getBlockAtPosition(
			paragraphBlockName,
			2
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.sendTextToParagraphBlock( 2, testData.shortText );

		// skip HTML check for Android since we couldn't add image from media library
		if ( ! isAndroid() ) {
			await editorPage.verifyHtmlContent( testData.imageShorteHtml );
		}
	} );

	afterAll( async () => {
		if ( ! isLocalEnvironment() ) {
			driver.sauceJobStatus( allPassed );
		}
		await stopDriver( driver );
	} );
} );
