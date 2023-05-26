/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Links', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( `can be created by selecting text and using keyboard shortcuts`, async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		// Create a block with some text.
		await editor.insertBlock( {
			name: 'core/paragraph',
		} );
		await page.keyboard.type( 'This is Gutenberg' );

		// Select some text.
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );

		// Press Cmd+K to insert a link.
		await pageUtils.pressKeys( 'primary+K' );

		// Type a URL.
		await page.keyboard.type( 'https://wordpress.org/gutenberg' );

		// Open settings.
		await page.getByRole( 'button', { name: 'Link Settings' } ).click();

		// Navigate to and toggle the "Open in new tab" checkbox.
		const checkbox = page.getByLabel( 'Open in new tab' );
		await checkbox.click();

		// Toggle should still have focus and be checked.
		await expect( checkbox ).toBeChecked();
		await expect( checkbox ).toBeFocused();

		// Ensure that the contents of the post have not been changed, since at
		// this point the link is still not inserted.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		// Tab back to the Submit and apply the link.
		await page.getByRole( 'button', { name: 'Apply' } ).click();

		// The link should have been inserted.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );
} );
