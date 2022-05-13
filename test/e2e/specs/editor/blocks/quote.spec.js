/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'adding a quote', () => {
	test( 'should allow the user to type right away', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();

		// Inserting a quote block
		await editor.insertBlock( {
			name: 'core/quote',
		} );

		// Type content right after.
		await page.keyboard.type( 'Quote content' );

		// Check the content
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:quote -->
<blockquote class="wp-block-quote"><p>Quote content</p></blockquote>
<!-- /wp:quote -->`
		);
	} );
} );
