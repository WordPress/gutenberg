/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Template Part', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'can create template parts via the block placeholder start blank option', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//header',
			postType: 'wp_template_part',
		} );
		await editor.canvas.click( 'body' );

		// Insert a new template block and 'start blank'.
		await editor.insertBlock( { name: 'core/template-part' } );
		await editor.canvas.click( 'role=button[name="Start blank"i]' );

		// Fill in a name in the dialog that pops up.
		await page.type( 'role=dialog >> role=textbox[name="Name"i]', 'New' );
		await page.keyboard.press( 'Enter' );

		// The template part should be visible with a block appender.
		const templatePart = editor.canvas.locator(
			'[data-type="core/template-part"]'
		);
		const addBlockButton = templatePart.locator(
			'role=button[name="Add block"i]'
		);
		await expect( templatePart ).toBeVisible();
		await expect( addBlockButton ).toBeVisible();
	} );

	test( 'can create template parts via the block placeholder choose existing option', async ( {
		admin,
		editor,
		page,
	} ) => {
		// Visit the index.
		await admin.visitSiteEditor();
		await editor.canvas.click( 'body' );
		const headerTemplateParts = editor.canvas.locator(
			'[data-type="core/template-part"]'
		);

		// There should be 1 template part already in the index template.
		await expect( headerTemplateParts ).toHaveCount( 1 );

		// Insert a new template block and choose an existing header pattern.
		await editor.insertBlock( { name: 'core/template-part' } );
		await editor.canvas.click( 'role=button[name="Choose"i]' );
		await page.click(
			'role=listbox[name="Block Patterns"i] >> role=option[name="header"i]'
		);

		// There are now two header template parts.
		await expect( headerTemplateParts ).toHaveCount( 2 );
	} );

	test( 'can convert a single block to a template part', async ( {
		admin,
		editor,
		page,
	} ) => {
		const paragraphText = 'Test 2';

		await admin.visitSiteEditor();
		await editor.canvas.click( 'body' );
		// Add a block and select it.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: paragraphText,
			},
		} );
		const paragraphBlock = editor.canvas.locator(
			`p >> text="${ paragraphText }"`
		);
		await editor.selectBlocks( paragraphBlock );

		// Convert block to a template part.
		await editor.clickBlockOptionsMenuItem( 'Create Template part' );
		await page.type( 'role=dialog >> role=textbox[name="Name"i]', 'Test' );
		await page.keyboard.press( 'Enter' );

		await page.waitForSelector(
			'role=button >> text="Template part created."'
		);

		// Check that the header contains the paragraph added earlier.
		const templatePartWithParagraph = editor.canvas.locator(
			'[data-type="core/template-part"]',
			{ has: paragraphBlock }
		);

		await expect( templatePartWithParagraph ).toBeVisible();
	} );

	test( 'can convert multiple blocks to a template part', async ( {
		admin,
		editor,
		page,
	} ) => {
		const paragraphText1 = 'Test 3';
		const paragraphText2 = 'Test 4';

		await admin.visitSiteEditor();
		await editor.canvas.click( 'body' );
		// Add a block and select it.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: paragraphText1,
			},
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: paragraphText2,
			},
		} );
		const paragraphBlock1 = editor.canvas.locator(
			`p >> text="${ paragraphText1 }"`
		);
		const paragraphBlock2 = editor.canvas.locator(
			`p >> text="${ paragraphText2 }"`
		);

		await editor.selectBlocks( paragraphBlock1, paragraphBlock2 );

		// Convert block to a template part.
		await editor.clickBlockOptionsMenuItem( 'Create template part' );
		await page.type( 'role=dialog >> role=textbox[name="Name"i]', 'Test' );
		await page.keyboard.press( 'Enter' );

		await page.waitForSelector(
			'role=button >> text="Template part created."'
		);

		// Check that the header contains the paragraph added earlier.
		const templatePartWithParagraph1 = editor.canvas.locator(
			'[data-type="core/template-part"]',
			{ has: paragraphBlock1 }
		);
		const templatePartWithParagraph2 = editor.canvas.locator(
			'[data-type="core/template-part"]',
			{ has: paragraphBlock2 }
		);

		// TODO: I couldn't find an easy way to assert that the same template
		// part locator contains both paragraphs. It'd be nice to improve this.
		await expect( templatePartWithParagraph1 ).toBeVisible();
		await expect( templatePartWithParagraph2 ).toBeVisible();
		await expect( templatePartWithParagraph1 ).toHaveText(
			`${ paragraphText1 }${ paragraphText2 }`
		);
	} );

	test( 'can detach blocks from a template part', async ( {
		admin,
		editor,
	} ) => {
		const paragraphText = 'Test 3';

		// Edit the header and save the changes.
		await admin.visitSiteEditor( {
			postId: 'emptytheme//header',
			postType: 'wp_template_part',
		} );
		await editor.canvas.click( 'body' );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: paragraphText,
			},
		} );
		await editor.saveSiteEditorEntities();

		// Visit the index.
		await admin.visitSiteEditor();
		await editor.canvas.click( 'body' );
		// Check that the header contains the paragraph added earlier.
		const paragraph = editor.canvas.locator(
			`p >> text="${ paragraphText }"`
		);
		const templatePartWithParagraph = editor.canvas.locator(
			'[data-type="core/template-part"]',
			{ has: paragraph }
		);
		await expect( templatePartWithParagraph ).toBeVisible();

		// Detach the paragraph from the header template part.
		await editor.selectBlocks( templatePartWithParagraph );
		await editor.clickBlockOptionsMenuItem(
			'Detach blocks from template part'
		);

		// There should be a paragraph but no header template part.
		await expect( paragraph ).toBeVisible();
		await expect( templatePartWithParagraph ).not.toBeVisible();
	} );

	test( 'shows changes in a template when a template part it contains is modified', async ( {
		admin,
		editor,
	} ) => {
		const paragraphText = 'Test 1';

		await admin.visitSiteEditor( {
			postId: 'emptytheme//header',
			postType: 'wp_template_part',
		} );
		await editor.canvas.click( 'body' );
		// Edit the header.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: paragraphText,
			},
		} );

		await editor.saveSiteEditorEntities();

		// Visit the index.
		await admin.visitSiteEditor();
		await editor.canvas.click( 'body' );
		const paragraph = editor.canvas.locator(
			`p >> text="${ paragraphText }"`
		);

		await expect( paragraph ).toBeVisible();
	} );

	// Tests for regressions of https://github.com/WordPress/gutenberg/pull/29239.
	test( "doesn't throw a block error when clicking on a link", async ( {
		admin,
		editor,
		page,
	} ) => {
		const paragraphText = 'Test 4';

		await admin.visitSiteEditor( {
			postId: 'emptytheme//header',
			postType: 'wp_template_part',
		} );
		await editor.canvas.click( 'body' );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: paragraphText,
			},
		} );

		// Select the paragraph block.
		const paragraph = editor.canvas.locator(
			`p >> text="${ paragraphText }"`
		);

		// Highlight all the text in the paragraph block.
		await paragraph.click( { clickCount: 3 } );

		// Click the convert to link toolbar button.
		await editor.clickBlockToolbarButton( 'Link' );

		// Enter url for link.
		await page.keyboard.type( 'https://google.com' );
		await page.keyboard.press( 'Enter' );

		// Verify that there is no error.
		const paragraphLink = editor.canvas.locator(
			`p >> a >> text="${ paragraphText }"`
		);
		await paragraphLink.click( 'p[data-type="core/paragraph"] a' );

		await expect( paragraph ).toBeVisible();
	} );

	test( 'can import a widget area into an empty template part', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.visitSiteEditor();
		await editor.canvas.click( 'body' );

		// Add a block and select it.
		await editor.insertBlock( {
			name: 'core/template-part',
		} );

		// Open Block Inspector -> Advanced.
		await editor.openDocumentSettingsSidebar();
		await page.getByRole( 'button', { name: 'Advanced' } ).click();

		// Import the widget area.
		await page
			.getByRole( 'combobox', { name: 'Import widget area' } )
			.selectOption( 'sidebar-1' );
		await page.getByRole( 'button', { name: 'Import' } ).click();

		// Verify that the widget area was imported.
		await expect(
			editor.canvas.locator( '[data-type="core/search"]' )
		).toBeVisible();
		await expect(
			editor.canvas.locator( '[data-type="core/latest-posts"]' )
		).toBeVisible();
		await expect(
			editor.canvas.locator( '[data-type="core/latest-comments"]' )
		).toBeVisible();
		await expect(
			editor.canvas.locator( '[data-type="core/archives"]' )
		).toBeVisible();
		await expect(
			editor.canvas.locator( '[data-type="core/categories"]' )
		).toBeVisible();
	} );

	test( 'can not import a widget area into a non-empty template part', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.visitSiteEditor();
		await editor.canvas.click( 'body' );

		// Select existing header template part.
		await editor.selectBlocks(
			editor.canvas.locator( '[data-type="core/template-part"]' )
		);

		// Go to Block Inspector -> Advanced.
		await editor.openDocumentSettingsSidebar();
		await page.getByRole( 'button', { name: 'Advanced' } ).click();

		// Verify that the widget area import button is not there.
		await expect(
			page.getByRole( 'combobox', { name: 'Import widget area' } )
		).not.toBeVisible();
	} );

	test( 'Keeps focus in place on undo in template parts', async ( {
		admin,
		editor,
		page,
		pageUtils,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//header',
			postType: 'wp_template_part',
		} );
		await editor.canvas.click( 'body' );

		// Select the site title block.
		const siteTitle = editor.canvas.getByRole( 'document', {
			name: 'Site title',
		} );
		await editor.selectBlocks( siteTitle );

		// Remove the default site title block.
		await pageUtils.pressKeys( 'access+z' );

		// Insert a group block with a Site Title block inside.
		await editor.insertBlock( {
			name: 'core/group',
			innerBlocks: [ { name: 'core/site-title' } ],
		} );

		// Select the Site Title block inside the group.
		const siteTitleInGroup = editor.canvas.getByRole( 'document', {
			name: 'Site title',
		} );
		await editor.selectBlocks( siteTitleInGroup );

		// Change heading level of the Site Title block.
		await editor.clickBlockToolbarButton( 'Change level' );
		const Heading3Button = page.getByRole( 'menuitemradio', {
			name: 'Heading 3',
		} );
		await Heading3Button.click();

		// Undo the change.
		await pageUtils.pressKeys( 'primary+z' );

		await expect(
			page.locator( 'role=button[name="Change level"i]' )
		).toBeFocused();
	} );
} );
