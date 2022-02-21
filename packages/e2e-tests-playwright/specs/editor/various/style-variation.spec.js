/**
 * Internal dependencies
 */
const { test, expect } = require( '../../../config/test' );

test.describe( 'adding blocks', () => {
	test.beforeAll( async ( { pageUtils } ) => {
		await pageUtils.createNewPost();
	} );

	test( 'Should switch to the plain style of the quote block', async ( {
		page,
		pageUtils,
	} ) => {
		// Inserting a quote block
		await pageUtils.insertBlock( 'Quote' );
		await this.page.keyboard.type( 'Quote content' );

		await pageUtils.clickBlockToolbarButton( 'Quote' );

		const plainStyleButton = await page.locator(
			'button[role="menuitem"]:has-text("Plain")'
		);
		await plainStyleButton.click();

		// Check the content
		const content = await pageUtils.getEditedPostContent();
		expect( content ).toBe( `
		"<!-- wp:quote {\\"className\\":\\"is-style-plain\\"} -->
		<blockquote class=\\"wp-block-quote is-style-plain\\"><p>Quote content</p></blockquote>
		<!-- /wp:quote -->"
	` );
	} );
} );
