const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Activates a theme, retrying on the transient "socket hang up"
 * (ECONNRESET) connection error that intermittently occurs in CI.
 *
 * See https://github.com/WordPress/gutenberg/issues/74483.
 *
 * @param {Object} requestUtils Playwright request utils.
 * @param {string} themeSlug    Theme slug to activate.
 */
async function activateThemeWithRetry( requestUtils, themeSlug ) {
	const maxAttempts = 3;
	for ( let attempt = 1; attempt <= maxAttempts; attempt++ ) {
		try {
			await requestUtils.activateTheme( themeSlug );
			return;
		} catch ( error ) {
			const isTransient = /socket hang up|ECONNRESET/i.test(
				error?.message ?? ''
			);
			if ( ! isTransient || attempt === maxAttempts ) {
				throw error;
			}
		}
	}
}

// Creating the page through the UI differs between the classic and the
// extensible site editor (a naming dialog vs. a full "Add Page" editor
// screen), and is not what these tests cover, so create it via REST and open
// it in the editor directly.
async function draftNewPage( admin, requestUtils ) {
	const testPage = await requestUtils.createPage( {
		title: 'Test Page',
		status: 'draft',
	} );
	await admin.visitSiteEditor( {
		postId: testPage.id,
		postType: 'page',
		canvas: 'edit',
	} );
}

