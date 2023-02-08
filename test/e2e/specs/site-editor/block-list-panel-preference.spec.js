/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block list view', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'Should open by default', async ( { admin, page, siteEditor } ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
		} );

		await siteEditor.enterEditMode();

		// Should display the Preview button.
		await expect(
			page.locator( 'role=region[name="List View"i]' )
		).not.toBeVisible();

		// Turn on block list view by default.
		await page.evaluate( () => {
			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-site', 'showListViewByDefault', true );
		} );

		await page.reload();

		// Should display the Preview button.
		await expect(
			page.locator( 'role=region[name="List View"i]' )
		).toBeVisible();
	} );
} );
