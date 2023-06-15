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
		// Transform to `Stack` variation.
		await editor.clickBlockToolbarButton( 'Stack' );
		const variations = page
			.getByRole( 'menu', { name: 'Stack' } )
			.getByRole( 'group' );
		await expect(
			variations.getByRole( 'menuitem', { name: 'Stack' } )
		).toBeHidden();
		await variations.getByRole( 'menuitem', { name: 'Row' } ).click();
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/group',
				attributes: expect.objectContaining( {
					layout: {
						type: 'flex',
						flexWrap: 'nowrap',
						orientation: undefined,
					},
				} ),
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: { content: '1' },
					},
				],
			},
		] );
		await editor.clickBlockToolbarButton( 'Row' );
		await expect(
			page.locator( 'role=menuitem[name="Stack"i]' )
		).toBeVisible();
	} );
} );
