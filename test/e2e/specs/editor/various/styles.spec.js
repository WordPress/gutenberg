/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Styles', () => {
	test( 'should override reset styles', async ( { admin, editor } ) => {
		await admin.createNewPost( { postType: 'page' } );
		await editor.insertBlock( { name: 'core/social-links' } );

		const block = editor.canvas.getByRole( 'document', {
			name: 'Block: Social Icons',
		} );

		await expect( block ).toHaveCSS( 'padding-left', '0px' );
	} );
} );
