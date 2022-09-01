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
	} ) => {
		// Loading it this way forces the nested block settings to be loaded, which in itself technically tests the new nested block settings code.
		await editor.insertBlock( {
			name: 'core/quote',
			innerBlocks: [
				{
					name: 'core/heading',
				},
				{
					name: 'core/media-text',
					innerBlocks: [
						{
							name: 'core/heading',
						},
					],
				},
			],
		} );

		const editedPostContent = await editor.getEditedPostContent();
		expect( editedPostContent ).toBe(
			`<!-- wp:quote -->
<blockquote class="wp-block-quote"><!-- wp:heading -->
<h2></h2>
<!-- /wp:heading -->

<!-- wp:media-text -->
<div class="wp-block-media-text alignwide is-stacked-on-mobile"><figure class="wp-block-media-text__media"></figure><div class="wp-block-media-text__content"><!-- wp:heading -->
<h2></h2>
<!-- /wp:heading --></div></div>
<!-- /wp:media-text --></blockquote>
<!-- /wp:quote -->`
		);

		//To-Do: Verify the correct style is shown for the above set of blocks.
	} );
} );
