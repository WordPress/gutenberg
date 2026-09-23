const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { EXPERIMENTS } = require( './utils' );

/*
 * Plugins extend the media picker through the `editor.MediaUpload` filter and
 * recognize the featured image by the prop the classic panel passes. The
 * DataForm summary's featured image field must reach them the same way, and
 * open the same featured-image media frame.
 */
test.describe( 'Featured image media upload filter (DataForm inspector)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.resetPreferences();
		await requestUtils.activatePlugin(
			'gutenberg-test-media-upload-filter'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
		await requestUtils.deactivatePlugin(
			'gutenberg-test-media-upload-filter'
		);
	} );

	test( 'reaches the featured image field as it does the classic panel', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await requestUtils.setGutenbergExperiments( [] );
		await admin.createNewPost();
		await editor.openDocumentSettingsSidebar();
		const classicMarker = page.locator(
			'.editor-post-featured-image .e2e-media-upload-filter'
		);
		await expect( classicMarker ).toHaveAttribute(
			'data-featured-image-flow',
			'true'
		);
		await expectFeaturedImageFrame( page );

		await requestUtils.setGutenbergExperiments( EXPERIMENTS );
		await admin.createNewPost();
		await editor.openDocumentSettingsSidebar();
		const marker = page.locator(
			'.fields__media-edit .e2e-media-upload-filter'
		);
		await expect( marker ).toHaveAttribute(
			'data-featured-image-flow',
			'true'
		);
		await expect(
			page.getByRole( 'button', { name: 'Set featured image' } )
		).toBeVisible();
		await expectFeaturedImageFrame( page );
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
