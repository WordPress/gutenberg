/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block Switcher', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'Block variation transforms', async ( { editor, page } ) => {
		// This is the `stack` Group variation.
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				layout: {
					type: 'flex',
					orientation: 'vertical',
				},
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: '1' },
				},
			],
		} );
		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:group {"layout":{"type":"flex","orientation":"vertical"}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>1</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->`
		);
		// Transform to `Stack` variation.
		await editor.clickBlockToolbarButton( 'Stack' );
		await expect(
			page.locator( 'role=menuitem[name="Stack"i]' )
		).toBeHidden();
		await page.click( 'role=menuitem[name="Row"i]' );
		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>1</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->`
		);
		await editor.clickBlockToolbarButton( 'Row' );
		await expect(
			page.locator( 'role=menuitem[name="Stack"i]' )
		).toBeVisible();
	} );
} );
