/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Content-only lock', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should be able to edit the content of blocks with content-only lock', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Add content only locked block in the code editor
		await pageUtils.pressKeys( 'secondary+M' ); // Emulates CTRL+Shift+Alt + M => toggle code editor

		await page.getByPlaceholder( 'Start writing with text or HTML' )
			.fill( `<!-- wp:group {"templateLock":"contentOnly","layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>Hello</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->` );

		await pageUtils.pressKeys( 'secondary+M' );
		await editor.canvas
			.locator( 'role=document[name="Block: Paragraph"i]' )
			.click();
		await page.keyboard.type( ' World' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	// See: https://github.com/WordPress/gutenberg/pull/54618
	test( 'should be able to edit the content of deeply nested blocks', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Add content only locked block in the code editor
		await pageUtils.pressKeys( 'secondary+M' ); // Emulates CTRL+Shift+Alt + M => toggle code editor

		await page.getByPlaceholder( 'Start writing with text or HTML' )
			.fill( `<!-- wp:group {"templateLock":"contentOnly","layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>Hello</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->` );

		await pageUtils.pressKeys( 'secondary+M' );
		await editor.canvas
			.locator( 'role=document[name="Block: Paragraph"i]' )
			.click();
		await page.keyboard.type( ' WP' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/group',
				attributes: {
					layout: { type: 'constrained' },
					templateLock: 'contentOnly',
				},
				innerBlocks: [
					{
						name: 'core/group',
						attributes: { layout: { type: 'constrained' } },
						innerBlocks: [
							{
								name: 'core/paragraph',
								attributes: { content: 'Hello WP' },
							},
						],
					},
				],
			},
		] );
	} );

	test( 'should be able to edit all blocks via Edit section button and exit via Exit section button', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Add content only locked block in the code editor
		await pageUtils.pressKeys( 'secondary+M' ); // Emulates CTRL+Shift+Alt + M => toggle code editor

		await page.getByPlaceholder( 'Start writing with text or HTML' )
			.fill( `<!-- wp:group {"templateLock":"contentOnly","layout":{"type":"constrained"}} -->
			<div class="wp-block-group"><!-- wp:paragraph -->
			<p>Locked block a</p>
			<!-- /wp:paragraph -->

			<!-- wp:paragraph -->
			<p>Locked block b</p>
			<!-- /wp:paragraph --></div>
			<!-- /wp:group -->

			<!-- wp:heading -->
			<h2 class="wp-block-heading"><strong>outside block</strong></h2>
			<!-- /wp:heading -->` );

		await pageUtils.pressKeys( 'secondary+M' );
		await editor.openDocumentSettingsSidebar();
		// Select the content locked block.
		await editor.canvas
			.locator( 'role=document[name="Block: Group"i]' )
			.click();
		// Click "Edit section" button to temporarily edit as blocks.
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Edit section' } )
			.click();
		// Selected a nest paragraph verify Block is not content locked
		// Styles can be changed and nested blocks can be removed
		await editor.canvas
			.locator( 'role=document[name="Block: Paragraph"i]' )
			.first()
			.click();
		await expect(
			page.locator( '.color-block-support-panel' )
		).toBeAttached();
		await editor.clickBlockOptionsMenuItem( 'Delete' );
		// Click "Exit section" button to exit edit mode
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Exit section' } )
			.click();

		// Select a locked nested paragraph block again
		await editor.canvas
			.locator( 'role=document[name="Block: Paragraph"i]' )
			.click();
		// Block is content locked again, simple styles like color cannot be changed.
		await expect(
			page.locator( '.color-block-support-panel' )
		).not.toBeAttached();
	} );

	test( 'should be able to edit all blocks via double-click and exit by clicking outside', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Add content only locked block in the code editor
		await pageUtils.pressKeys( 'secondary+M' ); // Emulates CTRL+Shift+Alt + M => toggle code editor

		await page.getByPlaceholder( 'Start writing with text or HTML' )
			.fill( `<!-- wp:group {"templateLock":"contentOnly","layout":{"type":"constrained"}} -->
			<div class="wp-block-group"><!-- wp:paragraph -->
			<p>Locked block a</p>
			<!-- /wp:paragraph -->

			<!-- wp:separator -->
			<hr class="wp-block-separator has-alpha-channel-opacity"/>
			<!-- /wp:separator -->

			<!-- wp:paragraph -->
			<p>Locked block b</p>
			<!-- /wp:paragraph --></div>
			<!-- /wp:group -->

			<!-- wp:heading -->
			<h2 class="wp-block-heading"><strong>outside block</strong></h2>
			<!-- /wp:heading -->` );

		await pageUtils.pressKeys( 'secondary+M' );
		await editor.openDocumentSettingsSidebar();
		// Double-click the separator (structural block) to enter edit mode
		const separator = editor.canvas.getByRole( 'document', {
			name: 'Block: Separator',
		} );
		await separator.dblclick( { force: true } );

		// Wait for edit mode to be entered - "Edit section" button should disappear
		await expect(
			page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Edit section' } )
		).toBeHidden();

		// Select first paragraph to verify it's not content locked
		await editor.canvas
			.locator( 'role=document[name="Block: Paragraph"i]' )
			.first()
			.click();

		// Verify Block is not content locked
		// Styles can be changed and nested blocks can be removed
		await expect(
			page.locator( '.color-block-support-panel' )
		).toBeAttached();
		await editor.clickBlockOptionsMenuItem( 'Delete' );
		// Select an outside block to exit edit mode
		await editor.canvas
			.locator( 'role=document[name="Block: Heading 2"i]' )
			.click( { force: true } );

		// Select the remaining locked paragraph block to verify we're back in content-only mode
		await editor.canvas
			.locator( 'role=document[name="Block: Paragraph"i]' )
			.click();

		// Block is content locked again simple styles like position can not be changed.
		await expect(
			page.locator( '.color-block-support-panel' )
		).not.toBeAttached();
	} );

	test( 'non-paragraph content role blocks not within a `content` role container cannot be duplicated, inserted before/after, or moved', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Add content only locked block with paragraph and list
		await pageUtils.pressKeys( 'secondary+M' );

		await page.getByPlaceholder( 'Start writing with text or HTML' )
			.fill( `<!-- wp:group {"templateLock":"contentOnly","layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:heading -->
<h2 class="wp-block-heading">Heading</h2>
<!-- /wp:heading -->

<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>List item one</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>List item two</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></div>
<!-- /wp:group -->` );

		await pageUtils.pressKeys( 'secondary+M' );

		const groupBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Group',
		} );
		const heading = editor.canvas
			.getByRole( 'document', {
				name: 'Block: Heading',
				includeHidden: true,
			} )
			.filter( { hasText: 'Heading' } );

		// Select the content-locked group block.
		await editor.selectBlocks( groupBlock );
		await test.step( 'Blocks cannot be inserted before/after or duplicated', async () => {
			// Test paragraph.
			await editor.selectBlocks( heading );
			await editor.showBlockToolbar();

			await expect(
				page
					.getByRole( 'toolbar', { name: 'Block tools' } )
					.getByRole( 'button', { name: 'Options' } )
			).toBeHidden();
		} );

		await test.step( 'Blocks cannot be moved', async () => {
			// Test paragraph.
			await editor.selectBlocks( heading );
			await editor.showBlockToolbar();

			await expect(
				page
					.getByRole( 'toolbar', { name: 'Block tools' } )
					.getByRole( 'button', { name: 'Move up' } )
			).toBeHidden();

			await expect(
				page
					.getByRole( 'toolbar', { name: 'Block tools' } )
					.getByRole( 'button', { name: 'Move down' } )
			).toBeHidden();
		} );
	} );

	test( 'paragraph blocks that are within a `content` role container can be duplicated, inserted before/after, or moved', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Add content only locked block with paragraph and list
		await pageUtils.pressKeys( 'secondary+M' );

		await page.getByPlaceholder( 'Start writing with text or HTML' )
			.fill( `<!-- wp:group {"templateLock":"contentOnly","layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>First paragraph</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->` );

		await pageUtils.pressKeys( 'secondary+M' );

		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
			includeHidden: true,
		} );

		await test.step( 'Blocks can be inserted before/after or duplicated', async () => {
			// Test first list item.
			await editor.selectBlocks( paragraph );
			await editor.showBlockToolbar();

			const firstOptionsButton = page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Options' } );

			await expect( firstOptionsButton ).toBeVisible();

			// Open the options menu.
			await firstOptionsButton.click();

			// Verify Insert Before, Insert After, and Duplicate menu items are present.
			await expect(
				page
					.getByRole( 'menu', { name: 'Options' } )
					.getByRole( 'menuitem', { name: 'Add before' } )
			).toBeVisible();

			await expect(
				page
					.getByRole( 'menu', { name: 'Options' } )
					.getByRole( 'menuitem', { name: 'Add after' } )
			).toBeVisible();

			await expect(
				page
					.getByRole( 'menu', { name: 'Options' } )
					.getByRole( 'menuitem', { name: 'Duplicate' } )
			).toBeVisible();

			// Close the menu.
			await page.keyboard.press( 'Escape' );
		} );
	} );

	test( 'content role blocks that are within a `content` role container can be duplicated, inserted before/after, or moved', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Add content only locked block with paragraph and list
		await pageUtils.pressKeys( 'secondary+M' );

		await page.getByPlaceholder( 'Start writing with text or HTML' )
			.fill( `<!-- wp:group {"templateLock":"contentOnly","layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>First paragraph</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>List item one</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>List item two</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></div>
<!-- /wp:group -->` );

		await pageUtils.pressKeys( 'secondary+M' );

		const groupBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Group',
		} );
		const firstListItem = editor.canvas
			.getByRole( 'document', {
				name: 'Block: List item',
				includeHidden: true,
			} )
			.filter( { hasText: 'List item one' } );
		const secondListItem = editor.canvas
			.getByRole( 'document', {
				name: 'Block: List item',
				includeHidden: true,
			} )
			.filter( { hasText: 'List item two' } );

		// Select the content-locked group block.
		await editor.selectBlocks( groupBlock );
		await test.step( 'Blocks can be inserted before/after or duplicated', async () => {
			// Test first list item.
			await editor.selectBlocks( firstListItem );
			await editor.showBlockToolbar();

			const firstOptionsButton = page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Options' } );

			await expect( firstOptionsButton ).toBeVisible();

			// Open the options menu.
			await firstOptionsButton.click();

			// Verify Insert Before, Insert After, and Duplicate menu items are present.
			await expect(
				page
					.getByRole( 'menu', { name: 'Options' } )
					.getByRole( 'menuitem', { name: 'Add before' } )
			).toBeVisible();

			await expect(
				page
					.getByRole( 'menu', { name: 'Options' } )
					.getByRole( 'menuitem', { name: 'Add after' } )
			).toBeVisible();

			await expect(
				page
					.getByRole( 'menu', { name: 'Options' } )
					.getByRole( 'menuitem', { name: 'Duplicate' } )
			).toBeVisible();

			// Close the menu.
			await page.keyboard.press( 'Escape' );

			// Test second list item.
			await editor.selectBlocks( secondListItem );
			await editor.showBlockToolbar();

			const secondOptionsButton = page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Options' } );

			await expect( secondOptionsButton ).toBeVisible();

			// Open the options menu.
			await secondOptionsButton.click();

			// Verify Insert Before, Insert After, and Duplicate menu items are present.
			await expect(
				page
					.getByRole( 'menu', { name: 'Options' } )
					.getByRole( 'menuitem', { name: 'Add before' } )
			).toBeVisible();

			await expect(
				page
					.getByRole( 'menu', { name: 'Options' } )
					.getByRole( 'menuitem', { name: 'Add after' } )
			).toBeVisible();

			await expect(
				page
					.getByRole( 'menu', { name: 'Options' } )
					.getByRole( 'menuitem', { name: 'Duplicate' } )
			).toBeVisible();

			// Close the menu.
			await page.keyboard.press( 'Escape' );
		} );

		await test.step( 'Blocks cannot be moved', async () => {
			// Test first list item.
			await editor.selectBlocks( firstListItem );
			await editor.showBlockToolbar();

			await expect(
				page
					.getByRole( 'toolbar', { name: 'Block tools' } )
					.getByRole( 'button', { name: 'Move up' } )
			).toBeVisible();

			await expect(
				page
					.getByRole( 'toolbar', { name: 'Block tools' } )
					.getByRole( 'button', { name: 'Move down' } )
			).toBeVisible();

			// Test second list item.
			await editor.selectBlocks( secondListItem );
			await editor.showBlockToolbar();

			await expect(
				page
					.getByRole( 'toolbar', { name: 'Block tools' } )
					.getByRole( 'button', { name: 'Move up' } )
			).toBeVisible();

			await expect(
				page
					.getByRole( 'toolbar', { name: 'Block tools' } )
					.getByRole( 'button', { name: 'Move down' } )
			).toBeVisible();
		} );
	} );
} );
