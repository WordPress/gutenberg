const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Template Part Focus mode', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyfour' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'Should navigate to template part and back.', async ( {
		admin,
		page,
		editor,
	} ) => {
		await admin.visitAdminPage( 'site-editor.php?canvas=edit' );
		await editor.setPreferences( 'core/edit-site', {
			welcomeGuide: false,
		} );

		// Check that we're editing the template
		await expect( page.locator( 'h1' ) ).toContainText( 'Blog Home' );
		await expect( page.locator( 'h1' ) ).toContainText( 'Template' );

		// Click Template Part
		await editor.canvas
			.getByRole( 'document', {
				name: 'Header',
			} )
			.click();

		// Navigate to Focus mode
		await editor.clickBlockToolbarButton( 'Edit original' );

		// Check if focus mode is active
		await expect( page.locator( 'h1' ) ).toContainText( 'Header' );
		await expect( page.locator( 'h1' ) ).toContainText( 'Template Part' );

		// Go back
		await page.getByRole( 'button', { name: 'Back' } ).click();

		// Check that we're editing the template
		await expect( page.locator( 'h1' ) ).toContainText( 'Blog Home' );
		await expect( page.locator( 'h1' ) ).toContainText( 'Template' );
	} );

	// See https://github.com/WordPress/gutenberg/issues/56178.
	test( 'Should not undo changes made in the editor it was opened from.', async ( {
		admin,
		page,
		editor,
		pageUtils,
		requestUtils,
	} ) => {
		await requestUtils.activateTheme( 'twentytwentyfour' );
		await admin.visitAdminPage( 'site-editor.php?canvas=edit' );
		await editor.setPreferences( 'core/edit-site', {
			welcomeGuide: false,
		} );

		const headerBlock = editor.canvas.getByRole( 'document', {
			name: 'Header',
		} );
		await expect( headerBlock ).toBeVisible();

		// Make a change to the template.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Template change' },
		} );

		const paragraph = editor.canvas.getByText( 'Template change' );
		await expect( paragraph ).toBeVisible();

		// Navigate to Focus mode.
		await headerBlock.click();
		await editor.clickBlockToolbarButton( 'Edit original' );
		await expect( page.locator( 'h1' ) ).toContainText( 'Template Part' );

		// There is nothing to undo in the focused editor.
		await expect(
			page.getByRole( 'button', { name: 'Undo' } )
		).toHaveAttribute( 'aria-disabled', 'true' );

		await pageUtils.pressKeys( 'primary+z' );

		// Go back.
		await page.getByRole( 'button', { name: 'Back' } ).click();
		await expect( page.locator( 'h1' ) ).toContainText( 'Blog Home' );

		// The change made to the template is still there.
		await expect( paragraph ).toBeVisible();
	} );
} );
