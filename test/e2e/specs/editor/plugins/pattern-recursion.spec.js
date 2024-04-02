/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Preventing Pattern Recursion', () => {
	test.beforeEach( async ( { admin, editor, page } ) => {
		await admin.createNewPost();
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/block-editor' ).updateSettings( {
				__experimentalBlockPatterns: [
					{
						name: 'evil/recursive',
						title: 'Evil recursive',
						description: 'Evil recursive',
						content:
							'<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph --><!-- wp:pattern {"slug":"evil/recursive"} /-->',
					},
				],
			} );
		} );
	} );

	test( 'prevents infinite loops due to recursive patterns', async ( {
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'core/pattern',
			attributes: { slug: 'evil/recursive' },
		} );
		const warning = editor.canvas.getByText(
			'Pattern "evil/recursive" cannot be rendered inside itself'
		);
		await expect( warning ).toBeVisible();
	} );
} );
