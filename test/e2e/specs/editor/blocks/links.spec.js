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
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Space' );

		// Navigate to and toggle the "Open in new tab" checkbox.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Space' );

		// Toggle should still have focus and be checked.
		const checkbox = page.getByLabel( 'Open in new tab' );
		await expect( checkbox ).toBeChecked();
		await expect( checkbox ).toBeFocused();

		// Ensure that the contents of the post have not been changed, since at
		// this point the link is still not inserted.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		// Tab back to the Submit and apply the link.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );

		// The link should have been inserted.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test.describe( 'should contain a label when it should open in a new tab', () => {} );
} );
