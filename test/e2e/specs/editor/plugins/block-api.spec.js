/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Using Block API', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-block-api' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-block-api' );
	} );

	test( 'Inserts the filtered hello world block even when filter added after block registration', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();

		await editor.insertBlock( { name: 'e2e-tests/hello-world' } );

		const blockTitle = page.locator( '.block-editor-block-card__title' );
		await expect( blockTitle ).toHaveText( 'Filtered Hello World' );
	} );
} );
