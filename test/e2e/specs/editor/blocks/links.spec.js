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

		// Ensure that the contents of the post have not been changed, since at
		// this point the link is still not inserted.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'This is Gutenberg' },
			},
		] );

		await page.keyboard.press( 'Enter' );

		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );

		// Edit link.
		await page.getByRole( 'button', { name: 'Edit' } ).click();

		// Open settings.
		await page
			.getByRole( 'region', {
				name: 'Editor content',
			} )
			.getByRole( 'button', {
				name: 'Advanced',
			} )
			.click();

		// Navigate to and toggle the "Open in new tab" checkbox.
		const checkbox = page.getByLabel( 'Open in new tab' );
		await checkbox.click();

		// Toggle should still have focus and be checked.
		await expect( checkbox ).toBeChecked();
		await expect( checkbox ).toBeFocused();

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

	test( 'can update the url of an existing link', async ( {
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

		await page.keyboard.press( 'Enter' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'This is <a href="http://w.org">WordPress</a>',
				},
			},
		] );

		// Move caret back into the link.
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );

		// Edit link.
		await pageUtils.pressKeys( 'primary+k' );
		await page.getByPlaceholder( 'Search or type url' ).fill( '' );
		await page.keyboard.type( 'wordpress.org' );

		// Update the link.
		await page
			//TODO: change to a better selector when https://github.com/WordPress/gutenberg/issues/51060 is resolved.
			.locator( '.block-editor-link-control' )
			.getByRole( 'button', { name: 'Save' } )
			.click();

		// Navigate back to the popover.
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );

		// Navigate back to inputs to verify appears as changed.
		await pageUtils.pressKeys( 'primary+k' );
		const urlInputValue = await page
			.getByPlaceholder( 'Search or type url' )
			.inputValue();
		expect( urlInputValue ).toContain( 'wordpress.org' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content:
						'This is <a href="http://wordpress.org">WordPress</a>',
				},
			},
		] );
	} );

	test.only( 'toggle state of advanced link settings is preserved across editing links', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		// Create a block with some text.
		await editor.insertBlock( {
			name: 'core/paragraph',
		} );
		await page.keyboard.type( 'This is Gutenberg WordPress' );

		// Select "WordPress".
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );

		// Create a link.
		await pageUtils.pressKeys( 'primary+k' );
		await page.keyboard.type( 'w.org' );
		await page.keyboard.press( 'Enter' );

		// Move to edge of text "Gutenberg".
		await pageUtils.pressKeys( 'Alt+ArrowLeft' );
		await pageUtils.pressKeys( 'ArrowLeft' );

		// Select "Gutenberg".
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );

		// Create a link.
		await pageUtils.pressKeys( 'primary+k' );
		await page.keyboard.type( 'https://wordpress.org/plugins/gutenberg/' );
		await page.keyboard.press( 'Enter' );

		// Move caret back into the link.
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );

		// Click Edit to move back into editing mode
		await page.getByRole( 'button', { name: 'Edit' } ).click();

		// Toggle the Advanced settings to be open.
		// This should set the editor preference to persist this
		// UI state.
		await page
			.getByRole( 'region', {
				name: 'Editor content',
			} )
			.getByRole( 'button', {
				name: 'Advanced',
			} )
			.click();

		// Move focus out of Link UI and into Paragraph block.
		await pageUtils.pressKeys( 'Escape' );

		// Move caret back into the "WordPress" link to trigger
		// the Link UI for that link.
		await pageUtils.pressKeys( 'Alt+ArrowRight' );
		await pageUtils.pressKeys( 'ArrowRight' );
		await pageUtils.pressKeys( 'ArrowRight' );

		// Switch Link UI to "edit" mode.
		await page.getByRole( 'button', { name: 'Edit' } ).click();

		// Check that the Advanced settings are still expanded/open
		// and I can see the open in new tab checkbox. This verifies
		// that the editor preference was persisted.
		await expect( page.getByLabel( 'Open in new tab' ) ).toBeVisible();

		// Toggle the Advanced settings back to being closed.
		await page
			.getByRole( 'region', {
				name: 'Editor content',
			} )
			.getByRole( 'button', {
				name: 'Advanced',
			} )
			.click();

		// Move focus out of Link UI and into Paragraph block.
		await pageUtils.pressKeys( 'Escape' );

		// Move caret back into the "Gutenberg" link to trigger
		// the Link UI for that link.
		await pageUtils.pressKeys( 'ArrowLeft' );
		await pageUtils.pressKeys( 'ArrowLeft' );
		await pageUtils.pressKeys( 'ArrowLeft' );

		// Switch Link UI to "Edit" mode.
		await page.getByRole( 'button', { name: 'Edit' } ).click();

		// Check that the Advanced settings are still closed.
		// This verifies that the editor preference was persisted.
		await expect( page.getByLabel( 'Open in new tab' ) ).not.toBeVisible();
	} );
} );
