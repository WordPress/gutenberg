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
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'This is Gutenberg' },
			},
		] );

		// Tab back to the Submit and apply the link.
		await page
			//TODO: change to a better selector when https://github.com/WordPress/gutenberg/issues/51060 is resolved.
			.locator( '.block-editor-link-control' )
			.getByRole( 'button', { name: 'Save' } )
			.click();

		// The link should have been inserted.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content:
						'This is <a href="https://wordpress.org/gutenberg" target="_blank" rel="noreferrer noopener">Gutenberg</a>',
				},
			},
		] );
	} );

	test( 'should contain a label when it should open in a new tab', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		// Create a block with some text.
		await editor.insertBlock( {
			name: 'core/paragraph',
		} );
		await page.keyboard.type( 'This is WordPress' );
		// Select "WordPress".
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );
		await pageUtils.pressKeys( 'primary+k' );
		await page.keyboard.type( 'w.org' );

		// Link settings open
		await page.getByRole( 'button', { name: 'Link Settings' } ).click();

		// Navigate to and toggle the "Open in new tab" checkbox.
		const checkbox = page.getByLabel( 'Open in new tab' );
		await checkbox.click();

		// Confirm that focus was not prematurely returned to the paragraph on
		// a changing value of the setting.
		await expect( checkbox ).toBeFocused();

		// Submit link. Expect that "Open in new tab" would have been applied
		// immediately.
		await page.getByRole( 'button', { name: 'Apply' } ).click();

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		// Regression Test: This verifies that the UI is updated according to
		// the expected changed values, where previously the value could have
		// fallen out of sync with how the UI is displayed (specifically for
		// collapsed selections).
		//
		// See: https://github.com/WordPress/gutenberg/pull/15573

		// Move caret back into the link.
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );

		// Edit link.
		await pageUtils.pressKeys( 'primary+k' );
		await pageUtils.pressKeys( 'primary+a' );
		await page.keyboard.type( 'wordpress.org' );

		// Update the link.
		await page.keyboard.press( 'Enter' );

		// Navigate back to the popover.
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );

		// Navigate back to inputs to verify appears as changed.
		await pageUtils.pressKeys( 'primary+k' );

		// Navigate to the "Open in new tab" checkbox.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		// Uncheck the checkbox.
		await page.keyboard.press( 'Space' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );
} );
