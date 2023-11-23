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
				name: 'Link',
			} )
		).toHaveValue( '' );
	} );

	test( `can be created without any text selected`, async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		// Create a block with some text.
		await editor.insertBlock( {
			name: 'core/paragraph',
		} );
		await page.keyboard.type( 'This is Gutenberg: ' );

		// Press Cmd+K to insert a link.
		await pageUtils.pressKeys( 'primary+K' );

		// Type a URL.
		await page.keyboard.type( 'https://wordpress.org/gutenberg' );

		// Press Enter to apply the link.
		await pageUtils.pressKeys( 'Enter' );

		// A link with the URL as its text should have been inserted.
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
		await LinkUtils.createAndReselectLink();

		// Click on the Edit button.
		await page.getByRole( 'button', { name: 'Edit' } ).click();

		// Change the URL.
		// getByPlaceholder required in order to handle Link Control component
		// managing focus onto other inputs within the control.
		await page.getByPlaceholder( 'Search or type url' ).fill( '' );
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
		await LinkUtils.createAndReselectLink();

		const linkPopover = LinkUtils.getLinkPopover();

		await linkPopover.getByRole( 'button', { name: 'Unlink' } ).click();

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
		await LinkUtils.createAndReselectLink();
		// Make a collapsed selection inside the link.
		await pageUtils.pressKeys( 'ArrowLeft' );
		await pageUtils.pressKeys( 'ArrowRight' );

		const linkPopover = LinkUtils.getLinkPopover();
		await linkPopover.getByRole( 'button', { name: 'Edit' } ).click();

		// Change the URL.
		// getByPlaceholder required in order to handle Link Control component
		// managing focus onto other inputs within the control.
		await page.getByPlaceholder( 'Search or type url' ).fill( '' );
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
		await editor.clickBlockToolbarButton( 'Link' );

		const urlInput = page.getByRole( 'combobox', {
			name: 'Link',
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
		await page.keyboard.type( URL );
		await pageUtils.pressKeys( 'Enter' );

		const linkPopover = LinkUtils.getLinkPopover();

		// Deselect the link text by moving the caret to the end of the line
		// and the link popover should not be displayed.
		await pageUtils.pressKeys( 'End' );
		await expect( linkPopover ).toBeHidden();

		// Move the caret back into the link text and the link popover
		// should be displayed.
		await pageUtils.pressKeys( 'ArrowLeft' );
		await expect( linkPopover ).toBeVisible();

		// Switch the Link UI into "Edit" mode via keyboard shortcut
		// and check that the input has the correct value.
		await pageUtils.pressKeys( 'primary+K' );

		await expect(
			linkPopover.getByRole( 'combobox', {
				name: 'Link',
			} )
		).toHaveValue( URL );

		// Confirm that submitting the input without any changes keeps the same
		// value and moves focus back to the paragraph.

		// Submit without changes - should return to preview mode.
		await pageUtils.pressKeys( 'Enter' );

		// Move back into the RichText.
		await pageUtils.pressKeys( 'Escape' );

		// ...but the Link Popover should still be active because we are within the link.
		await expect( linkPopover ).toBeVisible();

		// Move outside of the link entirely.
		await pageUtils.pressKeys( 'ArrowRight' );

		// Link Popover should now disappear because we are no longer within the link.
		await expect( linkPopover ).toBeHidden();

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

		const linkPopover = LinkUtils.getLinkPopover();

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

		// getByPlaceholder required in order to handle Link Control component
		// managing focus onto other inputs within the control.
		await page.getByPlaceholder( 'Search or type url' ).fill( '' );
		await page.keyboard.type( 'wordpress.org' );

		const linkPopover = LinkUtils.getLinkPopover();

		// Update the link.
		await linkPopover.getByRole( 'button', { name: 'Save' } ).click();

		// Navigate back to the popover.
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );

		// Navigate back to inputs to verify appears as changed.
		await pageUtils.pressKeys( 'primary+k' );

		expect(
			await page
				.getByRole( 'combobox', {
					name: 'Link',
				} )
				.inputValue()
		).toContain( 'wordpress.org' );

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
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' ); // If you just use Alt here it won't work on windows.
		await pageUtils.pressKeys( 'ArrowLeft' );
		await pageUtils.pressKeys( 'ArrowLeft' );

		// Select "Gutenberg".
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );

		// Create a link.
		await pageUtils.pressKeys( 'primary+k' );
		await page.keyboard.type( 'https://wordpress.org/plugins/gutenberg/' );
		await page.keyboard.press( 'Enter' );

		// Move back into the link.
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );
		await pageUtils.pressKeys( 'primary+k' );

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

		// Move caret back into the "Gutenberg" link and open
		// the Link UI for that link.
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );
		await pageUtils.pressKeys( 'primary+k' );

		// Check that the Advanced settings are still closed.
		// This verifies that the editor preference was persisted.
		await expect( page.getByLabel( 'Open in new tab' ) ).toBeHidden();
	} );

	test( 'can toggle link settings and save', async ( {
		page,
		editor,
		pageUtils,
		LinkUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content:
					'<a href="https://wordpress.org/gutenberg">Gutenberg</a>',
			},
		} );

		// Move caret into the link.
		await pageUtils.pressKeys( 'ArrowRight' );

		// Switch Link UI to "edit" mode.
		await page.getByRole( 'button', { name: 'Edit' } ).click();

		// Open Advanced Settings
		await page
			.getByRole( 'region', {
				name: 'Editor content',
			} )
			.getByRole( 'button', {
				name: 'Advanced',
			} )
			.click();

		// expect settings for `Open in new tab` and `No follow`
		await expect( page.getByLabel( 'Open in new tab' ) ).not.toBeChecked();
		await expect( page.getByLabel( 'nofollow' ) ).not.toBeChecked();

		// Toggle both of the settings
		await page.getByLabel( 'Open in new tab' ).click();
		await page.getByLabel( 'nofollow' ).click();

		const linkPopover = LinkUtils.getLinkPopover();

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

		// Move caret back into the link.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowRight' );

		// Edit the link
		await page.getByRole( 'button', { name: 'Edit' } ).click();

		// Toggle both the settings to be off.
		// Note: no need to toggle settings again because the open setting should be persisted.
		await page.getByLabel( 'Open in new tab' ).click();
		await page.getByLabel( 'nofollow' ).click();

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

	test.describe( 'Editing link text', () => {
		test( 'should allow for modification of link text via the Link UI', async ( {
			page,
			pageUtils,
			editor,
			LinkUtils,
		} ) => {
			await LinkUtils.createAndReselectLink();

			const originalLinkText = 'Gutenberg';
			const changedLinkText =
				'    link text that was modified via the Link UI to include spaces     ';

			// Make a collapsed selection inside the link. This is used
			// as a stress test to ensure we can find the link text from a
			// collapsed RichTextValue that contains a link format.
			await pageUtils.pressKeys( 'ArrowLeft' );
			await pageUtils.pressKeys( 'ArrowRight' );

			await editor.showBlockToolbar();
			await page.getByRole( 'button', { name: 'Edit' } ).click();

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
			pageUtils,
			LinkUtils,
		} ) => {
			// Create a block with some text.
			await editor.insertBlock( {
				name: 'core/paragraph',
			} );
			await page.keyboard.type( 'This is Gutenberg: ' );

			// Press Cmd+K to insert a link.
			await pageUtils.pressKeys( 'primary+k' );

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
			await LinkUtils.createAndReselectLink();

			// Make a collapsed selection inside the link. This is used
			// as a stress test to ensure we can find the link text from a
			// collapsed RichTextValue that contains a link format.
			await pageUtils.pressKeys( 'ArrowLeft' );
			await pageUtils.pressKeys( 'ArrowRight' );

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
			const textToSelect = `\u2003\u2003 spaces\u2003 `;
			const textWithWhitespace = `Text with leading and trailing       spaces    `;

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

		test( 'should display (capture the) text from the currently active link even if there is a rich text selection', async ( {
			editor,
			pageUtils,
			LinkUtils,
		} ) => {
			const originalLinkText = 'Gutenberg';

			await LinkUtils.createAndReselectLink();

			// Make a collapsed selection inside the link in order
			// to activate the Link UI.
			await pageUtils.pressKeys( 'ArrowLeft' );
			await pageUtils.pressKeys( 'ArrowRight' );

			const linkPopover = LinkUtils.getLinkPopover();

			await linkPopover.getByRole( 'button', { name: 'Edit' } ).click();

			// Place cursor within the underling RichText link (not the Link UI).
			await editor.canvas
				.getByRole( 'document', {
					name: 'Block: Paragraph',
				} )
				.getByRole( 'link', {
					name: 'Gutenberg',
				} )
				.click();

			// Make a selection within the RichText.
			await pageUtils.pressKeys( 'shift+ArrowRight', {
				times: 3,
			} );

			// Making a selection within the link text whilst the Link UI
			// is open should not alter the value in the Link UI's "Text"
			// field. It should remain as the full text of the currently
			// focused link format.
			await expect(
				linkPopover.getByLabel( 'Text', { exact: true } )
			).toHaveValue( originalLinkText );
		} );
	} );

	test.describe( 'Disabling Link UI active state', () => {
		test( 'should not show the Link UI when selection extends beyond link boundary', async ( {
			page,
			pageUtils,
			editor,
			LinkUtils,
		} ) => {
			const linkedText = `Gutenberg`;
			const textBeyondLinkedText = ` and more text.`;

			// Create a block with some text.
			await editor.insertBlock( {
				name: 'core/paragraph',
			} );
			await page.keyboard.type(
				`This is ${ linkedText }${ textBeyondLinkedText }`
			);

			// Move cursor next to end of `linkedText`.
			await pageUtils.pressKeys( 'ArrowLeft', {
				times: textBeyondLinkedText.length,
			} );

			// Select the linkedText.
			await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );

			// Click on the Link button.
			await editor.clickBlockToolbarButton( 'Link' );

			// Type a URL.
			await page.keyboard.type( 'https://wordpress.org/gutenberg' );

			// Update the link.
			await pageUtils.pressKeys( 'Enter' );
			// Reactivate the link.
			await pageUtils.pressKeys( 'ArrowLeft' );
			await pageUtils.pressKeys( 'ArrowLeft' );

			const linkPopover = LinkUtils.getLinkPopover();

			await expect( linkPopover ).toBeVisible();

			// Make selection starting within the link and moving beyond boundary to the left.
			await pageUtils.pressKeys( 'shiftAlt+ArrowLeft', {
				times: linkedText.length,
			} );

			// The Link UI should have disappeared (i.e. be inactive).
			await expect( linkPopover ).toBeHidden();

			// Cancel selection and move back within the Link.
			await pageUtils.pressKeys( 'ArrowRight' );

			// We should see the Link UI displayed again.
			await expect( linkPopover ).toBeVisible();

			// Make selection starting within the link and moving beyond boundary to the right.
			await pageUtils.pressKeys( 'shift+ArrowRight', {
				times: 3,
			} );

			// The Link UI should have disappeared (i.e. be inactive).
			await expect( linkPopover ).toBeHidden();
		} );

		test( 'should not show the Link UI when selection extends into another link', async ( {
			page,
			pageUtils,
			editor,
			LinkUtils,
		} ) => {
			const linkedTextOne = `Gutenberg`;
			const linkedTextTwo = `Block Editor`;
			const linkOneURL = 'https://wordpress.org';
			const linkTwoURL = 'https://wordpress.org/gutenberg';

			// Create a block with some text.
			await editor.insertBlock( {
				name: 'core/paragraph',
			} );
			await page.keyboard.type(
				`This is the ${ linkedTextOne }${ linkedTextTwo }`
			);

			// Select the linkedTextTwo.
			await pageUtils.pressKeys( 'shift+ArrowLeft', {
				times: linkedTextTwo.length,
			} );

			// Click on the Link button.
			await editor.clickBlockToolbarButton( 'Link' );

			// Type a URL.
			await page.keyboard.type( linkTwoURL );

			// Update the link.
			await pageUtils.pressKeys( 'Enter' );

			// Move cursor next to the **end** of `linkTextOne`
			await pageUtils.pressKeys( 'ArrowLeft', {
				times: linkedTextTwo.length,
			} );

			// Select `linkTextOne`
			await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );

			// Click on the Link button.
			await editor.clickBlockToolbarButton( 'Link' );

			// Type a URL.
			await page.keyboard.type( linkOneURL );

			// Update the link.
			await pageUtils.pressKeys( 'Enter' );

			// Move cursor within `linkTextOne`
			await pageUtils.pressKeys( 'ArrowLeft', {
				times: 3,
			} );

			const linkPopover = LinkUtils.getLinkPopover();

			// Link UI should activate for `linkTextOne`
			await expect( linkPopover ).toBeVisible();

			// Expand selection so that it overlaps with `linkTextTwo`
			await pageUtils.pressKeys( 'ArrowRight', {
				times: 3,
			} );

			// Link UI should be inactive.
			await expect( linkPopover ).toBeHidden();
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
				select( 'core/edit-post' ).isFeatureActive( 'fixedToolbar' );

			if ( isCurrentlyFixed !== _isFixed ) {
				dispatch( 'core/edit-post' ).toggleFeature( 'fixedToolbar' );
			}
		}, isFixed );
	}

	async createAndReselectLink() {
		// Create a block with some text.
		await this.editor.insertBlock( {
			name: 'core/paragraph',
		} );
		await this.page.keyboard.type( 'This is Gutenberg' );

		// Select some text.
		await this.pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );

		// Click on the Link button.
		await this.page.getByRole( 'button', { name: 'Link' } ).click();

		// Type a URL.
		await this.page.keyboard.type( 'https://wordpress.org/gutenberg' );

		// Click on the Submit button.
		await this.pageUtils.pressKeys( 'Enter' );

		// Reselect the link.
		await this.pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );
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
