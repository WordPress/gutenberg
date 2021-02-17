/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { isAndroid, toggleOrientation } from './helpers/utils';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor tests', () => {
	it( 'should be able to add blocks , rotate device and continue adding blocks', async () => {
		await editorPage.addNewBlock( blockNames.paragraph );
		let paragraphBlockElement = await editorPage.getBlockAtPosition(
			blockNames.paragraph
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			testData.mediumText
		);

		await toggleOrientation( editorPage.driver );
		// On Android the keyboard hides the add block button, let's hide it after rotation
		if ( isAndroid() ) {
			await editorPage.driver.hideDeviceKeyboard();
		}

		await editorPage.addNewBlock( blockNames.paragraph );

		if ( isAndroid() ) {
			await editorPage.driver.hideDeviceKeyboard();
		}

		paragraphBlockElement = await editorPage.getBlockAtPosition(
			blockNames.paragraph,
			2
		);
		while ( ! paragraphBlockElement ) {
			await editorPage.driver.hideDeviceKeyboard();
			paragraphBlockElement = await editorPage.getBlockAtPosition(
				blockNames.paragraph,
				2
			);
		}
		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			testData.mediumText
		);
		await toggleOrientation( editorPage.driver );

		const html = await editorPage.getHtmlContent();

		expect( html.toLowerCase() ).toBe(
			testData.deviceRotationHtml.toLowerCase()
		);
	} );
} );
