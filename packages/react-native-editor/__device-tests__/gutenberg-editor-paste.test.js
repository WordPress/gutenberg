/**
 * Internal dependencies
 */
import EditorPage from './pages/editor-page';
import {
	setupDriver,
	isLocalEnvironment,
	longPressMiddleOfElement,
	tapSelectAllAboveElement,
	tapCopyAboveElement,
	tapPasteAboveElement,
	stopDriver,
	isAndroid,
} from './helpers/utils';
import testData from './helpers/test-data';

jest.setTimeout( 1000000 );

describe( 'Gutenberg Editor paste tests', () => {
	// skip iOS for now
	if ( ! isAndroid() ) {
		it( 'skips the tests on any platform other than Android', async () => {} );
		return;
	}

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
		await driver.setClipboard( '', 'plaintext' );
		editorPage = new EditorPage( driver );
	} );

	it( 'copies plain text from one paragraph block and pastes in another', async () => {
		await editorPage.addNewBlock( paragraphBlockName );
		const paragraphBlockElement = await editorPage.getBlockAtPosition(
			paragraphBlockName
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			testData.pastePlainText
		);
		const textViewElement = await editorPage.getTextViewForParagraphBlock(
			paragraphBlockElement
		);

		// copy content to clipboard
		await longPressMiddleOfElement( driver, textViewElement );
		await tapSelectAllAboveElement( driver, textViewElement );
		await tapCopyAboveElement( driver, textViewElement );

		// create another paragraph block
		await editorPage.addNewBlock( paragraphBlockName );
		const paragraphBlockElement2 = await editorPage.getBlockAtPosition(
			paragraphBlockName,
			2
		);
		if ( isAndroid() ) {
			await paragraphBlockElement2.click();
		}

		const textViewElement2 = await editorPage.getTextViewForParagraphBlock(
			paragraphBlockElement2
		);

		// paste into second paragraph block
		await longPressMiddleOfElement( driver, textViewElement2 );
		await tapPasteAboveElement( driver, textViewElement2 );

		const text = await editorPage.getTextForParagraphBlockAtPosition( 2 );
		expect( text ).toBe( testData.pastePlainText );
	} );

	it( 'copies styled text from one paragraph block and pastes in another', async () => {
		// create paragraph block with styled text by editing html
		await editorPage.setHtmlContent( testData.pasteHtmlText );
		const paragraphBlockElement = await editorPage.getBlockAtPosition(
			paragraphBlockName
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		const textViewElement = await editorPage.getTextViewForParagraphBlock(
			paragraphBlockElement
		);

		// copy content to clipboard
		await longPressMiddleOfElement( driver, textViewElement );
		await tapSelectAllAboveElement( driver, textViewElement );
		await tapCopyAboveElement( driver, textViewElement );

		// create another paragraph block
		await editorPage.addNewBlock( paragraphBlockName );
		const paragraphBlockElement2 = await editorPage.getBlockAtPosition(
			paragraphBlockName,
			2
		);
		if ( isAndroid() ) {
			await paragraphBlockElement2.click();
		}

		const textViewElement2 = await editorPage.getTextViewForParagraphBlock(
			paragraphBlockElement2
		);

		// paste into second paragraph block
		await longPressMiddleOfElement( driver, textViewElement2 );
		await tapPasteAboveElement( driver, textViewElement2 );

		// check styled text by verifying html contents
		await editorPage.verifyHtmlContent( testData.pasteHtmlTextResult );
	} );

	afterAll( async () => {
		if ( ! isLocalEnvironment() ) {
			driver.sauceJobStatus( allPassed );
		}
		await stopDriver( driver );
	} );
} );
