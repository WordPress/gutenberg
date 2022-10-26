/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'new editor filtered state', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-default-post-content'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-default-post-content'
		);
		await requestUtils.deleteAllPosts();
	} );

	test( 'should respect default content', async ( { editor, page } ) => {
		await editor.openDocumentSettingsSidebar();
		await page.click( 'role=button[name="Excerpt"i]' );

		// Assert they match what the plugin set.
		await expect(
			page.locator( 'role=textbox[name="Add title"i]' )
		).toHaveText( 'My default title' );
		await expect
			.poll( editor.getEditedPostContent )
			.toBe( 'My default content' );
		await expect(
			page.locator( 'role=textbox[name="Write an excerpt (optional)"i]' )
		).toHaveText( 'My default excerpt' );
	} );
} );
