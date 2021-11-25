/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { isAndroid } from './helpers/utils';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor tests for List block', () => {
	it( 'should be able to add a new List block', async () => {
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

		// Send the second list item text.
		await editorPage.sendTextToListBlock(
			listBlockElement,
			testData.listItem2
		);

		// Switch to html and verify html.
		const html = await editorPage.getHtmlContent();
		expect( html.toLowerCase() ).toBe( testData.listHtml.toLowerCase() );
	} );

	// This test depends on being run immediately after 'should be able to add a new List block'
	it( 'should update format to ordered list, using toolbar button', async () => {
		let listBlockElement = await editorPage.getBlockAtPosition(
			blockNames.list
		);

		// Click List block to force EditText focus.
		await listBlockElement.click();

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
