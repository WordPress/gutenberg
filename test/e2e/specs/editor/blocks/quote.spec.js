/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'adding a quote', () => {
	test( 'should allow the user to type right away', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.createNewPost();

		// Inserting a quote block
		await pageUtils.insertBlock( {
			name: 'core/quote',
		} );

		// Type content right after.
		await page.keyboard.type( 'Quote content' );

		// Check the content
		const content = await pageUtils.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:quote -->
<blockquote class="wp-block-quote"><!-- wp:paragraph -->
<p>Quote content</p>
<!-- /wp:paragraph --></blockquote>
<!-- /wp:quote -->`
		);
	} );
} );
