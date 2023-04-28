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
		await page.click( 'role=button[name="Add default block"i]' );

		await page.keyboard.type( 'test' );
		await editor.transformBlockTo( 'core/quote' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/quote',
			},
		] );

		await editor.transformBlockTo( 'core/pullquote' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/pullquote',
			},
		] );
		await editor.transformBlockTo( 'core/quote' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/quote',
			},
		] );
	} );
} );
