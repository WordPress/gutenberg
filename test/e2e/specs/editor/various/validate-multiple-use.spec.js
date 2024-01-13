/**
 * WordPress dependencies
 */

const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function showBlockMenuItems( { editor, page } ) {
	await editor.showBlockToolbar();
	await page
		.getByRole( 'toolbar', { name: 'Block tools' } )
		.getByRole( 'button', { name: 'Options' } )
		.click();
}

test.describe( 'Validate multiple use', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should display correct amount of warning message', async ( {
		editor,
		page,
	} ) => {
		// Insert a block with `multiple` feature enabled, such as `core/more`
		await editor.insertBlock( {
			name: 'core/more',
		} );

		// Group the block
		await showBlockMenuItems( { editor, page } );
		await page.getByRole( 'menuitem', { name: 'Group' } ).click();

		// Duplicate the block
		await showBlockMenuItems( { editor, page } );
		await page.getByRole( 'menuitem', { name: 'Duplicate' } ).click();

		// Check if warnings is visible
		await expect(
			editor.canvas.getByRole( 'button', {
				name: 'Find original',
			} )
		).toBeVisible();
	} );
} );
