/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { isAndroid } from './helpers/utils';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor tests for List block (end)', () => {
	it( 'should be able to end a List block', async () => {
		await editorPage.addNewBlock( blockNames.list );
		const listBlockElement = await editorPage.getBlockAtPosition(
			blockNames.list
		);

		// Click List block on Android to force EditText focus
		if ( isAndroid() ) {
			await listBlockElement.click();
		}

		// Send the first list item text.
		await editorPage.sendTextToListBlock(
			listBlockElement,
			testData.listItem1
		);

		// Send an Enter.
		await editorPage.sendTextToListBlock( listBlockElement, '\n' );

		// Send an Enter.
		await editorPage.sendTextToListBlock( listBlockElement, '\n' );

		const html = await editorPage.getHtmlContent();

		expect( html.toLowerCase() ).toBe(
			testData.listEndedHtml.toLowerCase()
		);
	} );
} );
