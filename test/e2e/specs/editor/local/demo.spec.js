/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'New editor state', () => {
	test( 'content should load, making the post dirty', async ( {
		page,
		admin,
	} ) => {
		await admin.visitAdminPage( 'post-new.php', 'gutenberg-demo' );
		await page.waitForFunction( () => {
			if ( ! window?.wp?.data?.dispatch ) {
				return false;
			}
			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-post', 'welcomeGuide', false );

			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-post', 'fullscreenMode', false );

			return true;
		} );

		const isDirty = await page.evaluate( () => {
			return window.wp.data.select( 'core/editor' ).isEditedPostDirty();
		} );
		expect( isDirty ).toBe( true );

		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Save draft' } )
		).toBeEnabled();
	} );
} );
