const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// Whether the run targets the extensible site editor (v2). With its
// experiment enabled, the themes screen's Live Preview opens the extensible
// theme preview page, which activates through a confirmation modal and then
// redirects to the themes screen.
const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;

test.describe( 'Activate theme', () => {
	test.beforeEach( async ( { admin, page } ) => {
		await admin.visitAdminPage( 'themes.php' );
		await page.getByLabel( 'Live Preview Emptytheme' ).click();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'activate block theme when live previewing from sidebar save button', async ( {
		admin,
		page,
	} ) => {
		if ( isSiteEditorV2 ) {
			await page
				.getByRole( 'button', { name: 'Activate', exact: true } )
				.click();
			await page
				.getByRole( 'dialog', { name: 'Activate' } )
				.getByRole( 'button', { name: /^Activate( & Save)?$/ } )
				.click();
			// Activating redirects to the themes screen.
			await expect(
				page.getByLabel( 'Customize Emptytheme' )
			).toBeVisible();
			return;
		}
		await page
			.getByRole( 'button', { name: 'Activate Emptytheme' } )
			.click();
		await page
			.getByRole( 'button', { name: 'Activate', exact: true } )
			.click();
		await expect(
			page.getByRole( 'button', { name: 'Dismiss this notice' } )
		).toContainText( 'Theme activated.' );
		await admin.visitAdminPage( 'themes.php' );
		await expect( page.getByLabel( 'Customize Emptytheme' ) ).toBeVisible();
	} );

	// The extensible theme preview page has a single activation flow (covered
	// above); the classic preview's separate edit-mode top bar flow does not
	// exist there.
	test( 'activate block theme when live previewing in edit mode @site-editor-v1-only', async ( {
		editor,
		admin,
		page,
	} ) => {
		// Wait for the Site Editor to load before interacting with the page.
		await expect(
			page.getByRole( 'button', { name: 'Activate Emptytheme' } )
		).toBeVisible();
		await editor.setPreferences( 'core/edit-site', {
			welcomeGuide: false,
		} );

		await editor.canvas.locator( 'body' ).click();
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Activate Emptytheme' } )
			.click();
		await page
			.getByRole( 'button', { name: 'Activate', exact: true } )
			.click();
		await expect(
			page.getByRole( 'button', { name: 'Dismiss this notice' } )
		).toContainText( 'Theme activated.' );
		await admin.visitAdminPage( 'themes.php' );
		await expect( page.getByLabel( 'Customize Emptytheme' ) ).toBeVisible();
	} );
} );
