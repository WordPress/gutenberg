/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Content-only lock', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should be able to edit the content of blocks with content-only lock', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Add content only locked block in the code editor
		await pageUtils.pressKeys( 'secondary+M' ); // Emulates CTRL+Shift+Alt + M => toggle code editor

		await page.getByPlaceholder( 'Start writing with text or HTML' )
			.fill( `<!-- wp:group {"templateLock":"contentOnly","layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>Hello</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->` );

		await pageUtils.pressKeys( 'secondary+M' );
		await editor.canvas
			.locator( 'role=document[name="Block: Paragraph"i]' )
			.click();
		await page.keyboard.type( ' World' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	// See: https://github.com/WordPress/gutenberg/pull/54618
	test( 'should be able to edit the content of deeply nested blocks', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Add content only locked block in the code editor
		await pageUtils.pressKeys( 'secondary+M' ); // Emulates CTRL+Shift+Alt + M => toggle code editor

		await page.getByPlaceholder( 'Start writing with text or HTML' )
			.fill( `<!-- wp:group {"templateLock":"contentOnly","layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>Hello</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->` );

		await pageUtils.pressKeys( 'secondary+M' );
		await editor.canvas
			.locator( 'role=document[name="Block: Paragraph"i]' )
			.click();
		await page.keyboard.type( ' WP' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/group',
				attributes: {
					layout: { type: 'constrained' },
					templateLock: 'contentOnly',
				},
				innerBlocks: [
					{
						name: 'core/group',
						attributes: { layout: { type: 'constrained' } },
						innerBlocks: [
							{
								name: 'core/paragraph',
								attributes: { content: 'Hello WP' },
							},
						],
					},
				],
			},
		] );
	} );
} );
