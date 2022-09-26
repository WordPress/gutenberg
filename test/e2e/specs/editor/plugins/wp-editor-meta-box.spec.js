/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'WP Editor Meta Boxes', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-wp-editor-meta-box'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-wp-editor-meta-box'
		);
	} );

	test( 'Should save the changes', async ( { admin, editor, page } ) => {
		await admin.createNewPost();

		// Add title to enable valid non-empty post save.
		await page.type( 'role=textbox[name="Add title"i]', 'Hello Meta' );

		// Type something.
		await page.click( 'role=button[name="Text"i]' );
		await page.click( '#test_tinymce_id' );
		await page.keyboard.type( 'Typing in a metabox' );
		await page.type( '#test_tinymce_id-html', 'Typing in a metabox' );
		await page.click( 'role=button[name="Visual"i]' );

		await editor.publishPost();

		// Close the publish panel so that it won't cover the tinymce editor.
		await page.click(
			'role=region[name="Editor publish"i] >> role=button[name="Close panel"i]'
		);

		await expect( page.locator( '.edit-post-layout' ) ).toBeVisible();

		await page.click( 'role=button[name="Text"i]' );

		// Expect the typed text on the tinymce editor
		const content = page.locator( '#test_tinymce_id' );
		await expect( content ).toHaveValue( 'Typing in a metabox' );
	} );
} );
