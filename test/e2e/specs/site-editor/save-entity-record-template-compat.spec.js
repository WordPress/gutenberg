/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'calling saveEntityRecord with a theme template ID', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
	} );
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );
	test( 'should work as expected', async ( { admin, page } ) => {
		await admin.visitSiteEditor();
		await page.evaluate( async () => {
			await window.wp.data.dispatch( 'core' ).saveEntityRecord(
				'postType',
				'wp_template',
				{
					id: 'emptytheme//index',
					title: 'saveEntityRecord test',
					content: 'test',
				},
				{ throwOnError: true }
			);
		} );
		await admin.visitSiteEditor( {
			postType: 'wp_template',
			activeView: 'user',
		} );
		await expect(
			page
				.getByRole( 'button', { name: 'saveEntityRecord test' } )
				.first()
		).toBeVisible();
		await expect( page.getByText( 'Template typeIndex' ) ).toBeVisible();
	} );
} );
