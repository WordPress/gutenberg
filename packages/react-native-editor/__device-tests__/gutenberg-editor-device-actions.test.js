/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { toggleOrientation, isAndroid } from './helpers/utils';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor Rotation tests', () => {
	it( 'should be able to add blocks , rotate device and continue adding blocks', async () => {
		await editorPage.initializeEditor();
		await editorPage.addNewBlock( blockNames.paragraph );
		let paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph
		);

		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			testData.mediumText
		);

		await toggleOrientation( editorPage.driver );
		// On Android the keyboard hides the add block button, let's hide it after rotation
		if ( isAndroid() ) {
			await editorPage.dismissKeyboard();
		}

		await editorPage.addNewBlock( blockNames.paragraph );

		if ( isAndroid() ) {
			// Waits until the keyboard is visible
			await editorPage.driver.waitUntil(
				editorPage.driver.isKeyboardShown
			);
			await editorPage.dismissKeyboard();
		}

		paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph,
			2
		);

		await editorPage.typeTextToTextBlock(
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
