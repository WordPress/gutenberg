/**
 * WordPress dependencies
 */
import {
	createNewPost,
	clickBlockToolbarButton,
	insertBlock,
	getEditedPostContent,
} from '@wordpress/e2e-test-utils';

describe( 'adding blocks', () => {
	beforeAll( async () => {
		await createNewPost();
	} );

	it( 'Should switch to the plain style of the quote block', async () => {
		// Inserting a quote block
		await insertBlock( 'Quote' );
		await page.keyboard.type( 'Quote content' );

		await clickBlockToolbarButton( 'Quote' );

		const plainStyleButton = await page.waitForXPath(
			'//*[@role="menuitem"][contains(., "Plain")]'
		);
		await plainStyleButton.click();

		// Check the content
		const content = await getEditedPostContent();
		expect( content ).toMatchInlineSnapshot( `
		"<!-- wp:quote {\\"className\\":\\"is-style-plain\\"} -->
		<blockquote class=\\"wp-block-quote is-style-plain\\"><p>Quote content</p></blockquote>
		<!-- /wp:quote -->"
	` );
	} );
} );
