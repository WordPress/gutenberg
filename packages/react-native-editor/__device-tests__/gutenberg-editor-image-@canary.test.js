/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { isAndroid } from './helpers/utils';
import testData from './helpers/test-data';

const onlyOniOS = ! isAndroid() ? describe : describe.skip;

// iOS only test - Can only add image from media library on iOS.
onlyOniOS( 'Gutenberg Editor Image Block tests', () => {
	it( 'should be able to add an image block', async () => {
		await editorPage.addNewBlock( blockNames.image );
		await editorPage.closePicker();

		const imageBlock = await editorPage.getBlockAtPosition(
			blockNames.image
		);

		await editorPage.selectEmptyImageBlock( imageBlock );
		await editorPage.chooseMediaLibrary();

		await editorPage.waitForElementToBeDisplayedById(
			'A snow-capped mountain top in a cloudy sky with red-leafed trees in the foreground',
			2000
		);
		await editorPage.enterCaptionToSelectedImageBlock(
			testData.imageCaption,
			true
		);

		const html = await editorPage.getHtmlContent();

		expect( html.toLowerCase() ).toBe(
			testData.imageShortHtml.toLowerCase()
		);
	} );
} );
