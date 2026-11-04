const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Post Featured Image', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'does not wrap the placeholder in a link when isLink is true', async ( {
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'core/post-featured-image',
			attributes: { isLink: true },
		} );

		const block = editor.canvas.getByRole( 'document', {
			name: 'Block: Featured Image',
		} );
		await expect( block ).toBeVisible();
		await expect( block.getByRole( 'link' ) ).toHaveCount( 0 );
	} );
} );
