const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Preferences', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		// Reset preferences via REST so interface visibility preferences
		// don't leak into other tests that expect the defaults.
		await requestUtils.resetPreferences();
	} );

	test( 'shows and hides the editor footer from preferences', async ( {
		page,
	} ) => {
		await page.getByRole( 'button', { name: 'View', exact: true } ).click();
		await page.getByRole( 'menuitemradio', { name: 'Tablet' } ).click();
		await page.keyboard.press( 'Escape' );

		const footer = page.getByRole( 'region', { name: 'Editor footer' } );
		const breadcrumbs = footer.getByRole( 'list', {
			name: 'Block breadcrumb',
		} );
		const viewportStatus = footer.getByText( /Tablet \(\d+ × \d+\)/ );
		await expect( breadcrumbs ).toBeVisible();
		await expect( viewportStatus ).toBeVisible();

		for ( const showFooter of [ false, true ] ) {
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Options' } )
				.click();
			await page.getByRole( 'menuitem', { name: 'Preferences' } ).click();
			const preferences = page.getByRole( 'dialog', {
				name: 'Preferences',
			} );
			await preferences
				.getByRole( 'checkbox', { name: 'Show editor footer' } )
				.setChecked( showFooter );
			await preferences.getByRole( 'button', { name: 'Close' } ).click();

			await expect( breadcrumbs ).toBeVisible( { visible: showFooter } );
			await expect( viewportStatus ).toBeVisible( {
				visible: showFooter,
			} );
		}
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
