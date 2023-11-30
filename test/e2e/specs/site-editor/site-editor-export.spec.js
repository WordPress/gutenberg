/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site Editor Templates Export', () => {
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

	test.beforeEach( async ( { admin, editor } ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
		} );
		await editor.canvas.locator( 'body' ).click();
	} );

	test( 'clicking export should download emptytheme.zip file', async ( {
		page,
	} ) => {
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();

		const promise = page.waitForEvent( 'download' );
		await page.getByRole( 'menuitem', { name: 'Export' } ).click();
		const download = await promise;
		expect( download.suggestedFilename() ).toBe( 'emptytheme.zip' );
	} );
} );
