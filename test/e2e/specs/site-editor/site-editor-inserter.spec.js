/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block list view', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'emptytheme' ),
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.visitSiteEditor();
	} );

	test( 'inserter toggle button should toggle global inserter', async ( {
		page,
	} ) => {
		await page.click( 'role=button[name="Toggle block inserter"i]' );
		await page
			.locator( '.edit-site-editor__inserter-panel' )
			.waitFor( { state: 'visible' } );
		await expect(
			page.locator( 'role=region[name="Block Library"i]' )
		).toBeVisible();
	} );
} );
