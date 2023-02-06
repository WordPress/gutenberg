/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Code block', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'should convert to a preformatted block', async ( {
		page,
		editor,
	} ) => {
		const code = 'print "Hello Dolly!"';

		await editor.insertBlock( { name: 'core/code' } );
		await page.keyboard.type( code );

		// Verify the content starts out as a Code block.

		await expect.poll( editor.getEditedPostContent ).toBe( `<!-- wp:code -->
<pre class="wp-block-code"><code>${ code }</code></pre>
<!-- /wp:code -->` );

		await editor.transformBlockTo( 'core/preformatted' );

		// The content should now be a Preformatted block with no data loss.
		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:preformatted -->
<pre class="wp-block-preformatted">${ code }</pre>
<!-- /wp:preformatted -->` );
	} );
} );
