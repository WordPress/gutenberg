const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// Valid markup that `save` would write differently: attribute order and
// style formatting.
const heading = `<!-- wp:heading {"style":{"color":{"text":"#ff6347"}}} -->
<h2 style="color: #ff6347;" class="wp-block-heading has-text-color">Tip</h2>
<!-- /wp:heading -->`;

test.describe( 'Untouched blocks', () => {
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'should save as loaded when another block changes', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const { id } = await requestUtils.createPost( {
			content: `${ heading }

<!-- wp:paragraph -->
<p>Hello</p>
<!-- /wp:paragraph -->`,
		} );
		await admin.editPost( id );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' world' );

		expect( await editor.getEditedPostContent() ).toBe( `${ heading }

<!-- wp:paragraph -->
<p>Hello world</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'should keep the markup of a parent when a child changes', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const group = (
			text
		) => `<!-- wp:group {"style":{"color":{"text":"#ff6347"}}} -->
<div style="color: #ff6347;" class="wp-block-group has-text-color"><!-- wp:paragraph -->
<p>${ text }</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->`;
		const { id } = await requestUtils.createPost( {
			content: group( 'Hello' ),
		} );
		await admin.editPost( id );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' world' );

		expect( await editor.getEditedPostContent() ).toBe(
			group( 'Hello world' )
		);
	} );

	test( 'should regenerate a parent when a child is added', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const { id } = await requestUtils.createPost( {
			content: `<!-- wp:group {"style":{"color":{"text":"#ff6347"}}} -->
<div style="color: #ff6347;" class="wp-block-group has-text-color"><!-- wp:paragraph -->
<p>Hello</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->`,
		} );
		await admin.editPost( id );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'world' );

		expect( await editor.getEditedPostContent() )
			.toBe( `<!-- wp:group {"style":{"color":{"text":"#ff6347"}}} -->
<div class="wp-block-group has-text-color" style="color:#ff6347"><!-- wp:paragraph -->
<p>Hello</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>world</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->` );
	} );

	test( 'should keep an unknown block when another block changes', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const unknown = `<!-- wp:not/registered -->
<p>Unknown</p>
<!-- /wp:not/registered -->`;
		const { id } = await requestUtils.createPost( {
			content: `${ unknown }

<!-- wp:paragraph -->
<p>Hello</p>
<!-- /wp:paragraph -->`,
		} );
		await admin.editPost( id );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' world' );

		expect( await editor.getEditedPostContent() ).toBe( `${ unknown }

<!-- wp:paragraph -->
<p>Hello world</p>
<!-- /wp:paragraph -->` );
	} );
} );
