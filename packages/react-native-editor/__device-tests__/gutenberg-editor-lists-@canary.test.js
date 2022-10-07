/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { isAndroid } from './helpers/utils';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor tests for List block', () => {
	it.skip( 'should be able to add a new List block', async () => {
		await editorPage.addNewBlock( blockNames.list );
		let listBlockElement = await editorPage.getListBlockAtPosition( 1, {
			isEmptyBlock: true,
		} );

		await editorPage.typeTextToTextBlock(
			listBlockElement,
			testData.listItem1,
			false
		);

		listBlockElement = await editorPage.getListBlockAtPosition();

		// Send an Enter.
		await editorPage.typeTextToTextBlock( listBlockElement, '\n', false );

		// Send the second list item text.
		await editorPage.typeTextToTextBlock(
			listBlockElement,
			testData.listItem2,
			false
		);

		// Switch to html and verify html.
		const html = await editorPage.getHtmlContent();
		expect( html.toLowerCase() ).toBe( testData.listHtml.toLowerCase() );
	} );

	// This test depends on being run immediately after 'should be able to add a new List block'
	it.skip( 'should update format to ordered list, using toolbar button', async () => {
		let listBlockElement = await editorPage.getListBlockAtPosition();

		if ( isAndroid() ) {
			await listBlockElement.click();
		}

		// Send a click on the order list format button.
		await editorPage.clickOrderedListToolBarButton();

		// Switch to html and verify html.
		const html = await editorPage.getHtmlContent();
		expect( html.toLowerCase() ).toBe(
			testData.listHtmlOrdered.toLowerCase()
		);
		// Remove list block to return editor to empty state.
		listBlockElement = await editorPage.getBlockAtPosition(
			blockNames.list
		);
		await listBlockElement.click();
		await editorPage.removeBlockAtPosition( blockNames.list );
	} );
} );
