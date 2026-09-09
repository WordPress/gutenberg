const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Template Part Focus mode', () => {
	// The theme is restored after every test, so each test activates the one
	// it needs rather than relying on a single beforeAll.
	test.beforeEach( async ( { requestUtils } ) => {
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

	test( 'Should restore the selected block after returning from the template part.', async ( {
		admin,
		page,
		editor,
	} ) => {
		await admin.visitAdminPage( 'site-editor.php?canvas=edit' );
		await editor.setPreferences( 'core/edit-site', {
			welcomeGuide: false,
		} );

		const templatePart = editor.canvas.getByRole( 'document', {
			name: 'Header',
		} );
		await templatePart.click();

		const getSelectedBlockName = () =>
			page.evaluate( () => {
				const { getSelectedBlockClientId, getBlockName } =
					window.wp.data.select( 'core/block-editor' );
				const clientId = getSelectedBlockClientId();
				return clientId ? getBlockName( clientId ) : null;
			} );

		await expect.poll( getSelectedBlockName ).toBe( 'core/template-part' );

		await editor.clickBlockToolbarButton( 'Edit original' );
		await expect( page.locator( 'h1' ) ).toContainText( 'Header' );

		await page.getByRole( 'button', { name: 'Back' } ).click();
		await expect( page.locator( 'h1' ) ).toContainText( 'Blog Home' );

		// The template part that was being edited is selected again, rather
		// than the selection being dropped or landing on another block.
		await expect.poll( getSelectedBlockName ).toBe( 'core/template-part' );
	} );
} );
