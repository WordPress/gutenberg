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
		const paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			testData.pastePlainText
		);

		// Copy content to clipboard.
		await longPressMiddleOfElement(
			editorPage.driver,
			paragraphBlockElement
		);
		await tapSelectAllAboveElement(
			editorPage.driver,
			paragraphBlockElement
		);
		await tapCopyAboveElement( editorPage.driver, paragraphBlockElement );

		// Create another paragraph block.
		await editorPage.addNewBlock( blockNames.paragraph );
		if ( isAndroid() ) {
			// On Andrdoid 10 a new auto-suggestion popup is appearing to let the user paste text recently put in the clipboard. Let's dismiss it.
			await editorPage.dismissAndroidClipboardSmartSuggestion();
		}
		const paragraphBlockElement2 = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph,
			2
		);
		if ( isAndroid() ) {
			await paragraphBlockElement2.click();
		}

		// Paste into second paragraph block.
		await longPressMiddleOfElement(
			editorPage.driver,
			paragraphBlockElement2
		);
		await tapPasteAboveElement( editorPage.driver, paragraphBlockElement2 );

		const text = await editorPage.getTextForParagraphBlockAtPosition( 2 );
		expect( text ).toBe( testData.pastePlainText );

		await editorPage.removeBlockAtPosition( blockNames.paragraph, 2 );
		await editorPage.removeBlockAtPosition( blockNames.paragraph, 1 );
	} );

	it( 'copies styled text from one paragraph block and pastes in another', async () => {
		// Create paragraph block with styled text by editing html.
		await editorPage.setHtmlContent( testData.pasteHtmlText );
		const paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		// Copy content to clipboard.
		await longPressMiddleOfElement(
			editorPage.driver,
			paragraphBlockElement
		);
		await tapSelectAllAboveElement(
			editorPage.driver,
			paragraphBlockElement
		);
		await tapCopyAboveElement( editorPage.driver, paragraphBlockElement );

		// Create another paragraph block.
		await editorPage.addNewBlock( blockNames.paragraph );
		if ( isAndroid() ) {
			// On Andrdoid 10 a new auto-suggestion popup is appearing to let the user paste text recently put in the clipboard. Let's dismiss it.
			await editorPage.dismissAndroidClipboardSmartSuggestion();
		}
		const paragraphBlockElement2 = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph,
			2
		);
		if ( isAndroid() ) {
			await paragraphBlockElement2.click();
		}

		// Paste into second paragraph block.
		await longPressMiddleOfElement(
			editorPage.driver,
			paragraphBlockElement2
		);
		await tapPasteAboveElement( editorPage.driver, paragraphBlockElement2 );

		// Check styled text by verifying html contents.
		const html = await editorPage.getHtmlContent();

		expect( html.toLowerCase() ).toBe(
			testData.pasteHtmlTextResult.toLowerCase()
		);
	} );
} );
