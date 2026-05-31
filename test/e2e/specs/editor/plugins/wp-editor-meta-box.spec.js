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

		// Open the meta box pane. The click isn’t in the center because that
		// would hit the resize handle instead of the located element.
		await page
			.getByRole( 'button', { name: 'Meta Boxes' } )
			.click( { position: { x: 0, y: 0 } } );

		// Switch to Visual mode and wait for TinyMCE to fully initialize.
		// This ensures getSelection() won't return null when TinyMCE tries
		// to restore cursor position during subsequent mode switches.
		await page.locator( 'role=button[name="Visual"i]' ).click();
		await page.waitForFunction(
			() => window.tinyMCE?.get( 'test_tinymce_id' )?.initialized
		);

		// Switch to Code mode and type into the textarea.
		await page.locator( 'role=button[name="Code"i]' ).click();
		const metaBoxField = page.locator( '#test_tinymce_id' );
		await metaBoxField.type( 'Typing in a metabox' );

		// Switch back to Visual mode and wait for re-initialization.
		await page.locator( 'role=button[name="Visual"i]' ).click();
		await page.waitForFunction(
			() => window.tinyMCE?.get( 'test_tinymce_id' )?.initialized
		);

		await editor.publishPost();
		await page.reload();

		// Expect the typed text in the tinymce Text mode textarea.
		await expect( metaBoxField ).toHaveValue( 'Typing in a metabox' );
	} );
} );
