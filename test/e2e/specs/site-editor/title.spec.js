/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site editor title', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'displays the selected template name in the title for the index template', async ( {
		admin,
		page,
	} ) => {
		// Navigate to a template.
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
		const title = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'heading', {
				name: 'Index',
			} );

		await expect( title ).toBeVisible();
	} );

	test( 'displays the selected template name in the title for the header template', async ( {
		admin,
		page,
	} ) => {
		// Navigate to a template part.
		await admin.visitSiteEditor( {
			postId: 'emptytheme//header',
			postType: 'wp_template_part',
			canvas: 'edit',
		} );
		const title = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'heading', {
				name: 'header',
			} );

		await expect( title ).toBeVisible();
	} );
} );
