/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Shortcode', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should transform to a matching block when the text is a single recognized shortcode', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/shortcode',
			attributes: { text: '[gallery ids="1,2,3"]' },
		} );
		await editor.clickBlockToolbarButton( 'Shortcode' );
		await page
			.getByRole( 'menu', { name: 'Shortcode' } )
			.getByRole( 'menuitem', { name: 'Gallery' } )
			.click();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/gallery',
				innerBlocks: [
					{ name: 'core/image', attributes: { id: 1 } },
					{ name: 'core/image', attributes: { id: 2 } },
					{ name: 'core/image', attributes: { id: 3 } },
				],
			},
		] );
	} );

	test( 'should not offer transforms when the text is not a recognized shortcode', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/shortcode',
			attributes: { text: '[totally_unknown_shortcode_tag]' },
		} );
		await editor.clickBlockToolbarButton( 'Shortcode' );

		const transformations = page
			.getByRole( 'menu', { name: 'Shortcode' } )
			.getByRole( 'menuitem' );
		await expect( transformations ).toHaveCount( 3 );
		await expect( transformations ).toHaveText( [
			'Columns',
			'Details',
			'Group',
		] );
	} );

	test( 'should not offer transforms when the text contains more than one shortcode', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/shortcode',
			attributes: {
				text: '[gallery ids="1,2,3"] [gallery ids="4,5,6"]',
			},
		} );
		await editor.clickBlockToolbarButton( 'Shortcode' );

		const transformations = page
			.getByRole( 'menu', { name: 'Shortcode' } )
			.getByRole( 'menuitem' );
		await expect( transformations ).toHaveCount( 3 );
		await expect( transformations ).toHaveText( [
			'Columns',
			'Details',
			'Group',
		] );
	} );
} );
