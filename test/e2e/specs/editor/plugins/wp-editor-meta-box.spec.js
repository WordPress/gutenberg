/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'WP Editor Meta Boxes', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-wp-editor-meta-box'
		);
		// Cross-origin isolation (COEP) prevents TinyMCE from
		// initializing properly in its iframe.
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-disable-client-side-media-processing'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-wp-editor-meta-box'
		);
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-disable-client-side-media-processing'
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
		// Switch tinymce to Text mode, first waiting for it to initialize
		// because otherwise it will flip back to Visual mode once initialized.
		await page.locator( '#test_tinymce_id_ifr' ).waitFor();
		await page.locator( 'role=button[name="Code"i]' ).click();

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
