const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Meta boxes', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-plugin-meta-box' );
		await requestUtils.deleteAllPosts();
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-plugin-meta-box' );
	} );

	test( 'Should save the post', async ( { editor, page } ) => {
		const saveDraft = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save draft' } );

		// Save should not be an option for new empty post.
		await expect( saveDraft ).toBeDisabled();

		// Add title to enable valid non-empty post save.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello Meta' );

		await expect( saveDraft ).toBeEnabled();

		await editor.saveDraft();

		// After saving, affirm that the button returns to Save Draft.
		await expect( saveDraft ).toBeEnabled();
	} );

	test( 'should leave undo to the browser inside meta box fields', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'canvas text' );

		// Click near the label, away from the resize handle overlaying the
		// center of the toggle.
		await page
			.getByRole( 'button', { name: 'Meta Boxes', exact: true } )
			.click( { position: { x: 40, y: 10 } } );
		const field = page.getByRole( 'textbox', {
			name: 'Test meta box field',
		} );
		await field.click();
		await page.keyboard.type( 'META' );
		await expect( field ).toHaveValue( 'META' );

		await pageUtils.pressKeys( 'primary+z', { times: 4 } );

		// The browser undoes the typing within the field. The canvas is
		// untouched, and redo restores the typing.
		await expect( field ).toHaveValue( '' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'canvas text' },
			},
		] );

		await pageUtils.pressKeys( 'primaryShift+z', { times: 4 } );
		await expect( field ).toHaveValue( 'META' );
	} );

	test( 'Should render dynamic blocks when the meta box uses the excerpt for front end rendering', async ( {
		admin,
		editor,
		page,
	} ) => {
		// Publish a post so there's something for the latest posts dynamic block to render.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'A published post' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Hello there!' );
		await editor.publishPost();

		// Publish a post with the latest posts dynamic block.
		await admin.createNewPost();
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Dynamic block test' );
		await editor.insertBlock( { name: 'core/latest-posts' } );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		await expect(
			page.locator( '.entry-content .wp-block-latest-posts__post-title' )
		).toContainText( [ 'Dynamic block test', 'A published post' ] );
	} );

	test( 'Should render the excerpt in meta based on post content if no explicit excerpt exists', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'A published post' );
		await editor.canvas
			.getByRole( 'document', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'Excerpt from content.' );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		await expect(
			page.locator( 'meta[property="gutenberg:hello"]' )
		).toHaveAttribute( 'content', 'Excerpt from content.' );
	} );

	test( 'Should render the explicitly set excerpt in meta instead of the content based one', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();
		await editor.canvas
			.getByRole( 'document', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'Excerpt from content.' );
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'A published post' );

		const excerptButton = page.getByRole( 'button', {
			name: 'Add an excerpt…',
		} );
		await excerptButton.click();

		await page
			.getByRole( 'textbox', { name: 'Write an Excerpt' } )
			.fill( 'Explicitly set excerpt.' );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		await expect(
			page.locator( 'meta[property="gutenberg:hello"]' )
		).toHaveAttribute( 'content', 'Explicitly set excerpt.' );
	} );
} );

test.describe( 'Meta boxes in the sidebar only', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		// Earlier tests may have saved the pane as open.
		await Promise.all( [
			requestUtils.activatePlugin(
				'gutenberg-test-plugin-side-meta-box'
			),
			requestUtils.resetPreferences(),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deactivatePlugin(
				'gutenberg-test-plugin-side-meta-box'
			),
			requestUtils.resetPreferences(),
		] );
	} );

	test( 'should not show the empty meta boxes pane when it is closed', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.openDocumentSettingsSidebar();

		// Waits for the side meta box so the pane has had a chance to render.
		await expect(
			page.getByRole( 'heading', {
				name: 'Gutenberg Test Side Meta Box',
			} )
		).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: 'Meta Boxes', exact: true } )
		).toBeHidden();
	} );

	test( 'should keep the meta boxes pane when it is open', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await requestUtils.setPreferences( 'core/edit-post', {
			metaBoxesMainIsOpen: true,
		} );
		await admin.createNewPost();

		const toggle = page.getByRole( 'button', {
			name: 'Meta Boxes',
			exact: true,
		} );
		await expect( toggle ).toHaveAttribute( 'aria-expanded', 'true' );

		// Collapsing keeps the pane around until the next load.
		await toggle.click( { position: { x: 40, y: 10 } } );
		await expect( toggle ).toHaveAttribute( 'aria-expanded', 'false' );
	} );
} );
