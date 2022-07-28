/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'adding blocks', () => {
	test( 'Should switch to the plain style of the quote block', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();

		// Inserting a quote block
		await editor.insertBlock( {
			name: 'core/quote',
			attributes: { value: '<p>Quote content</p>' },
		} );

		// Select the quote block.
		await page.keyboard.press( 'ArrowDown' );

		await editor.clickBlockToolbarButton( 'Quote' );

		await page.click( 'role=menuitem[name="Plain"i]' );

		// Check the content
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:quote {"className":"is-style-plain"} -->
<blockquote class="wp-block-quote is-style-plain"><!-- wp:paragraph -->
<p>Quote content</p>
<!-- /wp:paragraph --></blockquote>
<!-- /wp:quote -->`
		);
	} );
} );
