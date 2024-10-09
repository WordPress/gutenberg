/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Homepage Settings via Editor', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [ requestUtils.activateTheme( 'emptytheme' ) ] );
	} );

	test.beforeEach( async ( { admin, page } ) => {
		await admin.visitSiteEditor();
		await page.getByRole( 'button', { name: 'Pages' } ).click();
	} );

	test( 'should show "Set as homepage" action on published pages', async ( {
		page,
	} ) => {
		const samplePage = page
			.getByRole( 'gridcell' )
			.getByLabel( 'Sample Page' );
		const samplePageRow = page
			.getByRole( 'row' )
			.filter( { has: samplePage } );
		await samplePageRow.click();
		await samplePageRow
			.getByRole( 'button', {
				name: 'Actions',
			} )
			.click();
		await expect(
			page.getByRole( 'menuitem', { name: 'Set as homepage' } )
		).toBeVisible();
	} );
} );
