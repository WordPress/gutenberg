/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block Hiding', () => {
	test.beforeEach( async ( { admin, page } ) => {
		await admin.createNewPost();

		// Run the test with the sidebar closed
		const toggleSidebarButton = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', {
				name: 'Settings',
				disabled: false,
			} );
		const isClosed =
			( await toggleSidebarButton.getAttribute( 'aria-expanded' ) ) ===
			'false';
		if ( ! isClosed ) {
			await toggleSidebarButton.click();
		}
	} );

	test( 'should hide a block completely by selecting "Omit from published content"', async ( {
		page,
		editor,
	} ) => {
		// Insert a paragraph block.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Test paragraph' },
		} );

		// Open the Options menu from the block toolbar.
		await editor.clickBlockOptionsMenuItem( 'Hide' );

		// Open the viewport visibility modal and select "Omit from published content".
		await page
			.getByRole( 'dialog', { name: 'Hide block' } )
			.getByRole( 'checkbox', {
				name: 'Omit from published content',
			} )
			.check();

		// Apply the changes.
		await page
			.getByRole( 'dialog', { name: 'Hide block' } )
			.getByRole( 'button', { name: 'Apply' } )
			.click();

		// Open the settings sidebar.
		await editor.openDocumentSettingsSidebar();

		// Verify the block inspector shows "Block is hidden".
		await expect(
			page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByText( 'Block is hidden' )
		).toBeVisible();

		// Verify the Options menu now shows "Show" instead of "Hide".
		await editor.clickBlockToolbarButton( 'Options' );
		await expect(
			page
				.getByRole( 'menu', { name: 'Options' } )
				.getByRole( 'menuitem', {
					name: 'Show',
				} )
		).toBeVisible();
	} );

	test( 'should not allow block visibility shortcut on children of a content-only locked section, but should after editing section', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Add content only locked block in the code editor.
		await pageUtils.pressKeys( 'secondary+M' );

		await page.getByPlaceholder( 'Start writing with text or HTML' )
			.fill( `<!-- wp:group {"templateLock":"contentOnly","layout":{"type":"constrained"}} -->
			<div class="wp-block-group"><!-- wp:paragraph -->
			<p>Locked block a</p>
			<!-- /wp:paragraph -->

			<!-- wp:paragraph -->
			<p>Locked block b</p>
			<!-- /wp:paragraph --></div>
			<!-- /wp:group -->` );

		await pageUtils.pressKeys( 'secondary+M' );
		await editor.openDocumentSettingsSidebar();

		// Select the content locked group block.
		await editor.canvas
			.locator( 'role=document[name="Block: Group"i]' )
			.click();

		// Select a nested paragraph.
		await editor.canvas
			.locator( 'role=document[name="Block: Paragraph"i]' )
			.first()
			.click();

		// Press the visibility shortcut (Shift+Cmd+H / Shift+Ctrl+H).
		await pageUtils.pressKeys( 'primaryShift+h' );

		// The visibility modal should NOT appear.
		await expect(
			page.getByRole( 'dialog', { name: 'Hide block' } )
		).toBeHidden();

		// Now enter edit mode via "Edit section".
		await editor.canvas
			.locator( 'role=document[name="Block: Group"i]' )
			.click();
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Edit section' } )
			.click();

		// Select a nested paragraph again.
		await editor.canvas
			.locator( 'role=document[name="Block: Paragraph"i]' )
			.first()
			.click();

		// Press the visibility shortcut again.
		await pageUtils.pressKeys( 'primaryShift+h' );

		// The visibility modal SHOULD appear now.
		await expect(
			page.getByRole( 'dialog', { name: 'Hide block' } )
		).toBeVisible();
	} );

	test( 'should not allow block visibility shortcut on children of an unsynced pattern, but should after editing section', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Insert an unsynced pattern with patternName metadata.
		await editor.setContent( `<!-- wp:group {"metadata":{"patternName":"core/block/123","name":"My pattern"},"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>Pattern paragraph</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->` );

		await editor.openDocumentSettingsSidebar();

		// Select the pattern block.
		await editor.canvas
			.locator( 'role=document[name="Block: Group"i]' )
			.click();

		// Select the nested paragraph.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();

		// Press the visibility shortcut.
		await pageUtils.pressKeys( 'primaryShift+h' );

		// The visibility modal should NOT appear.
		await expect(
			page.getByRole( 'dialog', { name: 'Hide block' } )
		).toBeHidden();

		// Select the pattern block and enter edit mode via "Edit section".
		await editor.canvas
			.locator( 'role=document[name="Block: Group"i]' )
			.click();
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Edit section' } )
			.click();

		// Select the nested paragraph again.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();

		// Press the visibility shortcut again.
		await pageUtils.pressKeys( 'primaryShift+h' );

		// The visibility modal SHOULD appear now.
		await expect(
			page.getByRole( 'dialog', { name: 'Hide block' } )
		).toBeVisible();
	} );

	test( 'should hide a block only on Mobile viewport', async ( {
		page,
		editor,
	} ) => {
		// Insert a paragraph block.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Test paragraph for mobile hiding' },
		} );

		// Open the Options menu from the block toolbar.
		await editor.clickBlockOptionsMenuItem( 'Hide' );

		// Open the viewport visibility modal and select "Mobile" only.
		await page
			.getByRole( 'dialog', { name: 'Hide block' } )
			.getByRole( 'checkbox', { name: 'Mobile' } )
			.check();

		// Apply the changes.
		await page
			.getByRole( 'dialog', { name: 'Hide block' } )
			.getByRole( 'button', { name: 'Apply' } )
			.click();

		// Toggle to mobile preview.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'View', exact: true } )
			.click();
		await page.getByRole( 'menuitemradio', { name: 'Mobile' } ).click();

		// Open the settings sidebar.
		await editor.openDocumentSettingsSidebar();

		// Verify the block inspector shows "Block is hidden on Mobile".
		await expect(
			page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByText( 'Block is hidden on Mobile' )
		).toBeVisible();

		// Verify the Options menu now shows "Show" instead of "Hide".
		await editor.clickBlockToolbarButton( 'Options' );
		await expect(
			page
				.getByRole( 'menu', { name: 'Options' } )
				.getByRole( 'menuitem', {
					name: 'Show',
				} )
		).toBeVisible();
	} );
} );
