/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site editor iframe rendering mode', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'Should render editor in standards mode.', async ( {
		admin,
		editor,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
		const compatMode = await editor.canvas
			.locator( ':root' )
			.evaluate( () => document.compatMode );

		// CSS1Compat = expected standards mode.
		// BackCompat = quirks mode.
		expect( compatMode ).toBe( 'CSS1Compat' );
	} );
} );
