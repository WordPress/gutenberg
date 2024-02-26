/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Iframed block', () => {
	test.beforeEach( async ( { requestUtils, admin } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-iframed-block' );
		await admin.createNewPost( { postType: 'page' } );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-iframed-block' );
	} );

	test( 'should load script and dependencies in iframe', async ( {
		editor,
	} ) => {
		await editor.insertBlock( { name: 'test/iframed-block' } );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		// Expect the script to load in the iframe, which replaces the block text.
		await expect(
			editor.canvas.locator(
				'role=document[name="Block: Iframed Block"i]'
			)
		).toContainText( 'Iframed Block (set with jQuery)' );
	} );
} );
