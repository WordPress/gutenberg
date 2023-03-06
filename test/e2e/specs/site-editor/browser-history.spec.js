/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const baseUrl = process.env.WP_BASE_URL || 'http://localhost:8889';

test.describe( 'Site editor browser history', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'Back button works properly', async ( { admin, page } ) => {
		// Navigate to a template.
		await admin.visitAdminPage( 'index.php' );
		await admin.visitSiteEditor();

		expect( page.url() ).toEqual( baseUrl + '/wp-admin/site-editor.php' );

		// Navigate to a single template
		await page.click( 'role=button[name="Templates"]' );
		await page.click( 'role=button[name="Index"]' );
		expect( page.url() ).toEqual(
			baseUrl +
				'/wp-admin/site-editor.php?postType=wp_template&postId=emptytheme%2F%2Findex'
		);

		// Navigate back to the template list
		await page.goBack();
		expect( page.url() ).toEqual(
			baseUrl + '/wp-admin/site-editor.php?path=%2Fwp_template'
		);

		// Navigate back to the dashboard
		await page.goBack();
		await page.goBack();
		expect( page.url() ).toEqual( baseUrl + '/wp-admin/index.php' );
	} );

	test( 'Opens the template list from the template details view', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor( {
			postType: 'wp_template',
			postId: 'emptytheme//index',
			canvas: 'edit',
		} );

		// Navigate to the template list
		await page.click( 'role=button[name="Show template details"]' );
		await page.click( 'role=link[name="Manage all templates"]' );

		expect( page.url() ).toEqual(
			baseUrl + '/wp-admin/site-editor.php?path=%2Fwp_template%2Fall'
		);

		const title = page.locator( '.edit-site-list-header__title' );
		await expect( title ).toHaveText( 'Templates' );
	} );
} );
