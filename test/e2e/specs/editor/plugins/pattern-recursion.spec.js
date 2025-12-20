/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Preventing Pattern Recursion (client)', () => {
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

test.describe( 'Preventing Pattern Recursion (server)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-protection-against-recursive-patterns'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-protection-against-recursive-patterns'
		);
	} );

	test( 'prevents infinite loops due to recursive patterns', async ( {
		page,
		editor,
	} ) => {
		// Click the Block Inserter button
		await page
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();
		// Click the Patterns tab
		await page.getByRole( 'tab', { name: 'Patterns' } ).click();
		// Click the Uncategorized tab
		await page.getByRole( 'tab', { name: 'Uncategorized' } ).click();
		// Click the Evil recursive pattern
		await page.getByRole( 'option', { name: 'Evil recursive' } ).click();
		// By simply checking the editor content, we know that the pattern
		// endpoint did not crash.
		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Hello' },
			},
			{
				name: 'core/paragraph',
				attributes: { content: 'Hello' },
			},
		] );
	} );
} );
