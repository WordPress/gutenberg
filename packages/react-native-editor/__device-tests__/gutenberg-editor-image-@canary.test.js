/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { isAndroid, clickMiddleOfElement, swipeUp } from './helpers/utils';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor Image Block tests', () => {
	it( 'should be able to add an image block', async () => {
		await editorPage.addNewBlock( blockNames.image );
		await editorPage.driver.sleep( 1000 );
		await editorPage.closePicker();

		let imageBlock = await editorPage.getBlockAtPosition(
			blockNames.image
		);

		// Can only add image from media library on iOS
		if ( ! isAndroid() ) {
			await editorPage.selectEmptyImageBlock( imageBlock );
			await editorPage.chooseMediaLibrary();

			// Workaround because of #952.
			const titleElement = await editorPage.getTitleElement();
			await clickMiddleOfElement( editorPage.driver, titleElement );
			await editorPage.dismissKeyboard();
			// End workaround.

			imageBlock = await editorPage.getBlockAtPosition( imageBlock );
			await swipeUp( editorPage.driver, imageBlock );
			await editorPage.enterCaptionToSelectedImageBlock(
				testData.imageCaption,
				true
			);
			await editorPage.dismissKeyboard();
		}
		await editorPage.addNewBlock( blockNames.paragraph );
		const paragraphBlockElement = await editorPage.getBlockAtPosition(
			blockNames.paragraph,
			2
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.sendTextToParagraphBlock( 2, testData.shortText );

		// skip HTML check for Android since we couldn't add image from media library
		/* eslint-disable jest/no-conditional-expect */
		if ( ! isAndroid() ) {
			const html = await editorPage.getHtmlContent();

			expect( html.toLowerCase() ).toBe(
				testData.imageShorteHtml.toLowerCase()
			);
		}
		/* eslint-enable jest/no-conditional-expect */
	} );
} );
