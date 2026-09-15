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
		await editor.canvas
			.locator( 'role=textbox[name="Add title"i]' )
			.type( 'Hello Meta' );

		// Switch tinymce to Text mode, first waiting for it to initialize
		// because otherwise it will flip back to Visual mode once initialized.
		await page.locator( '#test_tinymce_id_ifr' ).waitFor();
		await page.locator( 'role=button[name="Text"i]' ).click();

		// Type something in the tinymce Text mode textarea.
		const metaBoxField = page.locator( '#test_tinymce_id' );
		await metaBoxField.type( 'Typing in a metabox' );

		// Switch tinymce back to Visual mode.
		await page.locator( 'role=button[name="Visual"i]' ).click();

		await editor.publishPost();
		await page.reload();

		// Expect the typed text in the tinymce Text mode textarea.
		await expect( metaBoxField ).toHaveValue( 'Typing in a metabox' );
	} );
} );
