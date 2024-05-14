/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Zoom Out', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { admin, editor } ) => {
		await admin.visitSiteEditor();
		await editor.canvas.locator( 'body' ).click();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'Clicking on inserter while on zoom-out should open the patterns tab on the inserter', async ( {
		page,
	} ) => {
		// Trigger zoom out on Global Styles because there the inserter is not open.
		await page.getByRole( 'button', { name: 'Styles' } ).click();
		await page.getByRole( 'button', { name: 'Browse styles' } ).click();

		await expect( page.getByLabel( 'Add pattern' ) ).toHaveCount( 3 );
		await page.getByLabel( 'Add pattern' ).first().click();
		await expect( page.getByLabel( 'Add pattern' ) ).toHaveCount( 2 );

		await expect(
			page
				.locator( '#tabs-2-allPatterns-view div' )
				.filter( { hasText: 'All' } )
				.nth( 1 )
		).toBeVisible();
	} );
} );
