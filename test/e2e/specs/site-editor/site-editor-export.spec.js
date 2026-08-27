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

	// v2 gap: the theme export action is registered by `edit-site`'s more
	// menu (`site-export.js`), which the extensible site editor does not
	// render, so there is no Export menu item there yet.
	test( 'clicking export should download emptytheme.zip file @site-editor-v1-only', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
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
