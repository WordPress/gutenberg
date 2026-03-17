/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site Title block', () => {
	let originalSiteTitle;

	test.beforeAll( async ( { requestUtils } ) => {
		originalSiteTitle = ( await requestUtils.getSiteSettings() ).title;
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.updateSiteSettings( { title: originalSiteTitle } );
	} );

	test( 'Can edit the site title as admin', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/site-title' } );

		const siteTitleBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Site Title',
		} );

		// Update the site title
		await siteTitleBlock
			.getByRole( 'textbox', {
				name: 'Site title text',
			} )
			.fill( 'New Site Title' );

		await editor.publishPost();
		await page.reload();

		await expect( siteTitleBlock ).toBeVisible();
		await expect( siteTitleBlock ).toHaveText( 'New Site Title' );
	} );

	// Reason: The current e2e test setup doesn't provide an easy way to switch between user roles.
	// eslint-disable-next-line playwright/expect-expect
	test.fixme( 'Cannot edit the site title as editor', async () => {} );
} );
