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
		pageUtils,
	} ) => {
		const titleText = 'Post to create a link to';
		await admin.createNewPost( { title: titleText } );
		const postId = await editor.publishPost();
		await admin.createNewPost();

		// Now in a new post and try to create a link from an autocomplete suggestion using the keyboard.
		await editor.insertBlock( {
			name: 'core/paragraph',
		} );
		await page.keyboard.type( 'Here comes a link: ' );

		// Press Cmd+K to insert a link.
		await pageUtils.pressKeys( 'primary+K' );

		// Trigger the autocomplete suggestion list and select the first suggestion.
		await page.keyboard.type( titleText.substr( 0, titleText.length - 2 ) );
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

	test( `can be created by selecting text and clicking Link`, async ( {
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
		await page.getByRole( 'button', { name: 'Link' } ).click();

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
		await page.getByRole( 'button', { name: 'Link' } ).click();
		const urlInput = await page
			.getByPlaceholder( 'Search or type url' )
			.inputValue();

		expect( urlInput ).toBe( '' );
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

	test( `can be created instantly when a URL is selected`, async ( {
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
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );

		// Click on the Link button.
		await page.getByRole( 'button', { name: 'Link' } ).click();

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

	test( `is not created when we click away from the link input`, async ( {
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
		await page.getByRole( 'button', { name: 'Link' } ).click();

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

	test( `can be edited`, async ( { page, editor, pageUtils, LinkUtils } ) => {
		await LinkUtils.createAndReselectLink();

		// Click on the Edit button.
		await page.getByRole( 'button', { name: 'Edit' } ).click();

		// Change the URL.
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

	test( `can be removed`, async ( { page, editor, LinkUtils } ) => {
		await LinkUtils.createAndReselectLink();

		// Unlick via shortcut
		// we do this to avoid an layout edge case whereby
		// the rich link preview popover will obscure the block toolbar
		// under very specific circumstances and screensizes.
		await page
			.locator( '.block-editor-link-control__search-item-top' )
			.getByRole( 'button', { name: 'Unlink' } )
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

	test( `allows Left to be pressed during creation when the toolbar is fixed to top`, async ( {
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
		await page.getByRole( 'button', { name: 'Link' } ).click();

		// Typing "left" should not close the dialog.
		await pageUtils.pressKeys( 'ArrowLeft' );
		let popover = page
			//TODO: change to a better selector when https://github.com/WordPress/gutenberg/issues/51060 is resolved.
			.locator(
				'.components-popover__content .block-editor-link-control'
			);
		await expect( popover ).toBeVisible();

		// Escape should close the dialog still.
		await page.keyboard.press( 'Escape' );
		popover = page
			//TODO: change to a better selector when https://github.com/WordPress/gutenberg/issues/51060 is resolved.
			.locator(
				'.components-popover__content .block-editor-link-control'
			);
		await expect( popover ).not.toBeVisible();
	} );

	test( `allows Left to be pressed during creation in "Docked Toolbar" mode`, async ( {
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

		// Typing "left" should not close the dialog.
		await pageUtils.pressKeys( 'ArrowLeft' );
		let popover = page
			//TODO: change to a better selector when https://github.com/WordPress/gutenberg/issues/51060 is resolved.
			.locator(
				'.components-popover__content .block-editor-link-control'
			);
		await expect( popover ).toBeVisible();

		// Escape should close the dialog still.
		await page.keyboard.press( 'Escape' );
		popover = page
			//TODO: change to a better selector when https://github.com/WordPress/gutenberg/issues/51060 is resolved.
			.locator(
				'.components-popover__content .block-editor-link-control'
			);
		await expect( popover ).not.toBeVisible();
	} );

	test( `can be edited with collapsed selection`, async ( {
		page,
		editor,
		LinkUtils,
		pageUtils,
	} ) => {
		await LinkUtils.createAndReselectLink();
		// Make a collapsed selection inside the link
		await pageUtils.pressKeys( 'ArrowLeft' );
		await pageUtils.pressKeys( 'ArrowRight' );
		await editor.showBlockToolbar();
		await page.getByRole( 'button', { name: 'Edit' } ).click();

		// Change the URL.
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

	test( `allows use of escape key to dismiss the url popover`, async ( {
		admin,
		page,
		editor,
		pageUtils,
	} ) => {
		const titleText = 'Test post escape';
		await admin.createNewPost( { title: titleText } );
		const postId = await editor.publishPost();
		await admin.createNewPost();

		// Now in a new post and try to create a link from an autocomplete suggestion using the keyboard.
		await editor.insertBlock( {
			name: 'core/paragraph',
		} );

		await page.keyboard.type( 'This is Gutenberg' );
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );

		// Press Cmd+K to insert a link.
		await pageUtils.pressKeys( 'primary+K' );

		await expect(
			//TODO: change to a better selector when https://github.com/WordPress/gutenberg/issues/51060 is resolved.
			page.locator(
				'.components-popover__content .block-editor-link-control'
			)
		).toBeVisible();

		// Trigger the autocomplete suggestion list and select the first suggestion.
		await page.keyboard.type( titleText );
		await expect(
			page.getByRole( 'option', {
				name: titleText + ' localhost:8889/?p=' + postId + ' post',
			} )
		).toBeVisible();
		await page.keyboard.press( 'ArrowDown' );

		// Expect the escape key to dismiss the popover when the autocomplete suggestion list is open.
		await page.keyboard.press( 'Escape' );
		await expect(
			page.locator(
				'.components-popover__content .block-editor-link-control'
			)
		).not.toBeVisible();

		// Confirm that selection is returned to where it was before launching
		// the link editor, with "Gutenberg" as an uncollapsed selection.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( '.' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'This is Gutenberg.',
				},
			},
		] );

		// Press Cmd+K to insert a link.
		await pageUtils.pressKeys( 'primary+K' );

		await expect(
			page.locator(
				'.components-popover__content .block-editor-link-control'
			)
		).toBeVisible();

		// Expect the escape key to dismiss the popover normally.
		await page.keyboard.press( 'Escape' );
		await expect(
			page.locator(
				'.components-popover__content .block-editor-link-control'
			)
		).not.toBeVisible();

		// Press Cmd+K to insert a link.
		await pageUtils.pressKeys( 'primary+K' );

		await expect(
			page.locator(
				'.components-popover__content .block-editor-link-control'
			)
		).toBeVisible();

		// Tab to the "Open in new tab" toggle.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );

		// Expect the escape key to dismiss the popover normally.
		await pageUtils.pressKeys( 'Escape' ); //page.keyboard.press( 'Escape' );
		await expect(
			page.locator(
				'.components-popover__content .block-editor-link-control'
			)
		).not.toBeVisible();
	} );

	test( `can be modified using the keyboard once a link has been set`, async ( {
		page,
		editor,
		pageUtils,
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

		// Deselect the link text by moving the caret to the end of the line
		// and the link popover should not be displayed.
		await pageUtils.pressKeys( 'End' );
		await expect(
			page.locator(
				'.components-popover__content .block-editor-link-control'
			)
		).not.toBeVisible();

		// Move the caret back into the link text and the link popover
		// should be displayed.
		await pageUtils.pressKeys( 'ArrowLeft' );
		await expect(
			page.locator(
				'.components-popover__content .block-editor-link-control'
			)
		).toBeVisible();

		// Reopen the link popover and check that the input has the correct value.
		await pageUtils.pressKeys( 'primary+K' );
		const urlInput = page.getByPlaceholder( 'Search or type url' );
		await urlInput.focus();
		expect( await urlInput.inputValue() ).toBe( URL );

		// Confirm that submitting the input without any changes keeps the same
		// value and moves focus back to the paragraph.
		await pageUtils.pressKeys( 'Enter' );
		await pageUtils.pressKeys( 'ArrowRight' );
		await page.keyboard.type( '.' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'This is <a href="' + URL + '">Gutenberg</a>.',
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
		// Press Cmd+K to insert a link.
		await pageUtils.pressKeys( 'primary+K' );

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

		// Save the link
		await page
			.locator( '.block-editor-link-control' )
			.getByRole( 'button', { name: 'Save' } )
			.click();

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
		await page
			.locator( '.block-editor-link-control' )
			.getByRole( 'button', { name: 'Save' } )
			.click();

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
		test( 'should not display text input when initially creating the link', async ( {
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
			await pageUtils.pressKeys( 'primary+k' );

			//Check that the HTML anchor input under Advanced is empty
			await page.getByRole( 'button', { name: 'Advanced' } ).click();
			const inputElement = page.getByLabel( 'HTML anchor' );
			await expect( inputElement ).toHaveValue( '' );
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
}
