/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { backspace, isAndroid } from './helpers/utils';

describe( 'Gutenberg Editor tests for List block', () => {
	// Prevent regression of https://github.com/wordpress-mobile/gutenberg-mobile/issues/871
	it( 'should handle spaces in a list', async () => {
		await editorPage.addNewBlock( blockNames.list );
		let listBlockElement = await editorPage.getListBlock();

		// Send the list item text.
		await editorPage.typeTextToTextBlock( listBlockElement, '  a', false );

		// Send an Enter.
		await editorPage.typeTextToTextBlock( listBlockElement, '\n', false );

		// Click List block on Android.
		if ( isAndroid() ) {
			await listBlockElement.click();
		}

		// Send a backspace.
		await editorPage.typeTextToTextBlock(
			listBlockElement,
			backspace,
			false
		);

		// Wait for backspace click to be reflected before checking HTML
		listBlockElement = await editorPage.getListBlock();

		// Switch to html and verify html.
		const html = await editorPage.getHtmlContent();

		expect( html.toLowerCase() ).toBe(
			`<!-- wp:list -->
<ul><li>  a</li></ul>
<!-- /wp:list -->`
		);

		// Remove list block to reset editor to clean state.
		listBlockElement = await editorPage.getListBlock();
		await listBlockElement.click();
		await editorPage.removeBlockAtPosition( blockNames.list );
	} );
} );
