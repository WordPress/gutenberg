/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Post Title block', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'Can edit the post title', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/post-title' } );

		// Add the post title
		await editor.canvas
			.getByRole( 'textbox', {
				name: 'Add title',
			} )
			.fill( 'Just tweaking the post title' );

		// Save the post draft and reload.
		await editor.saveDraft();
		await page.reload();

		const titleBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Title',
		} );
		await expect( titleBlock ).toBeVisible();
		await expect( titleBlock ).toHaveText( 'Just tweaking the post title' );
	} );

	test( 'should not insert a block on Enter at the end of the title in a locked template', async ( {
		editor,
		page,
	} ) => {
		// A parent with `templateLock` makes the editor pass an undefined
		// `insertBlocksAfter` prop to the inner blocks.
		await editor.insertBlock( {
			name: 'core/group',
			attributes: { templateLock: 'all' },
			innerBlocks: [ { name: 'core/post-title' } ],
		} );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Title' } )
			.click();
		await page.keyboard.type( 'Hello' );
		await page.keyboard.press( 'Enter' );

		// No block should have been inserted after the title.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/group',
				innerBlocks: [ { name: 'core/post-title' } ],
			},
		] );
	} );
} );
