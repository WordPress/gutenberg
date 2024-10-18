/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Links', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test.use( {
		LinkUtils: async ( { editor, page, pageUtils }, use ) => {
			await use( new LinkUtils( { editor, page, pageUtils } ) );
		},
	} );

	test( `will use Post title as link text if link to existing post is created without any text selected`, async ( {
		admin,
		page,
		editor,
		requestUtils,
	} ) => {
		const titleText = 'Post to create a link to';
		const { id: postId } = await requestUtils.createPost( {
			title: titleText,
			status: 'publish',
		} );

		await admin.createNewPost();

		// Now in a new post and try to create a link from an autocomplete suggestion using the keyboard.
		await editor.insertBlock( {
			name: 'core/paragraph',
		} );
		await page.keyboard.type( 'Here comes a link: ' );

		// Insert a link deliberately not selecting any text.
		await editor.clickBlockToolbarButton( 'Link' );

		// Trigger the autocomplete suggestion list and select the first suggestion.
		await page.keyboard.type( 'Post to create a' );
		await page.getByRole( 'option', { name: titleText } ).click();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content:
						'Here comes a link: <a href="http://localhost:8889/?p=' +
						postId +
						'" data-type="post" data-id="' +
						postId +
						'">' +
						titleText +
						'</a>',
				},
			},
		] );
	} );

	test( `can be created by selecting text and clicking link insertion button in block toolbar`, async ( {
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

		// Click on the Link button in the Block Toolbar.
		await editor.clickBlockToolbarButton( 'Link' );

		// Type a URL.
		await page.keyboard.type( 'https://wordpress.org/gutenberg' );

		// Submit the link.
		await pageUtils.pressKeys( 'Enter' );

		// The link should have been inserted.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content:
						'This is <a href="https://wordpress.org/gutenberg">Gutenberg</a>',
				},
			},
		] );
	} );

	test( `will not automatically create a link if selected text is not a valid HTTP based URL`, async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		// Create a block with some text.
		await editor.insertBlock( {
			name: 'core/paragraph',
		} );
		await page.keyboard.type( 'This: is not a link' );

		// Select some text.
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );

		// Click on the Link button.
		await editor.clickBlockToolbarButton( 'Link' );

		await expect(
			page.getByRole( 'combobox', {
				name: 'Search or type URL',
			} )
		).toHaveValue( '' );
	} );

	test( `will automatically create a link if selected text is a valid HTTP based URL`, async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		// Create a block with some text.
		await editor.insertBlock( {
			name: 'core/paragraph',
		} );
		await page.keyboard.type(
			'This is Gutenberg: https://wordpress.org/gutenberg'
		);

		// Select the URL.
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft', { times: 7 } );

		// Click on the Link button.
		await editor.clickBlockToolbarButton( 'Link' );

		// A link with the selected URL as its href should have been inserted.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content:
						'This is Gutenberg: <a href="https://wordpress.org/gutenberg">https://wordpress.org/gutenberg</a>',
				},
			},
		] );
	} );

	test( `does not create link when link ui is closed without submission`, async ( {
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

		// Click on the Link button.
		await editor.clickBlockToolbarButton( 'Link' );

		// Type a URL.
		await page.keyboard.type( 'https://wordpress.org/gutenberg' );

		// Click somewhere else - it doesn't really matter where.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.focus();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'This is Gutenberg',
				},
			},
		] );
	} );

	test( `can edit existing links`, async ( {
		page,
		editor,
		pageUtils,
		LinkUtils,
	} ) => {
		await LinkUtils.createLink();

		// Click on the Edit button.
		await page
			.getByRole( 'button', { name: 'Edit link', exact: true } )
			.click();

		// Change the URL.
		// getByPlaceholder required in order to handle Link Control component
		// managing focus onto other inputs within the control.
		await page.getByPlaceholder( 'Search or type URL' ).fill( '' );
		await page.keyboard.type( '/handbook' );

		// Submit the link.
		await pageUtils.pressKeys( 'Enter' );

		// The link should have been updated.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'This is <a href="/handbook">Gutenberg</a>',
				},
			},
		] );
	} );

	test( `can remove existing links`, async ( { editor, LinkUtils } ) => {
		await LinkUtils.createLink();

		const linkPopover = LinkUtils.getLinkPopover();

		await linkPopover
			.getByRole( 'button', { name: 'Remove link' } )
			.click();

		// The link should have been removed.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'This is Gutenberg',
				},
			},
		] );
	} );

	test( `allows arrow keys to be pressed during link creation when the toolbar is fixed to top`, async ( {
		page,
		editor,
		pageUtils,
		LinkUtils,
	} ) => {
		await LinkUtils.toggleFixedToolbar( true );

		// Create a block with some text.
		await editor.insertBlock( {
			name: 'core/paragraph',
		} );
		await page.keyboard.type( 'Text' );
		await editor.clickBlockToolbarButton( 'Link' );

		const linkPopover = LinkUtils.getLinkPopover();
		await expect( linkPopover ).toBeVisible();

		// Pressing "left" should not close the dialog.
		await pageUtils.pressKeys( 'ArrowLeft' );
		await expect( linkPopover ).toBeVisible();

		// Escape should close the dialog.
		await page.keyboard.press( 'Escape' );

		await expect( linkPopover ).toBeHidden();
	} );

	test( `allows arrow keys to be pressed during link creation in "Docked Toolbar" mode`, async ( {
		page,
		editor,
		pageUtils,
		LinkUtils,
	} ) => {
		await LinkUtils.toggleFixedToolbar( false );

		// Create a block with some text.
		await editor.insertBlock( {
			name: 'core/paragraph',
		} );
		await page.keyboard.type( 'Text' );

		await editor.clickBlockToolbarButton( 'Link' );

		const linkPopover = LinkUtils.getLinkPopover();

		await expect( linkPopover ).toBeVisible();

		// Pressing arrow key should not close the dialog.
		await pageUtils.pressKeys( 'ArrowLeft' );
		await expect( linkPopover ).toBeVisible();

		// Escape should close the dialog still.
		await page.keyboard.press( 'Escape' );

		await expect( linkPopover ).toBeHidden();
	} );

	test( `can be edited when within a link but no selection has been made ("collapsed")`, async ( {
		page,
		editor,
		LinkUtils,
		pageUtils,
	} ) => {
		await LinkUtils.createLink();
		await pageUtils.pressKeys( 'Escape' );
		// Make a collapsed selection inside the link.
		await pageUtils.pressKeys( 'ArrowLeft' );
		await pageUtils.pressKeys( 'ArrowRight' );
		await editor.clickBlockToolbarButton( 'Link' );

		const linkPopover = LinkUtils.getLinkPopover();
		await linkPopover.getByRole( 'button', { name: 'Edit' } ).click();

		// Change the URL.
		// getByPlaceholder required in order to handle Link Control component
		// managing focus onto other inputs within the control.
		await page.getByPlaceholder( 'Search or type URL' ).fill( '' );
		await page.keyboard.type( '/handbook' );

		// Submit the link.
		await pageUtils.pressKeys( 'Enter' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'This is <a href="/handbook">Gutenberg</a>',
				},
			},
		] );
	} );

	test( `escape dismisses the Link UI popover and returns focus`, async ( {
		admin,
		page,
		editor,
		pageUtils,
		requestUtils,
		LinkUtils,
	} ) => {
		const titleText = 'Test post escape';
		await requestUtils.createPost( {
			title: titleText,
			status: 'publish',
		} );

		await admin.createNewPost();

		// Now in a new post and try to create a link from an autocomplete suggestion using the keyboard.
		await editor.insertBlock( {
			name: 'core/paragraph',
		} );

		await page.keyboard.type( 'This is Gutenberg' );
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );

		// Insert a link.
		await pageUtils.pressKeys( 'primary+k' );

		const urlInput = page.getByRole( 'combobox', {
			name: 'Search or type URL',
		} );

		// Expect the "Link" combobox to be visible and focused
		await expect( urlInput ).toBeVisible();
		await expect( urlInput ).toBeFocused();

		// Trigger the autocomplete suggestion list.
		await page.keyboard.type( titleText );
		await expect(
			page.getByRole( 'option', {
				// "post" disambiguates from the "Create page" option.
				name: `${ titleText } post`,
			} )
		).toBeVisible();

		// Move into the suggestions list.
		await page.keyboard.press( 'ArrowDown' );

		// Expect the escape key to dismiss the popover when the autocomplete suggestion list is open.
		// Note that these have their own keybindings thus why we need to assert on this behaviour.
		await page.keyboard.press( 'Escape' );
		await expect( LinkUtils.getLinkPopover() ).toBeHidden();

		// Confirm that selection is returned to where it was before launching
		// the link editor, with "Gutenberg" as an uncollapsed selection.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( ' and more!' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'This is Gutenberg and more!',
				},
			},
		] );

		// Test pressing escape from the toolbar button should return focus to the toolbar button
		// Insert a link.
		await editor.clickBlockToolbarButton( 'Link' );

		// Expect the "Link" combobox to be visible and focused
		await expect( urlInput ).toBeVisible();
		await expect( urlInput ).toBeFocused();

		await page.keyboard.press( 'Escape' );
		await expect( LinkUtils.getLinkPopover() ).toBeHidden();

		// Focus should return to the Link Toolbar Button that opened the popover
		await expect(
			page.getByLabel( 'Link', { exact: true } )
		).toBeFocused();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'This is Gutenberg and more!',
				},
			},
		] );
	} );

	test( `can be created and modified using only the keyboard`, async ( {
		page,
		editor,
		pageUtils,
		LinkUtils,
	} ) => {
		const URL = 'https://wordpress.org/gutenberg';

		// Create a block with some text and format it as a link.
		await editor.insertBlock( {
			name: 'core/paragraph',
		} );
		await page.keyboard.type( 'This is Gutenberg' );
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );
		await pageUtils.pressKeys( 'primary+K' );
		const linkPopover = LinkUtils.getLinkPopover();
		await page.keyboard.type( URL );
		await pageUtils.pressKeys( 'Enter' );

		await expect( linkPopover ).toBeVisible();
		// Close the link control to return the caret to the canvas
		await pageUtils.pressKeys( 'Escape' );

		// Deselect the link text by moving the caret to the end of the line
		// and the link popover should not be displayed.
		await pageUtils.pressKeys( 'End' );
		await expect( linkPopover ).toBeHidden();

		// Move the caret back into and selects the link text.
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );
		await expect( linkPopover ).toBeHidden();

		// Switch the Link UI into "Edit" mode via keyboard shortcut
		// and check that the input has the correct value.
		await pageUtils.pressKeys( 'primary+K' );
		await pageUtils.pressKeys( 'Tab' );
		await pageUtils.pressKeys( 'Enter' );

		await expect(
			linkPopover.getByRole( 'combobox', {
				name: 'Search or type URL',
			} )
		).toHaveValue( URL );

		// Confirm that submitting the input without any changes keeps the same
		// value and moves focus back to the paragraph.

		// Submit without changes - should return to preview mode.
		await pageUtils.pressKeys( 'Enter' );

		// Move back into the RichText.
		await pageUtils.pressKeys( 'Escape' );
		// Link Popover should be hidden even though it's within the linked text.
		await expect( linkPopover ).toBeHidden();

		// Move outside of the link entirely.
		await pageUtils.pressKeys( 'ArrowRight' );

		// Append some text to the paragraph to assert that focus has been returned
		// to the correct location within the RichText.
		await page.keyboard.type( ' and more!' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content:
						'This is <a href="' + URL + '">Gutenberg</a> and more!',
				},
			},
		] );
	} );

	test( `adds an assertive message for screenreader users when an invalid link is set`, async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
		} );
		await page.keyboard.type( 'This is Gutenberg' );
		// Select some text.
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );

		// Insert a Link.
		await editor.clickBlockToolbarButton( 'Link' );

		await page.keyboard.type( 'http://#test.com' );
		await pageUtils.pressKeys( 'Enter' );
		expect(
			page.getByText(
				'Warning: the link has been inserted but may have errors. Please test it.'
			)
		).toBeTruthy();
	} );

	test( `can be created by selecting text and using keyboard shortcuts`, async ( {
		page,
		editor,
		pageUtils,
		LinkUtils,
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

		const linkPopover = LinkUtils.getLinkPopover();

		// Expect link popover to be visible
		await expect( linkPopover ).toBeVisible();

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

		// Submit the link.
		await page.keyboard.press( 'Enter' );

		// Expect the Link UI to still be visible
		await expect( linkPopover ).toBeVisible();

		// Tab to "Edit" button and enter edit mode again.
		await pageUtils.pressKeys( 'Tab' );
		await pageUtils.pressKeys( 'Enter' );

		// Open settings.
		await linkPopover
			.getByRole( 'button', {
				name: 'Advanced',
			} )
			.click();

		// Navigate to and toggle the "Open in new tab" checkbox.
		const checkbox = linkPopover.getByLabel( 'Open in new tab' );
		await checkbox.click();

		// Toggle should still have focus and be checked.
		await expect( checkbox ).toBeChecked();
		await expect( checkbox ).toBeFocused();

		// Tab back to the Submit and apply the link.
		await linkPopover.getByRole( 'button', { name: 'Save' } ).click();

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
		LinkUtils,
	} ) => {
		// Create a block with some text.
		await editor.insertBlock( {
			name: 'core/paragraph',
		} );
		await page.keyboard.type( 'This is WordPress' );

		// Select "WordPress".
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );
		await pageUtils.pressKeys( 'primary+k' );

		// Close the link control to return the caret to the canvas
		const linkPopover = LinkUtils.getLinkPopover();

		await page.keyboard.type( 'w.org' );

		// Submit the link
		await page.keyboard.press( 'Enter' );

		// Close the Link Popover.
		await pageUtils.pressKeys( 'Escape' );

		await expect( linkPopover ).toBeHidden();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'This is <a href="http://w.org">WordPress</a>',
				},
			},
		] );

		// Edit the link again.
		await pageUtils.pressKeys( 'primary+k' );

		// Expect Link UI to be visible again
		await expect( linkPopover ).toBeVisible();

		// Click on the `Edit` button.
		await linkPopover.getByRole( 'button', { name: 'Edit' } ).click();

		// Change the URL.
		// Note: getByPlaceholder required in order to handle Link Control component
		// managing focus onto other inputs within the control.
		await linkPopover.getByPlaceholder( 'Search or type URL' ).fill( '' );
		await page.keyboard.type( 'wordpress.org' );

		// Save the link.
		await linkPopover.getByRole( 'button', { name: 'Save' } ).click();

		// Link UI should be closed.
		await expect( linkPopover ).toBeHidden();

		// The link should have been updated.
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

	test( 'toggle state of advanced link settings is preserved across editing links', async ( {
		page,
		editor,
		pageUtils,
		LinkUtils,
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
		await page.keyboard.press( 'Escape' );

		// Move to edge of text "Gutenberg".
		await pageUtils.pressKeys( 'ArrowLeft' );
		await pageUtils.pressKeys( 'ArrowLeft' );
		// Select "Gutenberg".
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' ); // If you just use Alt here it won't work on windows.

		// Create a link.
		await pageUtils.pressKeys( 'primary+k' );

		await page.keyboard.type( 'https://wordpress.org/plugins/gutenberg/' );
		await page.keyboard.press( 'Enter' );

		// Press the "Edit" button
		const linkPopover = LinkUtils.getLinkPopover();
		await linkPopover.getByRole( 'button', { name: 'Edit' } ).click();

		// Toggle the Advanced settings to be open.
		// This should set the editor preference to persist this
		// UI state.
		await linkPopover
			.getByRole( 'button', {
				name: 'Advanced',
			} )
			.click();

		// Move focus out of Link UI and into Paragraph block.
		await pageUtils.pressKeys( 'Escape' );

		// Click on the "WordPress" link
		await editor.canvas
			.getByRole( 'link', {
				name: 'WordPress',
			} )
			.click();

		// press the "edit" button
		await linkPopover.getByRole( 'button', { name: 'Edit' } ).click();

		// Check that the Advanced settings are still expanded/open
		// and I can see the open in new tab checkbox. This verifies
		// that the editor preference was persisted.
		await expect(
			linkPopover.getByLabel( 'Open in new tab' )
		).toBeVisible();

		// Toggle the Advanced settings back to being closed.
		await linkPopover
			.getByRole( 'button', {
				name: 'Advanced',
			} )
			.click();

		// Move focus out of Link UI and into Paragraph block.
		await pageUtils.pressKeys( 'Escape' );

		// Move caret back into the "Gutenberg" link and open
		// the Link UI for that link.
		await editor.canvas
			.getByRole( 'link', {
				name: 'Gutenberg',
			} )
			.click();

		// Switch to "Edit" mode.
		await linkPopover.getByRole( 'button', { name: 'Edit' } ).click();

		// Check that the Advanced settings are still closed.
		// This verifies that the editor preference was persisted.
		await expect(
			linkPopover.getByLabel( 'Open in new tab' )
		).toBeHidden();
	} );

	test( 'can toggle link settings and save', async ( {
		editor,
		LinkUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content:
					'<a href="https://wordpress.org/gutenberg">Gutenberg</a>',
			},
		} );

		// Click on "Gutenberg" link in the canvas
		await editor.canvas
			.getByRole( 'link', {
				name: 'Gutenberg',
			} )
			.click();

		// Get the Link Popover using the LinkUtils helper
		const linkPopover = LinkUtils.getLinkPopover();

		// Switch to Edit the link
		await linkPopover.getByRole( 'button', { name: 'Edit' } ).click();

		// Open Advanced Settings
		await linkPopover
			.getByRole( 'button', {
				name: 'Advanced',
			} )
			.click();

		// expect settings for `Open in new tab` and `No follow`
		await expect(
			linkPopover.getByLabel( 'Open in new tab' )
		).not.toBeChecked();
		await expect( linkPopover.getByLabel( 'nofollow' ) ).not.toBeChecked();

		// Toggle both of the settings
		await linkPopover.getByLabel( 'Open in new tab' ).click();
		await linkPopover.getByLabel( 'nofollow' ).click();

		// Save the link
		await linkPopover.getByRole( 'button', { name: 'Save' } ).click();

		// Expect correct attributes to be set on the underlying link.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: `<a href="https://wordpress.org/gutenberg" target="_blank" rel="noreferrer noopener nofollow">Gutenberg</a>`,
				},
			},
		] );

		// Click on "Gutenberg" link in the canvas again
		await editor.canvas
			.getByRole( 'link', {
				name: 'Gutenberg',
			} )
			.click();

		// Edit the link
		await linkPopover.getByRole( 'button', { name: 'Edit' } ).click();

		// Toggle both the settings to be off.
		// Note: no need to toggle settings again because the open setting should be persisted.
		await linkPopover.getByLabel( 'Open in new tab' ).click();
		await linkPopover.getByLabel( 'nofollow' ).click();

		// Save the link
		await linkPopover.getByRole( 'button', { name: 'Save' } ).click();

		// Expect correct attributes to be set on the underlying link.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: `<a href="https://wordpress.org/gutenberg">Gutenberg</a>`,
				},
			},
		] );
	} );

	// Fix for https://github.com/WordPress/gutenberg/issues/58322
	test( 'can click links within the same paragraph to open the correct link preview (@firefox)', async ( {
		editor,
		LinkUtils,
	} ) => {
		// Create a paragraph with two links
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: `<a href="https://wordpressfoundation.org/donate/">Donate to the WordPress Foundation</a> to support <a href="https://wordpress.org/gutenberg">Gutenberg</a>`,
			},
		} );

		// Click on "Gutenberg" link in the canvas
		await editor.canvas
			.getByRole( 'link', {
				name: 'Gutenberg',
			} )
			.click();

		const linkPopover = LinkUtils.getLinkPopover();
		await expect( linkPopover ).toBeVisible();
		await expect(
			linkPopover.getByText( 'wordpress.org/gutenberg' )
		).toBeVisible();

		// Click the other link in the same paragraph. We need a short delay between mousdown and mouseup to get the popover to show
		await editor.canvas
			.getByRole( 'link', {
				name: 'WordPress',
			} )
			.click( { delay: 100 } );

		await expect( linkPopover ).toBeVisible();
		await expect(
			linkPopover.getByText( 'wordpress.org/gutenberg' )
		).toBeHidden();
		await expect(
			linkPopover.getByText( 'wordpressfoundation.org/donate/' )
		).toBeVisible();
	} );

	test.describe( 'Editing link text', () => {
		test( 'should allow editing text underneath popover when activated via mouse', async ( {
			page,
			editor,
			LinkUtils,
		} ) => {
			await LinkUtils.createLink();

			// Click on some other part of the text to move the caret.
			await editor.canvas
				.getByRole( 'document', {
					name: 'Block: Paragraph',
				} )
				.click();

			// Click on the link to activate the Link UI.
			const richTextLink = editor.canvas.getByRole( 'link', {
				name: 'Gutenberg',
			} );

			await richTextLink.click();

			// Check focus remains in the RichText.
			await expect(
				editor.canvas.getByRole( 'document', {
					name: 'Block: Paragraph',
				} )
			).toBeFocused();

			// Type to modify the link text.
			await page.keyboard.type( ' is awesome' );

			// expect link UI to be visible
			const linkPopover = LinkUtils.getLinkPopover();

			await expect( linkPopover ).toBeVisible();

			// Press "Edit" on Link UI
			await linkPopover.getByRole( 'button', { name: 'Edit' } ).click();

			// Check that the Link Text input reflects the change to the text
			// made in the RichText.
			const textInput = linkPopover.getByLabel( 'Text', { exact: true } );
			await expect( textInput ).toHaveValue( 'Gute is awesomenberg' );
		} );

		test( 'should allow for modification of link text via the Link UI', async ( {
			page,
			pageUtils,
			editor,
			LinkUtils,
		} ) => {
			await LinkUtils.createLink();

			const originalLinkText = 'Gutenberg';
			const changedLinkText =
				'    link text that was modified via the Link UI to include spaces     ';

			// Get the LinkPopover using the LinkUtils
			const linkPopover = LinkUtils.getLinkPopover();

			await linkPopover.getByRole( 'button', { name: 'Edit' } ).click();

			const textInput = page.getByLabel( 'Text', { exact: true } );

			// At this point, we still expect the text input
			// to reflect the original value with no modifications.
			await expect( textInput ).toHaveValue( originalLinkText );

			// Select all the link text in the input.
			await pageUtils.pressKeys( 'primary+a' );

			// Modify the link text value.
			await page.keyboard.type( changedLinkText );

			// Submit the change.
			await pageUtils.pressKeys( 'Enter' );

			// Check the created link reflects the link text.
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content:
							'This is <a href="https://wordpress.org/gutenberg">' +
							changedLinkText +
							'</a>',
					},
				},
			] );
		} );

		test( 'should not display text input when initially creating the link', async ( {
			page,
			editor,
			LinkUtils,
		} ) => {
			// Create a block with some text.
			await editor.insertBlock( {
				name: 'core/paragraph',
			} );
			await page.keyboard.type( 'This is Gutenberg: ' );

			// Insert a link
			await editor.clickBlockToolbarButton( 'Link' );

			const linkPopover = LinkUtils.getLinkPopover();

			// Check the Link UI is open before asserting on presence of text input
			// within that control.
			await expect( linkPopover ).toBeVisible();

			// Let's check we've focused a text input.
			const textInput = linkPopover.getByLabel( 'Text', { exact: true } );
			await expect( textInput ).toBeHidden();
		} );

		test( 'should display text input when the link has a valid URL value', async ( {
			pageUtils,
			LinkUtils,
		} ) => {
			await LinkUtils.createLink();
			await pageUtils.pressKeys( 'Escape' );

			// Make a collapsed selection inside the link. This is used
			// as a stress test to ensure we can find the link text from a
			// collapsed RichTextValue that contains a link format.
			await pageUtils.pressKeys( 'End' );
			await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );
			await pageUtils.pressKeys( 'primary+k' );

			const linkPopover = LinkUtils.getLinkPopover();

			await linkPopover.getByRole( 'button', { name: 'Edit' } ).click();

			// Check Text input is visible and is the focused field.
			const textInput = linkPopover.getByLabel( 'Text', { exact: true } );
			await expect( textInput ).toBeVisible();
			await expect( textInput ).toBeFocused();

			// Link was created on text value "Gutenberg". We expect
			// the text input to reflect that value.
			await expect( textInput ).toHaveValue( 'Gutenberg' );
		} );

		test( 'should show any trailing and/or leading whitespace from linked text within the text input', async ( {
			page,
			pageUtils,
			editor,
		} ) => {
			const textToSelect = `         spaces     `;
			const textWithWhitespace = `Text with leading and trailing${ textToSelect }`;

			// Create a block with some text.
			await editor.insertBlock( {
				name: 'core/paragraph',
			} );
			await page.keyboard.type( textWithWhitespace );

			// Use arrow keys to select only the text with the leading
			// and trailing whitespace.
			await pageUtils.pressKeys( 'shift+ArrowLeft', {
				times: textToSelect.length,
			} );

			// Click on the Link button.
			await editor.clickBlockToolbarButton( 'Link' );

			// Type a URL.
			await page.keyboard.type( 'https://wordpress.org/gutenberg' );

			// Click on the Submit button.
			await pageUtils.pressKeys( 'Enter' );

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content:
							'Text with leading and trailing<a href="https://wordpress.org/gutenberg">' +
							textToSelect +
							'</a>',
					},
				},
			] );
		} );
	} );

	test.describe( 'Disabling Link UI active state', () => {
		test( 'should correctly move focus when link control closes on click outside', async ( {
			page,
			pageUtils,
			LinkUtils,
		} ) => {
			await LinkUtils.createLink();

			const linkPopover = LinkUtils.getLinkPopover();

			await expect( linkPopover ).toBeVisible();

			const optionsButton = page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Options' } );

			await optionsButton.click();

			await expect( linkPopover ).toBeHidden();
			// Expect focus on Top toolbar button within dropdown
			await expect(
				page.getByRole( 'menuitemcheckbox', {
					name: 'Top toolbar Access all block and document tools in a single place',
				} )
			).toBeFocused();
			// Press Escape
			await pageUtils.pressKeys( 'Escape' );
			// Expect focus on Top toolbar Options button
			await expect( optionsButton ).toBeFocused();
		} );

		// Based on issue reported in https://github.com/WordPress/gutenberg/issues/41771/.
		test( `should correctly replace active link's text value within rich text even when multiple matching text values exist within the rich text`, async ( {
			page,
			editor,
			pageUtils,
			LinkUtils,
		} ) => {
			// Create a block with some text.
			await editor.insertBlock( {
				name: 'core/paragraph',
			} );

			// Note the two instances of the string "a".
			await page.keyboard.type( `a b c a` );

			// Select the last "a" only.
			await pageUtils.pressKeys( 'shift+ArrowLeft' );

			// Click on the Link button.
			await editor.clickBlockToolbarButton( 'Link' );

			// Type a URL.
			await page.keyboard.type( 'www.wordpress.org' );

			// Update the link.
			await pageUtils.pressKeys( 'Enter' );

			await pageUtils.pressKeys( 'ArrowLeft' );

			const linkPopover = LinkUtils.getLinkPopover();

			// Click the "Edit" button in Link UI
			await linkPopover.getByRole( 'button', { name: 'Edit' } ).click();

			// Focus the "Text" field within the linkPopover
			await linkPopover
				.getByRole( 'textbox', {
					name: 'Text',
				} )
				.focus();

			// Delete existing value from "Text" field
			await pageUtils.pressKeys( 'Backspace' );

			// Change text to "z"
			await page.keyboard.type( 'z' );

			await pageUtils.pressKeys( 'Enter' );

			// Check that the correct (i.e. last) instance of "a" was replaced with "z".
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content:
							'a b c <a href="http://www.wordpress.org">z</a>',
					},
				},
			] );
		} );
	} );
} );

