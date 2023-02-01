/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { isAndroid, clickMiddleOfElement } from './helpers/utils';
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

		// Workaround for now since deleting the first element causes a crash on CI for Android
		if ( isAndroid() ) {
			paragraphBlockElement = await editorPage.getTextBlockAtPosition(
				blockNames.paragraph,
				3,
				{
					autoscroll: true,
				}
			);

			await paragraphBlockElement.click();
			await editorPage.removeBlockAtPosition( blockNames.paragraph, 3 );
			for ( let i = 3; i > 0; i-- ) {
				paragraphBlockElement = await editorPage.getTextBlockAtPosition(
					blockNames.paragraph,
					i,
					{
						autoscroll: true,
					}
				);
				await paragraphBlockElement.click();
				await editorPage.removeBlockAtPosition(
					blockNames.paragraph,
					i
				);
			}
		} else {
			for ( let i = 4; i > 0; i-- ) {
				paragraphBlockElement = await editorPage.getTextBlockAtPosition(
					blockNames.paragraph
				);
				await clickMiddleOfElement(
					editorPage.driver,
					paragraphBlockElement
				);
				await editorPage.removeBlockAtPosition( blockNames.paragraph );
			}
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
		expect( titleElement ).toBeTruthy();
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
