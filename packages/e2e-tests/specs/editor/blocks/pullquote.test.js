/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	createNewPost,
	transformBlockTo,
} from '@wordpress/e2e-test-utils';

describe( 'Quote', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'can be created by converting a quote and converted back to quote', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'test' );
		await transformBlockTo( 'Quote' );

		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:quote -->
		<blockquote class=\\"wp-block-quote\\"><!-- wp:paragraph -->
		<p>test</p>
		<!-- /wp:paragraph --></blockquote>
		<!-- /wp:quote -->"
	` );

		await transformBlockTo( 'Pullquote' );

		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:pullquote -->
		<figure class=\\"wp-block-pullquote\\"><blockquote><p>test</p></blockquote></figure>
		<!-- /wp:pullquote -->"
	` );

		await transformBlockTo( 'Quote' );

		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:quote -->
		<blockquote class=\\"wp-block-quote\\"><!-- wp:paragraph -->
		<p>test</p>
		<!-- /wp:paragraph --></blockquote>
		<!-- /wp:quote -->"
	` );
	} );
} );
