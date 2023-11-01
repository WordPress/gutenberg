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
		// Open Options Menu
		await page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Options"i]'
		);

		// Select Full Screen Mode
		await page
			.locator( 'role=menuitemcheckbox', { hasText: 'Fullscreen mode' } )
			.click();

		// Check the body class.
		await expect( page.locator( 'body' ) ).toHaveClass(
			/is-fullscreen-mode/
		);

		await expect(
			page.locator(
				'role=region[name="Editor top bar"i] >> role=link[name="View Posts"i]'
			)
		).toBeVisible();
	} );
} );
