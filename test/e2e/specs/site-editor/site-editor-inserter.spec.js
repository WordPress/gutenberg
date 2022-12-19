/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site Editor Inserter', () => {
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

	test.beforeEach( async ( { admin, siteEditor } ) => {
		await admin.visitSiteEditor();
		await siteEditor.enterEditMode();
	} );

	test( 'inserter toggle button should toggle global inserter', async ( {
		page,
	} ) => {
		await page.click( 'role=button[name="Toggle block inserter"i]' );

		// Visibility check
		await expect(
			page.locator(
				'role=searchbox[name="Search for blocks and patterns"i]'
			)
		).toBeVisible();
		await page.click( 'role=button[name="Toggle block inserter"i]' );
		//Hidden State check
		await expect(
			page.locator(
				'role=searchbox[name="Search for blocks and patterns"i]'
			)
		).toBeHidden();
	} );
} );
