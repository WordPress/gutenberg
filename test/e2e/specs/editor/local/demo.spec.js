/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'New editor state', () => {
	test( 'content should load, making the post dirty', async ( {
		page,
		admin,
		editor,
	} ) => {
		await admin.visitAdminPage( 'post-new.php', 'gutenberg-demo' );
		await editor.setPreferences( 'core/edit-site', {
			welcomeGuide: false,
			fullscreenMode: false,
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
