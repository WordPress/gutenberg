/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Global styles sidebar', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
	} );

	test( 'should filter blocks list results', async ( { page } ) => {
		// Navigate to Styles -> Blocks.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Styles' } )
			.click();
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Blocks' } )
			.click();

		await page
			.getByRole( 'searchbox', { name: 'Search' } )
			.fill( 'heading' );

		// Matches both Heading and Table of Contents blocks.
		// The latter contains "heading" in its description.
		await expect(
			page.getByRole( 'button', { name: 'Heading', exact: true } )
		).toBeVisible();
		await expect(
			page.getByRole( 'button', {
				name: 'Table of Contents',
			} )
		).toBeVisible();
	} );
} );
