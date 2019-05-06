/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	publishPost,
} from '@wordpress/e2e-test-utils';

// This test isn't reliable on Travis and fails from time to time.
// See: https://github.com/WordPress/gutenberg/pull/15211.
describe.skip( 'WP Editor Meta Boxes', () => {
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

		// Type something
		await page.click( '#test_tinymce_id-html' );
		await page.type( '#test_tinymce_id', 'Typing in a metabox' );
		await page.click( '#test_tinymce_id-tmce' );

		await publishPost();

		await page.reload();

		await page.click( '#test_tinymce_id-html' );
		const content = await page.$eval(
			'#test_tinymce_id',
			( textarea ) => textarea.value
		);

		expect( content ).toMatchSnapshot();
	} );
} );
