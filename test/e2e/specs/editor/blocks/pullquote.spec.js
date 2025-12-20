/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Pullquote', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be converted to a Quote block', async ( { editor, page } ) => {
		// Insert a Pullquote block.
		await editor.insertBlock( { name: 'core/pullquote' } );

		// Add multiple lines of text.
		await page.keyboard.type( 'First line.' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second line.' );

		// Add a citation.
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.type( 'Awesome Citation' );

		await editor.transformBlockTo( 'core/quote' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );
} );
