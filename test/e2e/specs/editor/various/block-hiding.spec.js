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
