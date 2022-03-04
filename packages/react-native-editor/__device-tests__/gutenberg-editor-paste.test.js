/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import {
	longPressMiddleOfElement,
	tapSelectAllAboveElement,
	tapCopyAboveElement,
	tapPasteAboveElement,
	isAndroid,
} from './helpers/utils';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor paste tests', () => {
	// skip iOS for now
	if ( ! isAndroid() ) {
		it( 'skips the tests on any platform other than Android', async () => {
			expect( true ).toBe( true );
		} );
		return;
	}

	beforeAll( async () => {
		await editorPage.driver.setClipboard( '', 'plaintext' );
	} );

	it( 'copies plain text from one paragraph block and pastes in another', async () => {
		await editorPage.addNewBlock( blockNames.paragraph );
		const paragraphBlockElement = await editorPage.getBlockAtPosition(
			blockNames.paragraph
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

		// Copy content to clipboard.
		await longPressMiddleOfElement( editorPage.driver, textViewElement );
		await tapSelectAllAboveElement( editorPage.driver, textViewElement );
		await tapCopyAboveElement( editorPage.driver, textViewElement );

		// Create another paragraph block.
		await editorPage.addNewBlock( blockNames.paragraph );
		if ( isAndroid() ) {
			// On Andrdoid 10 a new auto-suggestion popup is appearing to let the user paste text recently put in the clipboard. Let's dismiss it.
			await editorPage.dismissAndroidClipboardSmartSuggestion();
		}
		const paragraphBlockElement2 = await editorPage.getBlockAtPosition(
			blockNames.paragraph,
			2
		);
		if ( isAndroid() ) {
			await paragraphBlockElement2.click();
		}

		const textViewElement2 = await editorPage.getTextViewForParagraphBlock(
			paragraphBlockElement2
		);

		// Paste into second paragraph block.
		await longPressMiddleOfElement( editorPage.driver, textViewElement2 );
		await tapPasteAboveElement( editorPage.driver, textViewElement2 );

		const text = await editorPage.getTextForParagraphBlockAtPosition( 2 );
		expect( text ).toBe( testData.pastePlainText );

		await editorPage.removeBlockAtPosition( blockNames.paragraph, 2 );
		await editorPage.removeBlockAtPosition( blockNames.paragraph, 1 );
	} );

	it( 'copies styled text from one paragraph block and pastes in another', async () => {
		// Create paragraph block with styled text by editing html.
		await editorPage.setHtmlContent( testData.pasteHtmlText );
		const paragraphBlockElement = await editorPage.getBlockAtPosition(
			blockNames.paragraph
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		const textViewElement = await editorPage.getTextViewForParagraphBlock(
			paragraphBlockElement
		);

		// Copy content to clipboard.
		await longPressMiddleOfElement( editorPage.driver, textViewElement );
		await tapSelectAllAboveElement( editorPage.driver, textViewElement );
		await tapCopyAboveElement( editorPage.driver, textViewElement );

		// Create another paragraph block.
		await editorPage.addNewBlock( blockNames.paragraph );
		if ( isAndroid() ) {
			// On Andrdoid 10 a new auto-suggestion popup is appearing to let the user paste text recently put in the clipboard. Let's dismiss it.
			await editorPage.dismissAndroidClipboardSmartSuggestion();
		}
		const paragraphBlockElement2 = await editorPage.getBlockAtPosition(
			blockNames.paragraph,
			2
		);
		if ( isAndroid() ) {
			await paragraphBlockElement2.click();
		}

		const textViewElement2 = await editorPage.getTextViewForParagraphBlock(
			paragraphBlockElement2
		);

		// Paste into second paragraph block.
		await longPressMiddleOfElement( editorPage.driver, textViewElement2 );
		await tapPasteAboveElement( editorPage.driver, textViewElement2 );

		// Check styled text by verifying html contents.
		const html = await editorPage.getHtmlContent();

		expect( html.toLowerCase() ).toBe(
			testData.pasteHtmlTextResult.toLowerCase()
		);
	} );
} );
