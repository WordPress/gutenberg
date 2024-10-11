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
		const iframe = page.locator( 'iframe[name="editor-canvas"]' );
		const html = editor.canvas.locator( 'html' );

		// Check that the html is scaled.
		await expect( html ).toHaveCSS(
			'transform',
			'matrix(0.67, 0, 0, 0.67, 0, 0)'
		);
		const iframeRect = await iframe.boundingBox();
		const htmlRect = await html.boundingBox();

		// Check that the iframe is larger than the html.
		expect( iframeRect.width ).toBeGreaterThan( htmlRect.width );

		// Check that the zoomed out content has a frame around it.
		const paddingTop = await html.evaluate( ( element ) => {
			const paddingValue = window.getComputedStyle( element ).paddingTop;
			return parseFloat( paddingValue );
		} );
		expect( htmlRect.y + paddingTop ).toBeGreaterThan( iframeRect.y );
		expect( htmlRect.x ).toBeGreaterThan( iframeRect.x );
	} );
} );
