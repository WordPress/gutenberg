/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Preformatted', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should preserve character newlines', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/html' } );
		await page.keyboard.type( '<pre>1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2</pre>' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		await editor.clickBlockOptionsMenuItem( 'Convert to Blocks' );
		// Once it's edited, it should be saved as BR tags.
		await page.keyboard.type( '0' );
		await page.keyboard.press( 'Enter' );
		await editor.clickBlockOptionsMenuItem( 'Edit as HTML' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should preserve white space when merging', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/preformatted' } );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( '3' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Backspace' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should delete block when backspace in an empty preformatted', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/preformatted' } );

		await page.keyboard.type( 'a' );

		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );

		// Expect preformatted block to be deleted.
		expect( await editor.getEditedPostContent() ).toBe( '' );
	} );
} );
