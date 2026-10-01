const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Post Featured Image', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'opens the media library when isLink is true and no featured image is set', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/post-featured-image',
			attributes: { isLink: true },
		} );

		const block = editor.canvas.getByRole( 'document', {
			name: 'Block: Featured Image',
		} );
		await expect( block ).toBeVisible();

		await block
			.getByRole( 'button', { name: 'Add a featured image' } )
			.click();

		await expect( page.locator( '.media-modal' ) ).toBeVisible();
		await expect( block ).toBeVisible();
	} );
} );
