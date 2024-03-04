/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block context', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-block-context' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-block-context' );
	} );

	test( 'Block context propagates to inner blocks', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'gutenberg/test-context-provider' } );

		const providerBlock = page.getByRole( 'document', {
			name: 'Block: Test Context Provider',
		} );
		const consumerBlock = page.getByRole( 'document', {
			name: 'Block: Test Context Consumer',
		} );

		await expect( consumerBlock ).toBeVisible();

		// Verify initial contents of consumer.
		await expect( consumerBlock ).toHaveText( 'The record ID is: 0' );

		// Change the attribute value associated with the context.
		await providerBlock.getByRole( 'textbox' ).fill( '123' );

		await expect( consumerBlock ).toHaveText( 'The record ID is: 123' );
	} );

	test( 'Block context is reflected in the preview', async ( {
		editor,
		page,
	} ) => {
		const editorPage = page;

		await editor.insertBlock( { name: 'gutenberg/test-context-provider' } );

		// Open the preview page.
		const previewPage = await editor.openPreviewPage();
		const previewContent = previewPage.locator( '.entry-content p' );

		await expect( previewContent ).toHaveText( /^0,\d+,post$/ );

		// Return to editor to change context value to non-default.
		await editorPage.bringToFront();
		await editorPage
			.getByRole( 'document', {
				name: 'Block: Test Context Provider',
			} )
			.getByRole( 'textbox' )
			.fill( '123' );

		await editorPage
			.getByRole( 'button', {
				name: 'View',
				expanded: false,
				exact: true,
			} )
			.click();
		await editorPage
			.getByRole( 'menuitem', { name: 'Preview in new tab' } )
			.click();

		// Check non-default context values are populated.
		await expect( previewContent ).toHaveText( /^123,\d+,post$/ );
		await editorPage.bringToFront();
		await previewPage.close();
	} );
} );