async function addPageContent( editor, page ) {
	await editor.canvas
		.getByRole( 'document', {
			name: 'Block: Content',
		} )
		.getByRole( 'document', {
			name: 'Add default block',
		} )
		.click();

	// Insert into Page Content using default block.
	await editor.canvas
		.getByRole( 'document', {
			name: 'Empty block; start writing or type forward slash to choose a block',
		} )
		.fill( 'Lorem ipsum dolor sit amet' );

	// Insert into Page Content using global inserter.
	await page
		.getByRole( 'button', { name: 'Block Inserter', exact: true } )
		.click();
	await page.getByRole( 'option', { name: 'Heading', exact: true } ).click();
	await editor.canvas
		.getByRole( 'document', {
			name: 'Block: Heading',
		} )
		.fill( 'A sweet heading 1' );

	// Add some regular content blocks.
	await page.keyboard.press( 'Enter' );
	await editor.insertBlock( { name: 'core/paragraph' } );
	await page.keyboard.type( 'A sweet paragraph 1' );
	await page.keyboard.press( 'Enter' );
	await editor.insertBlock( { name: 'core/paragraph' } );
	await page.keyboard.type( 'A sweet paragraph 2' );

	// Insert into Page Content using appender.
	await page
		.getByRole( 'region', { name: 'Editor footer' } )
		.getByRole( 'button', { name: 'Content' } )
		.click();
	await editor.canvas.getByRole( 'button', { name: 'Add block' } ).click();
	await page.getByPlaceholder( 'Search' ).fill( 'list' );
	await page.getByRole( 'option', { name: 'List', exact: true } ).click();
	await page.keyboard.type( 'Sweet list 1' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( 'Sweet list 2' );
}

test.describe( 'Pages', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await activateThemeWithRetry( requestUtils, 'emptytheme' );
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

	test.afterAll( async ( { requestUtils } ) => {
		await activateThemeWithRetry( requestUtils, 'twentytwentyone' );
		await Promise.all( [
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllPages(),
		] );
	} );

	test.skip( 'create a new page, edit template and toggle page template preview', async ( {
		admin,
		page,
		editor,
		requestUtils,
	} ) => {
		// Set up
		await draftNewPage( admin, requestUtils );
		await addPageContent( editor, page );
		await editor.openDocumentSettingsSidebar();

		// Switch to template editing focus.
		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await editorSettings.getByRole( 'tab', { name: 'Page' } ).click();
		await editorSettings
			.getByRole( 'button', { name: 'Template options' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Edit template' } ).click();
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Content',
			} )
		).toContainText(
			'This is the Content block, it will display all the blocks in any single post or page.'
		);
		await expect(
			page.locator(
				'role=button[name="Dismiss this notice"i] >> text="Editing template. Changes made here affect all posts and pages that use the template."'
			)
		).toBeVisible();

		// Edit blocks that are in the template.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Title' } )
			.click();
		await page
			.getByRole( 'button', { name: 'Move down', exact: true } )
			.click();

		await editor.canvas
			.getByRole( 'textbox', { name: 'Site title text' } )
			.click( { force: true } );
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
				'role=region[name="Editor publish"] >> role=checkbox[name="Title"]'
			)
		).toBeVisible();
		await expect(
			page.locator(
				'role=region[name="Editor publish"] >> role=checkbox[name="Test Page"]'
			)
		).toBeVisible();
		await page
			.getByRole( 'button', { name: 'Cancel', exact: true } )
			.click();

		/*
		 * Test toggling preview mode.
		 */
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: header',
			} )
		).toBeVisible();
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Content',
			} )
		).toBeVisible();

		// Ensure order is preserved between toggling.
		await page
			.locator(
				'[aria-label="Block: Content"] + [aria-label="Block: Title"]'
			)
			.isVisible();

		await editor.openDocumentSettingsSidebar();
		// Toggle template preview to "off".
		const templateOptionsButton = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Template options' } );
		await templateOptionsButton.click();
		const templatePreviewButton = page
			.getByRole( 'menu', { name: 'Template options' } )
			.getByRole( 'menuitemcheckbox', { name: 'Show template' } );

		await expect( templatePreviewButton ).toHaveAttribute(
			'aria-checked',
			'true'
		);
		await templatePreviewButton.click();
		await expect( templatePreviewButton ).toHaveAttribute(
			'aria-checked',
			'false'
		);

		// Header template area should be hidden.
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: header',
			} )
		).toBeHidden();

		// Ensure post title component to be visible.
		await expect(
			editor.canvas.getByRole( 'textbox', {
				name: 'Add Title',
			} )
		).toBeVisible();

		// Remove focus from templateOptionsButton button.
		await editor.canvas.locator( 'body' ).click();

		// Toggle template preview to "on".
		await templateOptionsButton.click();
		await templatePreviewButton.click();
		await expect( templatePreviewButton ).toHaveAttribute(
			'aria-checked',
			'true'
		);

		// Header template area and page content are once again visible.
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: header',
			} )
		).toBeVisible();
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Title',
			} )
		).toBeVisible();
	} );

	test( 'the writing prompt in an empty content block responds to the first click', async ( {
		admin,
		page,
		editor,
		requestUtils,
	} ) => {
		await draftNewPage( admin, requestUtils );

		// Show the template so the Content block wraps the writing prompt.
		await editor.openDocumentSettingsSidebar();
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Template options' } )
			.click();
		await page
			.getByRole( 'menu', { name: 'Template options' } )
			.getByRole( 'menuitemcheckbox', { name: 'Show template' } )
			.click();
		await page.keyboard.press( 'Escape' );

		const contentBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Content',
		} );

		// A single click on the prompt inserts a paragraph and moves the
		// caret into it; no click to select the Content block is needed.
		await contentBlock
			.getByRole( 'document', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'Typed after one click' );

		await expect(
			contentBlock.getByRole( 'document', {
				name: 'Block: Paragraph',
			} )
		).toHaveText( 'Typed after one click' );
	} );

	test( 'swap template and reset to default', async ( {
		admin,
		page,
		editor,
		requestUtils,
	} ) => {
		// Create a custom template first.
		const templateName = 'demo';
		await admin.visitSiteEditor( { postType: 'wp_template' } );
		await page.getByRole( 'button', { name: 'Add template' } ).click();
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
		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: true,
		} );
		await admin.visitSiteEditor();

		// Create new page that has the default template so as to swap it.
		await draftNewPage( admin, requestUtils );
		await editor.openDocumentSettingsSidebar();
		const templateOptionsButton = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Template options' } );
		await expect( templateOptionsButton ).toHaveText( 'Single Entries' );
		await templateOptionsButton.click();
		await page
			.getByRole( 'menu', { name: 'Template options' } )
			.getByText( 'Change template' )
			.click();
		const templateItem = page.locator(
			'.block-editor-block-patterns-list__item-title'
		);
		// Empty theme's custom template with `postTypes: ['post']`, should not be suggested.
		await expect( templateItem ).toHaveCount( 1 );
		await templateItem.click();
		await expect( templateOptionsButton ).toHaveText( 'demo' );
		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: true,
		} );

		// Now reset, and apply the default template back.
		await templateOptionsButton.click();
		const resetButton = page
			.getByRole( 'menu', { name: 'Template options' } )
			.getByText( 'Use default template' );
		await expect( resetButton ).toBeVisible();
		await resetButton.click();
		await expect( templateOptionsButton ).toHaveText( 'Single Entries' );
	} );

	test( 'change template options should respect the declared `postTypes`', async ( {
		admin,
		page,
		editor,
		requestUtils,
	} ) => {
		await draftNewPage( admin, requestUtils );
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
				.getByText( 'Change template' )
		).toBeDisabled();
	} );

	// Regression test for https://github.com/WordPress/gutenberg/issues/73820
	test( 'should allow setting page order to zero and negative values', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		// Create a published page for testing
		await requestUtils.createPage( {
			title: 'Order Test Page',
			status: 'publish',
		} );

		await admin.visitSiteEditor( { postType: 'page' } );

		// Switch to table layout to access actions
		await page.getByRole( 'button', { name: 'Layout' } ).click();
		await page.getByRole( 'menuitemradio', { name: 'Table' } ).click();

		// Open actions menu for the test page
		let row = page.getByRole( 'row', { name: /Order Test Page/ } );
		await row.getByRole( 'button', { name: 'Actions' } ).click();

		// Click on Order action
		await page.getByRole( 'menuitem', { name: 'Order' } ).click();

		// Get the order input and save button
		let orderInput = page.getByRole( 'spinbutton', { name: 'Order' } );
		const saveButton = page.getByRole( 'button', { name: 'Save' } );

		// Test that 0 is valid
		await orderInput.fill( '0' );
		await expect( saveButton ).toBeEnabled();

		// Test that negative values are valid
		await orderInput.fill( '-1' );
		await expect( saveButton ).toBeEnabled();

		await orderInput.fill( '-100' );
		await expect( saveButton ).toBeEnabled();

		// Test that positive values are still valid
		await orderInput.fill( '5' );
		await expect( saveButton ).toBeEnabled();

		// Save with a negative value to verify it persists
		await orderInput.fill( '-5' );
		await saveButton.click();

		// Verify success notice
		await expect(
			page.locator(
				'role=button[name="Dismiss this notice"i] >> text="Order updated."'
			)
		).toBeVisible();

		// Reload the page to verify the value persisted
		await admin.visitSiteEditor( { postType: 'page' } );
		await page.getByRole( 'button', { name: 'Layout' } ).click();
		await page.getByRole( 'menuitemradio', { name: 'Table' } ).click();

		// Open Order action again for the same page
		row = page.getByRole( 'row', { name: /Order Test Page/ } );
		await row.getByRole( 'button', { name: 'Actions' } ).click();
		await page.getByRole( 'menuitem', { name: 'Order' } ).click();

		// Verify the negative value was persisted
		orderInput = page.getByRole( 'spinbutton', { name: 'Order' } );
		await expect( orderInput ).toHaveValue( '-5' );
	} );
} );
