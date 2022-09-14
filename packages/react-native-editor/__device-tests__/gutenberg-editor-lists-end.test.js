/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor tests for List block (end)', () => {
	it.skip( 'should be able to end a List block', async () => {
		await editorPage.addNewBlock( blockNames.list );
		const listBlockElement = await editorPage.getListBlockAtPosition();

		await editorPage.typeTextToTextBlock(
			listBlockElement,
			testData.listItem1,
			false
		);

		// Send an Enter.
		await editorPage.typeTextToTextBlock( listBlockElement, '\n\n', false );

		const html = await editorPage.getHtmlContent();

		expect( html.toLowerCase() ).toBe(
			testData.listEndedHtml.toLowerCase()
		);
	} );
} );
