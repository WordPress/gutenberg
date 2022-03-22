/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { backspace, isAndroid } from './helpers/utils';

describe( 'Gutenberg Editor tests for List block', () => {
	// Prevent regression of https://github.com/wordpress-mobile/gutenberg-mobile/issues/871
	it( 'should handle spaces in a list', async () => {
		await editorPage.addNewBlock( blockNames.list );
		let listBlockElement = await editorPage.getBlockAtPosition(
			blockNames.list
		);
		// Click List block on Android to force EditText focus
		if ( isAndroid() ) {
			await listBlockElement.click();
		}

		// Send the list item text.
		await editorPage.sendTextToListBlock( listBlockElement, '  a' );

		// Send an Enter.
		await editorPage.sendTextToListBlock( listBlockElement, '\n' );

		// Send a backspace.
		await editorPage.sendTextToListBlock( listBlockElement, backspace );

		// Switch to html and verify html.
		const html = await editorPage.getHtmlContent();

		expect( html.toLowerCase() ).toBe(
			`<!-- wp:list -->
<ul><li>  a</li></ul>
<!-- /wp:list -->`
		);

		// Remove list block to reset editor to clean state.
		listBlockElement = await editorPage.getBlockAtPosition(
			blockNames.list
		);
		await listBlockElement.click();
		await editorPage.removeBlockAtPosition( blockNames.list );
	} );
} );
