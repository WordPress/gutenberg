const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// Whether the run targets the extensible site editor (v2), which lives at
// `admin.php?page=site-editor-v2` and routes via the `p` query param.
const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;

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
		await expect( page ).toHaveURL(
			isSiteEditorV2
				? 'wp-admin/admin.php?page=site-editor-v2&p=%2F'
				: 'wp-admin/site-editor.php'
		);

		// Navigate to a single template
		await page
			.getByRole( isSiteEditorV2 ? 'link' : 'button', {
				name: 'Templates',
				exact: true,
			} )
			.click();
		await page
			.locator( '.fields-field__title', { hasText: 'Index' } )
			.click();
		await expect( page ).toHaveURL(
			isSiteEditorV2
				? 'wp-admin/admin.php?page=site-editor-v2&p=%2Ftypes%2Fwp_template%2Fedit%2Femptytheme%252F%252Findex'
				: 'wp-admin/site-editor.php?p=%2Fwp_template%2Femptytheme%2F%2Findex&canvas=edit'
		);

		// Navigate back to the template list
		await page.goBack();
		await expect( page ).toHaveURL(
			isSiteEditorV2
				? 'wp-admin/admin.php?page=site-editor-v2&p=%2Ftemplates%2Flist%2Fall'
				: 'wp-admin/site-editor.php?p=%2Ftemplate'
		);

		// Navigate back to the dashboard
		await page.goBack();
		await page.goBack();
		await expect( page ).toHaveURL( 'wp-admin/index.php' );
	} );
} );
