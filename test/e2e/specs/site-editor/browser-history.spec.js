/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site editor browser history', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'Back button works properly', async ( { admin, page } ) => {
		await admin.visitAdminPage( 'index.php' );
		await admin.visitSiteEditor();
		await expect( page ).toHaveURL( '/wp-admin/site-editor.php' );

		// Navigate to a single template
		await page.click( 'role=button[name="Templates"]' );
		await page
			.locator( '.fields-field__title', { hasText: 'Index' } )
			.click();
		await expect( page ).toHaveURL(
			'/wp-admin/site-editor.php?p=%2Fwp_template%2Femptytheme%2F%2Findex&canvas=edit'
		);

		// Navigate back to the template list
		await page.goBack();
		await expect( page ).toHaveURL(
			'/wp-admin/site-editor.php?p=%2Ftemplate'
		);

		// Navigate back to the dashboard
		await page.goBack();
		await page.goBack();
		await expect( page ).toHaveURL( '/wp-admin/index.php' );
	} );
} );
