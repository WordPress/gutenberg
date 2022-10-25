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
		await page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Options"i]'
		);


		// Choose Full Screen Mode
		await page
			.locator( 'role=menuitemcheckbox', { hasText: 'Fullscreen mode' } )
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
