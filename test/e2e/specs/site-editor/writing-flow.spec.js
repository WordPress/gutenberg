const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site editor writing flow', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	// Check for regressions of https://github.com/WordPress/gutenberg/issues/41811.
	test( 'allows shift tabbing to the block toolbar from the first block', async ( {
		admin,
		editor,
		page,
		pageUtils,
	} ) => {
		// Navigate to a template part with only a couple of blocks.
		await admin.visitSiteEditor( {
			postId: 'emptytheme//header',
			postType: 'wp_template_part',
			canvas: 'edit',
		} );
		// Select the first site title block.
		const siteTitleBlock = editor.canvas.locator(
			'role=document[name="Block: Site Title"i]'
		);
		await expect( siteTitleBlock ).toBeVisible();
		await editor.selectBlocks( siteTitleBlock );

		// Shift tab to the toolbar.
		await pageUtils.pressKeys( 'shift+Tab' );
		const blockToolbarButton = page.locator(
			'role=toolbar[name="Block tools"i] >> role=button[name="Site Title"i]'
		);
		await expect( blockToolbarButton ).toBeFocused();
	} );

	// Check for regressions of https://github.com/WordPress/gutenberg/issues/41811.
	test( 'allows tabbing to the inspector from the last block', async ( {
		admin,
		editor,
		page,
		pageUtils,
	} ) => {
		// Navigate to a template part with only a couple of blocks.
		await admin.visitSiteEditor( {
			postId: 'emptytheme//header',
			postType: 'wp_template_part',
			canvas: 'edit',
		} );
		// Make sure the sidebar is open.
		await editor.openDocumentSettingsSidebar();

		// Select the last site tagline block.
		const siteTaglineBlock = editor.canvas.locator(
			'role=document[name="Block: Site Tagline"i]'
		);
		await expect( siteTaglineBlock ).toBeVisible();
		await editor.selectBlocks( siteTaglineBlock );

		// Tab to the inspector, tabbing three times to go past the two resize handles.
		await pageUtils.pressKeys( 'Tab', { times: 3 } );
		const inspectorBlockTab = page.locator(
			'role=region[name="Editor settings"i] >> role=tab[name="Block"i]'
		);
		await expect( inspectorBlockTab ).toBeFocused();
	} );

	test( 'enter selects the next block', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const { id } = await requestUtils.createPage( {
			status: 'draft',
			title: 'test',
		} );

		await admin.visitSiteEditor( {
			postId: id,
			postType: 'page',
			canvas: 'edit',
		} );

		// Render the page within its template so the template blocks
		// surround the post blocks.
		await expect(
			editor.canvas.getByRole( 'textbox', { name: 'Add title' } )
		).toBeVisible();
		await page.evaluate( () => {
			window.wp.data
				.dispatch( 'core/editor' )
				.setRenderingMode( 'template-locked' );
		} );

		// select the first block
		const firstBlock = editor.canvas.locator(
			'role=document[name="Block: Title"i]'
		);
		await editor.selectBlocks( firstBlock );

		await expect( firstBlock ).toBeFocused();

		await page.keyboard.press( 'Enter' );
		const secondBlock = editor.canvas.locator(
			'role=document[name="Block: Content"i]'
		);
		await expect( secondBlock ).toBeFocused();

		await page.keyboard.press( 'Enter' );
		const thirdBlock = editor.canvas.getByRole( 'document', {
			name: 'Empty block',
		} );
		await expect( thirdBlock ).toBeFocused();

		// Typing proves the ghost materialised into a real stored block.
		await page.keyboard.type( 'a' );
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toHaveText( 'a' );
	} );

	test( 'enter in a nested editable inserts a block after', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//header',
			postType: 'wp_template_part',
			canvas: 'edit',
		} );

		// The Site Title's editable element is nested within the block
		// wrapper, unlike e.g. a paragraph, where they are the same
		// element.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Site title text' } )
			.click();
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'a' );

		await expect
			.poll( () => editor.getBlocks() )
			.toMatchObject( [
				{ name: 'core/site-title' },
				{ name: 'core/paragraph', attributes: { content: 'a' } },
				{ name: 'core/site-tagline' },
			] );
	} );
} );
