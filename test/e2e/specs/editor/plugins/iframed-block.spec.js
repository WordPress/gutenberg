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

	test( 'Should save the changes', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'test/iframed-block' } );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		await expect(
			page.locator( 'role=document[name="Block: Iframed Block"i]' )
		).toContainText( 'Iframed Block (set with jQuery)' );

		// open page from sidebar settings
		await page.click(
			'role=region[name="Editor settings"i] >> role=button[name="Page"i]'
		);

		// Opens the template editor with a newly created template.
		await page.click( 'role=button[name="Select template"i]' );
		await page.click( 'role=button[name="Add template"i]' );
		await page.fill( 'role=textbox[name="NAME"i]', 'Test template' );
		await page.click( 'role=button[name="Create"i]' );

		// Expect iframe canvas to be visible
		await expect(
			page.locator( 'iframe[name="editor-canvas"]' )
		).toBeVisible();

		// Expect the script to load in the iframe, which replaces the block text.
		const iframedText = page.frameLocator( 'iframe' ).locator( 'body' );
		await expect( iframedText ).toContainText(
			'Iframed Block (set with jQuery)'
		);
	} );
} );
