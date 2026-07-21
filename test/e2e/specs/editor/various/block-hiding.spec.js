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

		// Now enter edit mode via "Edit pattern".
		await editor.canvas
			.locator( 'role=document[name="Block: Group"i]' )
			.click();
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Edit pattern' } )
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

		// Select the pattern block and enter edit mode via "Edit pattern".
		await editor.canvas
			.locator( 'role=document[name="Block: Group"i]' )
			.click();
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Edit pattern' } )
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

	test( 'should ghost hidden blocks while responsive styles is on', async ( {
		page,
		editor,
	} ) => {
		// Insert a hidden paragraph and a visible one.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hidden content' },
		} );
		await editor.clickBlockOptionsMenuItem( 'Hide' );
		await page
			.getByRole( 'dialog', { name: 'Hide block' } )
			.getByRole( 'checkbox', { name: 'Omit from published content' } )
			.check();
		await page
			.getByRole( 'dialog', { name: 'Hide block' } )
			.getByRole( 'button', { name: 'Apply' } )
			.click();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Visible content' },
		} );

		// With responsive styles off (the default), the hidden block is not
		// in the canvas once deselected, like on trunk.
		await expect(
			editor.canvas.getByText( 'Hidden content' )
		).toBeHidden();

		// Turn on responsive styles from the View menu.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'View', exact: true } )
			.click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Responsive styles' } )
			.click();
		// The View menu stays open after toggling the checkbox.
		await page.keyboard.press( 'Escape' );

		// The hidden block now renders ghosted, and its accessible name
		// announces why it's hidden. Blocks omitted from published content
		// get a distinct ghost style from viewport-conditional ones.
		const ghostedBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph. Always hidden.',
		} );
		await expect( ghostedBlock ).toBeVisible();
		await expect( ghostedBlock ).toHaveClass( /is-block-ghosted-always/ );

		// Selecting the ghosted block keeps it editable, and the block
		// toolbar states why it's hidden.
		await editor.selectBlocks( ghostedBlock );
		await expect(
			page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByText( 'Always hidden' )
		).toBeVisible();
	} );

	test( 'should ghost viewport-hidden blocks only at the matching device preview', async ( {
		page,
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Mobile hidden content' },
		} );
		await editor.clickBlockOptionsMenuItem( 'Hide' );
		await page
			.getByRole( 'dialog', { name: 'Hide block' } )
			.getByRole( 'checkbox', { name: 'Mobile' } )
			.check();
		await page
			.getByRole( 'dialog', { name: 'Hide block' } )
			.getByRole( 'button', { name: 'Apply' } )
			.click();

		// Turn on responsive styles from the View menu.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'View', exact: true } )
			.click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Responsive styles' } )
			.click();
		// The View menu stays open after toggling the checkbox.
		await page.keyboard.press( 'Escape' );

		// At the Desktop preview the block renders normally.
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
				exact: true,
			} )
		).toBeVisible();

		// At the Mobile preview it ghosts.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'View', exact: true } )
			.click();
		await page.getByRole( 'menuitemradio', { name: 'Mobile' } ).click();
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph. Hidden on Mobile.',
			} )
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
