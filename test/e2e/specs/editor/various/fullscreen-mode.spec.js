/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Fullscreen Mode', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'should open the fullscreen mode from the more menu', async ( {
		page,
	} ) => {
		// Open Options
		await page.locator( ' [aria-label="Options"]' ).click();

		// Verify All options are visible
		page.locator( '.interface-more-menu-dropdown__content' );

		// Choose Full Screen Mode
		await page
			.locator( 'text=/Fullscreen modeWork without distraction/' )
			.click();

		// Validate Fullscreen
		const isFullscreenEnabled = await page.$eval( 'body', ( body ) => {
			return body.classList.contains( 'is-fullscreen-mode' );
		} );

		expect( isFullscreenEnabled ).toBe( true );

		const fullscreenCloseButton = await page.locator(
			'.edit-post-fullscreen-mode-close'
		);

		expect( fullscreenCloseButton ).not.toBeNull();
	} );
} );
