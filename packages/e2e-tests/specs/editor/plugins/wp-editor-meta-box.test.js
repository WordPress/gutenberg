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

	it( 'Should save the changes', async () => {
		// Add title to enable valid non-empty post save.
		await page.type( '.editor-post-title__input', 'Hello Meta' );

		// Type something.
		await expect( page ).toClick( '#test_tinymce_id-html' );
		await page.type( '#test_tinymce_id', 'Typing in a metabox' );
		await page.click( '#test_tinymce_id-tmce' );

		await publishPost();

		await page.reload();
		await page.waitForSelector( '.edit-post-layout' );

		await expect( page ).toClick( '#test_tinymce_id-html' );
		await page.waitForSelector( '#test_tinymce_id' );
		const content = await page.$eval(
			'#test_tinymce_id',
			( textarea ) => textarea.value
		);

		/*
		 * `content` may or may not contain the <p> tags depending on hasWpautop value in this line:
		 * https://github.com/WordPress/wordpress-develop/blob/2382765afa36e10bf3c74420024ad4e85763a47c/src/js/_enqueues/vendor/tinymce/plugins/wordpress/plugin.js#L15
		 *
		 * Now, for the purposes of this e2e test we explicitly set wpautop to true in the test plugin:
		 * https://github.com/WordPress/gutenberg/blob/3da717b8d0ac7d7821fc6d0475695ccf3ae2829f/packages/e2e-tests/plugins/wp-editor-metabox.php#L36
		 *
		 * If this test randomly fails because of the actual value being wrapped in <p> like <p>Typing in a metabox</p>, it means that
		 * hasWpautop has been errorneously set to false in the line above. You may want to check:
		 * * Is window.wp.editor.autop a function? It should be one since https://github.com/WordPress/gutenberg/pull/33228
		 * * Is wpautop still true in the second link mentioned in this comment?
		 *
		 * For more context, see https://github.com/WordPress/gutenberg/pull/33228/files#r666897885
		 */
		expect( content ).toBe( 'Typing in a metabox' );
	} );
} );
