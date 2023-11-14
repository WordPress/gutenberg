/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function draftNewPage( page ) {
	await page.getByRole( 'button', { name: 'Pages' } ).click();
	await page.getByRole( 'button', { name: 'Draft a new page' } ).click();
	await page
		.locator( 'role=dialog[name="Draft a new page"i]' )
		.locator( 'role=textbox[name="Page title"i]' )
		.fill( 'Test Page' );
	await page.keyboard.press( 'Enter' );
	await expect(
		page.locator(
			`role=button[name="Dismiss this notice"i] >> text='"Test Page" successfully created.'`
		)
	).toBeVisible();
}

test.describe( 'Pages', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await Promise.all( [
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllPages(),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await Promise.all( [
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllPages(),
		] );
	} );

	test.beforeEach( async ( { requestUtils, admin } ) => {
		await Promise.all( [
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllPages(),
		] );
		await admin.visitSiteEditor();
	} );

	test( 'create a new page', async ( { page, editor } ) => {
		await draftNewPage( page );

		// Insert into Page Content using default block.
		await editor.canvas
			.getByRole( 'document', {
				name: 'Empty block; start writing or type forward slash to choose a block',
			} )
			.fill( 'Lorem ipsum dolor sit amet' );

		// Insert into Page Content using global inserter.
		await page
			.getByRole( 'button', { name: 'Toggle block inserter' } )
			.click();
		await page
			.getByRole( 'option', { name: 'Heading', exact: true } )
			.click();
		await editor.canvas
			.getByRole( 'document', {
				name: 'Block: Heading',
			} )
			.fill( 'Lorem ipsum' );

		// Insert into Page Content using appender.
		await page
			.getByRole( 'region', { name: 'Editor footer' } )
			.getByRole( 'button', { name: 'Content' } )
			.click();
		await editor.canvas
			.getByRole( 'button', { name: 'Add block' } )
			.click();
		await page.getByPlaceholder( 'Search' ).fill( 'list' );
		await page.getByRole( 'option', { name: 'List', exact: true } ).click();
		await page.keyboard.type( 'Lorem ipsum' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Dolor sit amet' );

		// Selecting a block in the template should display a notice.
		await editor.canvas
			.getByRole( 'document', {
				name: 'Block: Site Title',
			} )
			.click( { force: true } );
		await expect(
			page.locator(
				'role=button[name="Dismiss this notice"i] >> text="Edit your template to edit this block."'
			)
		).toBeVisible();

		// Switch to template editing focus.
		await editor.openDocumentSettingsSidebar();
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Template options' } )
			.click();
		await page.getByRole( 'button', { name: 'Edit template' } ).click();
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Content',
			} )
		).toContainText(
			'This is the Content block, it will display all the blocks in any single post or page.'
		);
		await expect(
			page.locator(
				'role=button[name="Dismiss this notice"i] >> text="You are editing a template."'
			)
		).toBeVisible();

		// Edit a block that's in the template.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Site title text' } )
			.fill( 'New Site Title' );

		// Go back to page editing focus.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Back' } )
			.click();

		// Site Title and Page entities should have been modified.
		await page.getByRole( 'button', { name: 'Save', exact: true } ).click();
		await expect(
			page.locator(
				'role=region[name="Save panel"] >> role=checkbox[name="Title"]'
			)
		).toBeVisible();
		await expect(
			page.locator(
				'role=region[name="Save panel"] >> role=checkbox[name="Test Page"]'
			)
		).toBeVisible();
	} );

	test( 'toggle template preview', async ( { page, editor } ) => {
		await draftNewPage( page );
		await editor.openDocumentSettingsSidebar();

		await editor.canvas
			.getByRole( 'document', {
				name: 'Block: Content',
			} )
			.getByRole( 'document', {
				name: 'Empty block; start writing or type forward slash to choose a block',
			} )
			.click();

		// Add some content to the page.
		await page.keyboard.type( 'Sweet paragraph 1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Sweet paragraph 2' );

		// Header template area and page content are visible.
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: header',
			} )
		).toBeVisible();

		const paragraphs = editor.canvas
			.getByRole( 'document', {
				name: 'Block: Content',
			} )
			.getByText( 'Sweet paragraph ' );

		await expect( paragraphs.nth( 0 ) ).toBeVisible();
		await expect( paragraphs.nth( 1 ) ).toBeVisible();
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Title',
			} )
		).toBeVisible();

		// Toggle template preview to "off".
		const templateOptionsButton = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Template options' } );
		await templateOptionsButton.click();
		const templatePreviewButton = page
			.getByRole( 'menu', { name: 'Template options' } )
			.getByRole( 'menuitem', { name: 'Template preview' } );

		await expect( templatePreviewButton ).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await templatePreviewButton.click();
		await expect( templatePreviewButton ).toHaveAttribute(
			'aria-pressed',
			'false'
		);

		// Header template area should be hidden.
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: header',
			} )
		).toBeHidden();

		// Content block is still visible and wrapped in a container.
		const paragraphsInGroup = editor.canvas
			.getByRole( 'document', {
				name: 'Block: Group',
			} )
			.getByRole( 'document', {
				name: 'Block: Content',
			} )
			.getByText( 'Sweet paragraph ' );

		await expect( paragraphsInGroup.nth( 0 ) ).toBeVisible();
		await expect( paragraphsInGroup.nth( 1 ) ).toBeVisible();
		// Check order of paragraphs.
		// Important to ensure the blocks are rendered as they are in the template.
		await expect( paragraphsInGroup.nth( 0 ) ).toHaveText(
			'Sweet paragraph 1'
		);
		await expect( paragraphsInGroup.nth( 1 ) ).toHaveText(
			'Sweet paragraph 2'
		);
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Block: Group',
				} )
				.getByRole( 'document', {
					name: 'Block: Title',
				} )
		).toBeVisible();

		// Remove focus from templateOptionsButton button.
		await editor.canvas.locator( 'body' ).click();

		// Toggle template preview to "on".
		await templateOptionsButton.click();
		await templatePreviewButton.click();
		await expect( templatePreviewButton ).toHaveAttribute(
			'aria-pressed',
			'true'
		);

		// Header template area and page content are once again visible.
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: header',
			} )
		).toBeVisible();
		await expect( paragraphs.nth( 0 ) ).toBeVisible();
		await expect( paragraphs.nth( 1 ) ).toBeVisible();
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Title',
			} )
		).toBeVisible();
	} );

	test( 'swap template and reset to default', async ( {
		admin,
		page,
		editor,
	} ) => {
		// Create a custom template first.
		const templateName = 'demo';
		await page.getByRole( 'button', { name: 'Templates' } ).click();
		await page.getByRole( 'button', { name: 'Add New Template' } ).click();
		await page
			.getByRole( 'button', {
				name: 'A custom template can be manually applied to any post or page.',
			} )
			.click();
		// Fill the template title and submit.
		const newTemplateDialog = page.locator(
			'role=dialog[name="Create custom template"i]'
		);
		const templateNameInput = newTemplateDialog.locator(
			'role=textbox[name="Name"i]'
		);
		await templateNameInput.fill( templateName );
		await page.keyboard.press( 'Enter' );
		await page
			.locator( '.block-editor-block-patterns-list__list-item' )
			.click();
		await editor.saveSiteEditorEntities();
		await admin.visitSiteEditor();

		// Create new page that has the default template so as to swap it.
		await draftNewPage( page );
		await editor.openDocumentSettingsSidebar();
		const templateOptionsButton = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Template options' } );
		await expect( templateOptionsButton ).toHaveText( 'Single Entries' );
		await templateOptionsButton.click();
		await page
			.getByRole( 'menu', { name: 'Template options' } )
			.getByText( 'Swap template' )
			.click();
		const templateItem = page.locator(
			'.block-editor-block-patterns-list__item-title'
		);
		// Empty theme's custom template with `postTypes: ['post']`, should not be suggested.
		await expect( templateItem ).toHaveCount( 1 );
		await templateItem.click();
		await expect( templateOptionsButton ).toHaveText( 'demo' );
		await editor.saveSiteEditorEntities();

		// Now reset, and apply the default template back.
		await templateOptionsButton.click();
		const resetButton = page
			.getByRole( 'menu', { name: 'Template options' } )
			.getByText( 'Use default template' );
		await expect( resetButton ).toBeVisible();
		await resetButton.click();
		await expect( templateOptionsButton ).toHaveText( 'Single Entries' );
	} );

	test( 'swap template options should respect the declared `postTypes`', async ( {
		page,
		editor,
	} ) => {
		await draftNewPage( page );
		await editor.openDocumentSettingsSidebar();
		const templateOptionsButton = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Template options' } );
		await templateOptionsButton.click();
		// Empty theme has only one custom template with `postTypes: ['post']`,
		// so it should not be suggested.
		await expect(
			page
				.getByRole( 'menu', { name: 'Template options' } )
				.getByText( 'Swap template' )
		).toHaveCount( 0 );
	} );
} );
