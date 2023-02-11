/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { isAndroid } from './helpers/utils';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor tests for Block insertion', () => {
	it( 'should be able to insert multi-paragraph text, and text to another paragraph block in between', async () => {
		await editorPage.addNewBlock( blockNames.paragraph );
		let paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.sendTextToParagraphBlock( 1, testData.longText );
		// Should have 3 paragraph blocks at this point.

		paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph,
			2
		);
		await paragraphBlockElement.click();

		await editorPage.addNewBlock( blockNames.paragraph );

		paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph,
			3
		);
		await paragraphBlockElement.click();
		await editorPage.sendTextToParagraphBlock( 3, testData.mediumText );

		const html = await editorPage.getHtmlContent();

		expect( html.toLowerCase() ).toBe(
			testData.blockInsertionHtml.toLowerCase()
		);

		for ( let i = 4; i > 0; i-- ) {
			paragraphBlockElement = await editorPage.getTextBlockAtPosition(
				blockNames.paragraph
			);
			await paragraphBlockElement.click();
			await editorPage.removeBlock();
		}
	} );

	it( 'should be able to insert block at the beginning of post from the title', async () => {
		await editorPage.addNewBlock( blockNames.paragraph );
		const paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.sendTextToParagraphBlock( 1, testData.longText );
		// Should have 3 paragraph blocks at this point.

		if ( isAndroid() ) {
			await editorPage.dismissKeyboard();
		}

		const titleElement = await editorPage.getTitleElement( {
			autoscroll: true,
		} );
		await titleElement.click();

		await editorPage.addNewBlock( blockNames.paragraph );
		const emptyParagraphBlock = await editorPage.getBlockAtPosition(
			blockNames.paragraph
		);
		expect( emptyParagraphBlock ).toBeTruthy();
		const emptyParagraphBlockElement =
			await editorPage.getTextBlockAtPosition( blockNames.paragraph );
		expect( emptyParagraphBlockElement ).toBeTruthy();

		await editorPage.sendTextToParagraphBlock( 1, testData.mediumText );
		const html = await editorPage.getHtmlContent();
		expect( html.toLowerCase() ).toBe(
			testData.blockInsertionHtmlFromTitle.toLowerCase()
		);
	} );
} );
