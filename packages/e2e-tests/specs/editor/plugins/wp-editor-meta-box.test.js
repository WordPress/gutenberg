/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	publishPost,
} from '@wordpress/e2e-test-utils';

describe( 'WP Editor Meta Boxes', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-plugin-wp-editor-meta-box' );
		await createNewPost();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-plugin-wp-editor-meta-box' );
	} );

	// Wait for the meta box's TinyMCE instance to finish initializing.
	const waitForTinyMCE = () =>
		page.waitForFunction( () => {
			const editor =
				window.tinyMCE && window.tinyMCE.get( 'test_tinymce_id' );
			return editor && editor.initialized;
		} );

	it( 'Should save the changes', async () => {
		// Add title to enable valid non-empty post save.
		await page.type( '.editor-post-title__input', 'Hello Meta' );

		/*
		 * Switch TinyMCE to Text mode, first waiting for it to initialize,
		 * because otherwise it will flip back to Visual mode once initialized.
		 */
		await waitForTinyMCE();
		await expect( page ).toClick( '#test_tinymce_id-html' );

		// Type something in the TinyMCE Text mode textarea.
		await page.type( '#test_tinymce_id', 'Typing in a metabox' );

		/*
		 * Switch TinyMCE back to Visual mode, waiting for it to re-initialize
		 * so the editor has settled before the post is published.
		 */
		await page.click( '#test_tinymce_id-tmce' );
		await waitForTinyMCE();

		await publishPost();

		await page.reload();

		await expect( page ).toClick( '#test_tinymce_id-html' );
		await page.waitForSelector( '#test_tinymce_id' );
		const content = await page.$eval(
			'#test_tinymce_id',
			( textarea ) => textarea.value
		);

		expect( content ).toMatchSnapshot();
	} );
} );
