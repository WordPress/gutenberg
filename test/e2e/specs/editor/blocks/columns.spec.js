/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Columns Test', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'Create Columns and verify', async ( { page, editor } ) => {
		// Open Columns
		await editor.insertBlock( { name: 'core/columns' } );
		await page.locator( '[aria-label="Two columns; equal split"]' ).click();

		await page
			.locator( '.edit-post-header-toolbar__list-view-toggle' )
			.click();

		// Verify Column Length
		const list = page.locator(
			' span.block-editor-list-view-block-select-button__title'
		);
		await expect( list ).toHaveCount( 3 );
	} );
} );
