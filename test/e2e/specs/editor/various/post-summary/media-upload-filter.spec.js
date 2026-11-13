const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/*
 * Plugins extend the media picker through the `editor.MediaUpload` filter and
 * recognize the featured image by the `featuredImageFlow` prop. The summary's
 * featured image field must reach them with it, and open the featured-image
 * media frame.
 */
test.describe( 'Featured image media upload filter (@firefox, @webkit)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.resetPreferences();
		await requestUtils.activatePlugin(
			'gutenberg-test-media-upload-filter'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-media-upload-filter'
		);
	} );

	test( 'reaches the featured image field', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.openDocumentSettingsSidebar();
		const marker = page.locator( '.media-edit .e2e-media-upload-filter' );
		await expect( marker ).toHaveAttribute(
			'data-featured-image-flow',
			'true'
		);
		await expect(
			page.getByRole( 'button', { name: 'Set featured image' } )
		).toBeVisible();
		await expectFeaturedImageFrame( page );

		// Extensions can reopen Core's current frame without calling the render prop.
		await page.evaluate( () => {
			window.wp.media.frame.open();
		} );
		const reopened = page.getByRole( 'dialog', { name: 'Featured image' } );
		await expect( reopened ).toBeVisible();
		await page.keyboard.press( 'Escape' );
		await expect( reopened ).toBeHidden();
		await expect( marker ).toHaveAttribute( 'data-custom-state', 'true' );
		await expect(
			page.getByRole( 'button', { name: 'Set featured image' } )
		).toBeFocused();
	} );
} );

/**
 * Opens the picker and checks that the media modal is the featured-image
 * frame, then closes it.
 *
 * @param {import('@playwright/test').Page} page Playwright page.
 */
async function expectFeaturedImageFrame( page ) {
	await page.getByRole( 'button', { name: 'Set featured image' } ).click();
	const modal = page.locator( '.media-modal' );
	await expect( modal.locator( '.media-frame-title' ) ).toHaveText(
		'Featured image'
	);
	await expect(
		modal.getByRole( 'button', { name: 'Set featured image', exact: true } )
	).toBeVisible();
	await modal.locator( '.media-modal-close' ).click();
	await expect( modal ).toBeHidden();
}