class LinkUtils {
	constructor( { editor, page, pageUtils } ) {
		this.page = page;
		this.editor = editor;
		this.pageUtils = pageUtils;
	}

	async toggleFixedToolbar( isFixed ) {
		await this.page.evaluate( ( _isFixed ) => {
			const { select, dispatch } = window.wp.data;
			const isCurrentlyFixed =
				select( 'core/preferences' ).get( 'fixedToolbar' );

			if ( isCurrentlyFixed !== _isFixed ) {
				dispatch( 'core/preferences' ).toggle( 'fixedToolbar' );
			}
		}, isFixed );
	}

	async createLink() {
		// Create a block with some text.
		await this.editor.insertBlock( {
			name: 'core/paragraph',
		} );
		await this.page.keyboard.type( 'This is Gutenberg' );

		// Select some text.
		await this.pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );

		// Click on the Link button.
		await this.pageUtils.pressKeys( 'primary+k' );

		// get the link popover
		const linkPopover = this.getLinkPopover();

		// Expect link popover to be visible
		await expect( linkPopover ).toBeVisible();

		// Type a URL.
		await this.page.keyboard.type( 'https://wordpress.org/gutenberg' );

		// Submit the link.
		await this.pageUtils.pressKeys( 'Enter' );
	}

	/**
	 * This method is used as a temporary workaround for retriveing the
	 * LinkControl component. This is because it currently does not expose
	 * any accessible attributes. In general we should avoid using this method
	 * and instead rely on locating the sub elements of the component directly.
	 * Remove / update method once the following PR has landed:
	 * https://github.com/WordPress/gutenberg/pull/54063.
	 */
	getLinkPopover() {
		return this.page.locator(
			'.components-popover__content .block-editor-link-control'
		);
	}
}
