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
			canvas: 'edit',
		} );

		// Insert a new template block and 'start blank'.
		await editor.insertBlock( { name: 'core/template-part' } );
		await editor.canvas
			.locator( 'role=button[name="Start blank"i]' )
			.click();

		// Fill in a name in the dialog that pops up.
		await page
			.getByRole( 'dialog' )
			.getByRole( 'textbox', { name: 'Name' } )
			.type( 'New' );
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
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
		const headerTemplateParts = editor.canvas.locator(
			'[data-type="core/template-part"]'
		);

		// There should be 1 template part already in the index template.
		await expect( headerTemplateParts ).toHaveCount( 1 );

		// Insert a new template block and choose an existing header pattern.
		await editor.insertBlock( { name: 'core/template-part' } );
		await editor.canvas.locator( 'role=button[name="Choose"i]' ).click();
		await page
			.getByRole( 'listbox', { name: 'Patterns' } )
			.getByRole( 'option', { name: 'header' } )
			.click();

		// There are now two header template parts.
		await expect( headerTemplateParts ).toHaveCount( 2 );
	} );

	test( 'can convert a single block to a template part', async ( {
		admin,
		editor,
		page,
	} ) => {
		const paragraphText = 'Test 2';

		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
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
		await page
			.getByRole( 'dialog' )
			.getByRole( 'textbox', { name: 'Name' } )
			.type( 'Test' );
		await page.keyboard.press( 'Enter' );

		await page.waitForSelector(
			'role=button >> text="Template part created."'
		);

		// Check that the header contains the paragraph added earlier.
		const templatePartWithParagraph = editor.canvas.locator(
			'[data-type="core/template-part"]',
			{ hasText: paragraphText }
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

		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
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
		await page
			.getByRole( 'dialog' )
			.getByRole( 'textbox', { name: 'Name' } )
			.type( 'Test' );
		await page.keyboard.press( 'Enter' );

		await page.waitForSelector(
			'role=button >> text="Template part created."'
		);

		// Check that the header contains the paragraph added earlier.
		const templatePartWithParagraph1 = editor.canvas.locator(
			'[data-type="core/template-part"]',
			{ hasText: paragraphText1 }
		);
		const templatePartWithParagraph2 = editor.canvas.locator(
			'[data-type="core/template-part"]',
			{ hasText: paragraphText2 }
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
		page,
	} ) => {
		const paragraphText = 'Test 3';

		// Edit the header and save the changes.
		await admin.visitSiteEditor( {
			postId: 'emptytheme//header',
			postType: 'wp_template_part',
			canvas: 'edit',
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: paragraphText,
			},
		} );
		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: true,
		} );

		// Visit the index.
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
		// Check that the header contains the paragraph added earlier.
		const paragraph = editor.canvas.locator(
			`p >> text="${ paragraphText }"`
		);
		const templatePartWithParagraph = editor.canvas.locator(
			'[data-type="core/template-part"]',
			{ hasText: paragraphText }
		);
		await expect( templatePartWithParagraph ).toBeVisible();

		// Detach the paragraph from the header template part.
		await editor.selectBlocks( templatePartWithParagraph );
		await editor.clickBlockOptionsMenuItem( 'Detach' );
		await page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Detach' } )
			.click();

		// There should be a paragraph but no header template part.
		await expect( paragraph ).toBeVisible();
		await expect( templatePartWithParagraph ).toBeHidden();
	} );

	test( 'shows the source block for a pattern wrapper in focus mode', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const templatePart = await requestUtils.createTemplate(
			'wp_template_part',
			{
				slug: 'pattern-header',
				title: 'Pattern Header',
				content: `<!-- wp:group {"metadata":{"patternName":"theme/header-wrapper","name":"Header"},"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>Template part content</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->`,
			}
		);

		await admin.visitSiteEditor( {
			postId: templatePart.id,
			postType: 'wp_template_part',
			canvas: 'edit',
		} );

		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Group' } )
		);
		await editor.openDocumentSettingsSidebar();

		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		const blockHeading = editorSettings
			.getByRole( 'tabpanel', { name: 'Block' } )
			.getByRole( 'heading' )
			.first();

		await expect( blockHeading ).toHaveAccessibleName( 'Header Group' );
	} );

	test( 'shows changes in a template when a template part it contains is modified', async ( {
		admin,
		editor,
	} ) => {
		const paragraphText = 'Test 1';

		await admin.visitSiteEditor( {
			postId: 'emptytheme//header',
			postType: 'wp_template_part',
			canvas: 'edit',
		} );
		// Edit the header.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: paragraphText,
			},
		} );

		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: true,
		} );

		// Visit the index.
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
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
			canvas: 'edit',
		} );
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

	test( 'can update and save the template part area @webkit', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
		await editor.selectBlocks(
			editor.canvas.locator( '[data-type="core/template-part"]' )
		);
		await editor.openDocumentSettingsSidebar();
		await page
			.getByRole( 'tab', { name: 'Settings', exact: true } )
			.click();
		await page
			.getByRole( 'button', { name: 'Advanced', exact: true } )
			.click();

		const area = page.getByRole( 'combobox', {
			name: 'Area',
			exact: true,
		} );
		await area.click();
		await page
			.getByRole( 'option', { name: 'Footer', exact: true } )
			.click();
		await expect( area ).toHaveText( 'Footer' );
		await expect( area ).toBeFocused();

		// Dismissing the popup must not change the selected area.
		await area.press( 'ArrowDown' );
		await expect( page.getByRole( 'listbox' ) ).toBeVisible();
		await page.keyboard.press( 'Home' );
		await page.keyboard.press( 'Escape' );
		await expect( area ).toHaveText( 'Footer' );
		await expect( area ).toBeFocused();

		await editor.saveSiteEditorEntities();
		await expect
			.poll( async () => {
				const templatePart = await requestUtils.rest( {
					path: '/wp/v2/template-parts/emptytheme//header',
				} );
				return templatePart.area;
			} )
			.toBe( 'footer' );
	} );

	test( 'can select, clear, and import a widget area @webkit', async ( {
		admin,
		editor,
		page,
		pageUtils,
		requestUtils,
	} ) => {
		await page.route( '**/wp/v2/sidebars?*', ( route ) =>
			route.fulfill( {
				json: [
					{
						id: 'migration-widgets',
						name: 'Migration widgets',
						widgets: [ 'block-1' ],
					},
					{ id: 'empty-sidebar', name: 'Empty sidebar', widgets: [] },
					{
						id: 'wp_inactive_widgets',
						name: 'Inactive widgets',
						widgets: [ 'block-2' ],
					},
				],
			} )
		);
		await page.route( '**/wp/v2/widgets?*', ( route ) =>
			route.fulfill( {
				json: [
					{
						id: 'block-1',
						id_base: 'block',
						sidebar: 'migration-widgets',
						instance: {
							raw: {
								content:
									'<!-- wp:paragraph --><p>Imported widget content</p><!-- /wp:paragraph -->',
							},
						},
					},
				],
			} )
		);
		await requestUtils.createTemplate( 'wp_template_part', {
			slug: 'import-target',
			title: 'Import target',
			content: '',
		} );
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
		await pageUtils.pressKeys( 'primary+k' );
		await page
			.getByRole( 'combobox', { name: 'Search commands and settings' } )
			.fill( 'editing all patterns' );
		await page
			.getByRole( 'option', { name: 'Enable editing all patterns' } )
			.click();
		await editor.insertBlock( {
			name: 'core/template-part',
			attributes: { slug: 'import-target', theme: 'emptytheme' },
		} );
		await editor.canvas
			.locator( '[data-type="core/template-part"]' )
			.last()
			.scrollIntoViewIfNeeded();
		await editor.openDocumentSettingsSidebar();
		await page
			.getByRole( 'button', { name: 'Advanced', exact: true } )
			.click();

		const widgetArea = page.getByRole( 'combobox', {
			name: 'Import widget area',
		} );
		const importButton = page.getByRole( 'button', {
			name: 'Import',
			exact: true,
		} );
		await expect( widgetArea ).toHaveText( 'Select widget area' );
		await expect( importButton ).toBeDisabled();
		await widgetArea.click();
		await expect(
			page.getByRole( 'option', { name: 'Empty sidebar' } )
		).toHaveCount( 0 );
		await expect(
			page.getByRole( 'option', { name: 'Inactive widgets' } )
		).toHaveCount( 0 );
		await page
			.getByRole( 'option', { name: 'Migration widgets', exact: true } )
			.click();
		await expect( importButton ).toBeEnabled();
		await widgetArea.click();
		await page
			.getByRole( 'option', { name: 'Select widget area', exact: true } )
			.click();
		await expect( widgetArea ).toHaveText( 'Select widget area' );
		await expect( importButton ).toBeDisabled();

		await widgetArea.focus();
		await page.keyboard.press( 'ArrowDown' );
		await expect( widgetArea ).toHaveAttribute( 'aria-expanded', 'true' );
		await expect( page.getByRole( 'listbox' ) ).toBeVisible();
		await page.keyboard.press( 'End' );
		await expect(
			page.getByRole( 'option', {
				name: 'Migration widgets',
				exact: true,
			} )
		).toHaveAttribute( 'data-highlighted' );
		await page.keyboard.press( 'Enter' );
		await expect( widgetArea ).toHaveText( 'Migration widgets' );
		await expect( widgetArea ).toBeFocused();
		await importButton.click();
		await expect(
			editor.canvas.getByText( 'Imported widget content', {
				exact: true,
			} )
		).toBeVisible();
		await expect( widgetArea ).toBeHidden();
		const templateParts = await requestUtils.rest( {
			path: '/wp/v2/template-parts?context=edit',
		} );
		expect( templateParts ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					title: expect.objectContaining( {
						raw: 'Widget area: Migration widgets',
					} ),
					content: expect.objectContaining( {
						raw: expect.stringContaining(
							'Imported widget content'
						),
					} ),
				} ),
			] )
		);
	} );

	test( 'hides widget import while loading and when no importable areas exist', async ( {
		admin,
		editor,
		page,
		pageUtils,
		requestUtils,
	} ) => {
		let releaseSidebars;
		const sidebarsReady = new Promise( ( resolve ) => {
			releaseSidebars = resolve;
		} );
		await page.route( '**/wp/v2/sidebars?*', async ( route ) => {
			await sidebarsReady;
			await route.fulfill( {
				json: [
					{ id: 'empty-sidebar', name: 'Empty sidebar', widgets: [] },
					{
						id: 'wp_inactive_widgets',
						name: 'Inactive widgets',
						widgets: [ 'block-1' ],
					},
				],
			} );
		} );
		await requestUtils.createTemplate( 'wp_template_part', {
			slug: 'loading-target',
			title: 'Loading target',
			content: '',
		} );
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
		await pageUtils.pressKeys( 'primary+k' );
		await page
			.getByRole( 'combobox', { name: 'Search commands and settings' } )
			.fill( 'editing all patterns' );
		await page
			.getByRole( 'option', { name: 'Enable editing all patterns' } )
			.click();
		await editor.insertBlock( {
			name: 'core/template-part',
			attributes: { slug: 'loading-target', theme: 'emptytheme' },
		} );
		await editor.canvas
			.locator( '[data-type="core/template-part"]' )
			.last()
			.scrollIntoViewIfNeeded();
		await editor.openDocumentSettingsSidebar();
		await page
			.getByRole( 'button', { name: 'Advanced', exact: true } )
			.click();
		const widgetArea = page.getByRole( 'combobox', {
			name: 'Import widget area',
		} );
		const importButton = page.getByRole( 'button', {
			name: 'Import',
			exact: true,
		} );
		await expect( widgetArea ).toBeHidden();
		await expect( importButton ).toBeHidden();
		const response = page.waitForResponse( '**/wp/v2/sidebars?*' );
		releaseSidebars();
		await response;
		await page.waitForFunction( () =>
			window.wp.data
				.select( 'core' )
				.hasFinishedResolution( 'getSidebars', [
					{
						per_page: -1,
						_fields: 'id,name,description,status,widgets',
					},
				] )
		);
		await expect( widgetArea ).toBeHidden();
		await expect( importButton ).toBeHidden();
	} );

	test( 'can not import a widget area into a non-empty template part', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		// Select existing header template part.
		await editor.selectBlocks(
			editor.canvas.locator( '[data-type="core/template-part"]' )
		);

		// Go to Block Inspector -> Advanced.
		await editor.openDocumentSettingsSidebar();
		await page.getByRole( 'tab', { name: 'Settings' } ).click();
		await page.getByRole( 'button', { name: 'Advanced' } ).click();

		// Verify that the widget area import button is not there.
		await expect(
			page.getByRole( 'combobox', { name: 'Import widget area' } )
		).toBeHidden();
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
			canvas: 'edit',
		} );

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
			innerBlocks: [
				{ name: 'core/paragraph', attributes: { content: 'Hello' } },
				{ name: 'core/site-title' },
			],
		} );

		// Type within a first block.
		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Paragraph',
		} );
		await editor.selectBlocks( paragraph );
		await page.keyboard.type( 'Modify' );

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

		await expect( siteTitleInGroup ).toHaveClass( /is-selected/ );
	} );
} );
