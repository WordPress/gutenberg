/**
 * WordPress dependencies
 */
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
		await editor.clickBlockToolbarButton( 'Edit' );

		// Check if focus mode is active
		await expect( page.locator( 'h1' ) ).toContainText( 'Header' );
		await expect( page.locator( 'h1' ) ).toContainText( 'Template Part' );

		// Go back
		await page.getByRole( 'button', { name: 'Back' } ).click();

		// Check that we're editing the template
		await expect( page.locator( 'h1' ) ).toContainText( 'Blog Home' );
		await expect( page.locator( 'h1' ) ).toContainText( 'Template' );
	} );
} );
