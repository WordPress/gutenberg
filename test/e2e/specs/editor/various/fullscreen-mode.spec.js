/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function enableFullscreenMode( page ) {
	// Open Options Menu
	await page
		.locator( 'role=region[name="Editor top bar"i]' )
		.getByRole( 'button', { name: 'Options' } )
		.click();

	// Select Full Screen Mode
	await page
		.locator( 'role=menuitemcheckbox', { hasText: 'Fullscreen mode' } )
		.click();
}

test.describe( 'Fullscreen Mode', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'should open the fullscreen mode from the more menu', async ( {
		page,
		admin,
	} ) => {
		await admin.createNewPost();
		await enableFullscreenMode( page );

		// Check the body class.
		await expect( page.locator( 'body' ) ).toHaveClass(
			/is-fullscreen-mode/
		);

		await expect( page.locator( '#wpadminbar' ) ).toBeHidden();

		await expect(
			page.locator(
				'role=region[name="Editor top bar"i] >> role=link[name="View Posts"i]'
			)
		).toBeVisible();
	} );

	test( 'should show the admin bar when the experiment is enabled', async ( {
		page,
		admin,
		requestUtils,
	} ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-admin-bar-in-editor',
		] );
		await admin.createNewPost();
		await enableFullscreenMode( page );

		await expect( page.locator( 'body' ) ).toHaveClass(
			/is-fullscreen-mode/
		);
		await expect( page.locator( 'body' ) ).toHaveClass(
			/is-admin-bar-in-editor-enabled/
		);
		await expect( page.locator( '#wpadminbar' ) ).toBeVisible();
		await expect(
			page.locator( '.interface-interface-skeleton' )
		).toHaveCSS( 'top', '32px' );

		await expect(
			page.locator(
				'role=region[name="Editor top bar"i] >> role=link[name="View Posts"i]'
			)
		).toBeVisible();
	} );

	test( 'should show the admin bar in the site editor when the experiment is enabled', async ( {
		page,
		admin,
		requestUtils,
	} ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-admin-bar-in-editor',
		] );
		await admin.visitAdminPage( 'site-editor.php' );

		await expect( page.locator( 'body' ) ).toHaveClass(
			/is-admin-bar-in-editor-enabled/
		);
		await expect( page.locator( '#wpadminbar' ) ).toBeVisible();
		await expect( page.locator( '.edit-site' ) ).toHaveCSS( 'top', '32px' );
		await expect( page.locator( '.edit-site-site-hub' ) ).toBeHidden();
	} );
} );
