/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'adding blocks', () => {
	test( 'Should switch to the plain style of the quote block', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.createNewPost();

		// Inserting a quote block
		await pageUtils.insertBlock( 'Quote' );
		await page.keyboard.type( 'Quote content' );

		await pageUtils.clickBlockToolbarButton( 'Quote' );

		const plainStyleButton = await page.locator(
			'button[role="menuitem"]:has-text("Plain")'
		);
		await plainStyleButton.click();

		// Check the content
		const quoteContent = `<!-- wp:quote {\\"className\\":\\"is-style-plain\\"} --><blockquote class=\\"wp-block-quote is-style-plain\\"><p>Quote content</p></blockquote><!-- /wp:quote -->`;

		const content = await pageUtils.getEditedPostContent();
		expect( content ).toBe( quoteContent );
	} );
} );
