/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { isAndroid, clickMiddleOfElement, swipeUp } from './helpers/utils';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor Image Block tests', () => {
	it( 'should be able to add an image block', async () => {
		// iOS only test - Can only add image from media library on iOS
		if ( ! isAndroid() ) {
			await editorPage.addNewBlock( blockNames.image );
			await editorPage.closePicker();

			const imageBlock = await editorPage.getBlockAtPosition(
				blockNames.image
			);

			await editorPage.selectEmptyImageBlock( imageBlock );
			await editorPage.chooseMediaLibrary();

			// Workaround because of #952.
			const titleElement = await editorPage.getTitleElement();
			await clickMiddleOfElement( editorPage.driver, titleElement );
			await editorPage.dismissKeyboard();
			// End workaround.

			await swipeUp( editorPage.driver, imageBlock );
			await editorPage.enterCaptionToSelectedImageBlock(
				testData.imageCaption,
				true
			);
			await editorPage.dismissKeyboard();

			await editorPage.addNewBlock( blockNames.paragraph );
			await editorPage.sendTextToParagraphBlock( 2, testData.shortText );
			const html = await editorPage.getHtmlContent();

			expect( html.toLowerCase() ).toBe(
				testData.imageShorteHtml.toLowerCase()
			);
		}
	} );
} );
