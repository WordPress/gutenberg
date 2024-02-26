/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Preferences', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'remembers sidebar dismissal between sessions', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();

		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		const activeTab = editorSettings.getByRole( 'tab', { selected: true } );

		// Open by default.
		await expect( activeTab ).toHaveText( 'Post' );

		// Change to "Block" tab.
		await editorSettings.getByRole( 'tab', { name: 'Block' } ).click();
		await expect( activeTab ).toHaveText( 'Block' );

		/**
		 * Regression test: Reload resets to document tab.
		 *
		 * See: https://github.com/WordPress/gutenberg/issues/6377
		 * See: https://github.com/WordPress/gutenberg/pull/8995
		 */
		await page.reload();
		await expect( activeTab ).toHaveText( 'Post' );

		// Dismiss.
		await editorSettings
			.getByRole( 'button', {
				name: 'Close Settings',
			} )
			.click();
		await expect( activeTab ).toBeHidden();

		// Remember after reload.
		await page.reload();
		await expect( activeTab ).toBeHidden();
	} );
} );
