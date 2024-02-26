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
		await page.click( 'role=button[name="Index"]' );
		await expect( page ).toHaveURL(
			'/wp-admin/site-editor.php?postType=wp_template&postId=emptytheme%2F%2Findex'
		);

		// Navigate back to the template list
		await page.goBack();
		await expect( page ).toHaveURL(
			'/wp-admin/site-editor.php?path=%2Fwp_template'
		);

		// Navigate back to the dashboard
		await page.goBack();
		await page.goBack();
		await expect( page ).toHaveURL( '/wp-admin/index.php' );
	} );
} );
