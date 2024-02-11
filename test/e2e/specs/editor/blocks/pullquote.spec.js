/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Quote', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be created by converting a quote and converted back to quote', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();

		await page.keyboard.type( 'test' );
		await editor.transformBlockTo( 'core/quote' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/quote',
				attributes: { value: '' },
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: { content: 'test' },
					},
				],
			},
		] );

		await editor.transformBlockTo( 'core/pullquote' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/pullquote',
				attributes: { value: 'test' },
				innerBlocks: [],
			},
		] );
		await editor.transformBlockTo( 'core/quote' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/quote',
				attributes: { value: '' },
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: { content: 'test' },
					},
				],
			},
		] );
	} );
} );
