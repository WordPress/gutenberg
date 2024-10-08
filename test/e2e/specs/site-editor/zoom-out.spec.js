/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Zoom Out', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyfour' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.beforeEach( async ( { admin, editor } ) => {
		await admin.visitSiteEditor();
		await editor.canvas.locator( 'body' ).click();
	} );

	test( 'Entering zoomed out mode zooms the canvas', async ( {
		page,
		editor,
	} ) => {
		await page.getByLabel( 'Zoom Out' ).click();
		const frame = editor.canvas.locator( 'html' );
		await expect( frame ).toHaveCSS(
			'transform',
			'matrix(0.75, 0, 0, 0.75, 0, 0)'
		);
		await page.pause();
	} );
} );
