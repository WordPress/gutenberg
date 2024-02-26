/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'block mover', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should show block mover when more than one block exists', async ( {
		editor,
		page,
	} ) => {
		// Create a two blocks on the page.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First Paragraph' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second Paragraph' },
		} );

		// Select a block so the block mover is rendered.
		await editor.canvas.locator( 'text=First Paragraph' ).focus();
		await editor.showBlockToolbar();

		const moveDownButton = page.locator(
			'role=toolbar[name="Block tools"i] >> role=button[name="Move down"i]'
		);
		const moveUpButton = page.locator(
			'role=toolbar[name="Block tools"i] >> role=button[name="Move up"i]'
		);
		await expect( moveDownButton ).toBeVisible();
		await expect( moveUpButton ).toBeVisible();
	} );

	test( 'should hide block mover when only one block exists', async ( {
		editor,
		page,
	} ) => {
		// Create a single block on the page.

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First Paragraph' },
		} );
		// Select a block so the block mover has the possibility of being rendered.
		await editor.canvas.locator( 'text=First Paragraph' ).focus();
		await editor.showBlockToolbar();

		// Ensure no block mover exists when only one block exists on the page.
		const moveDownButton = page.locator(
			'role=toolbar[name="Block tools"i] >> role=button[name="Move down"i]'
		);
		const moveUpButton = page.locator(
			'role=toolbar[name="Block tools"i] >> role=button[name="Move up"i]'
		);
		await expect( moveDownButton ).toBeHidden();
		await expect( moveUpButton ).toBeHidden();
	} );
} );
