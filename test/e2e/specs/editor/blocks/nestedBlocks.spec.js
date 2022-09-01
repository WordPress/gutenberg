/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Nested Block Settings', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should output a quote with a heading, media-text with another heading inside', async ( {
		editor,
		page,
	} ) => {
		// Loading it this way forces the nested block settings to be loaded, which in itself technically tests the new nested block settings code.
		await editor.insertBlock( {
			name: 'core/quote',
			innerBlocks: [
				{
					name: 'core/heading',
				},
			],
		} );

		await page.click( '[data-type="core/heading"]' );

		await page.keyboard.type( 'hello' );

		await page.click( 'role=button[name="Text"i]' );

		await expect(
			page.locator( "[aria-label='Color: Red']" )
		).toBeVisible();

		await expect(
			page.locator( "[aria-label='Color: Light']" )
		).toBeHidden();

		const editedPostContent = await editor.getEditedPostContent();
		expect( editedPostContent ).toBe(
			`<!-- wp:quote -->
<blockquote class="wp-block-quote"><!-- wp:heading -->
<h2>hello</h2>
<!-- /wp:heading --></blockquote>
<!-- /wp:quote -->`
		);
	} );
} );
