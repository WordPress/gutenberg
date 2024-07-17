/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Separator', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be created by three dashes', async ( { editor, page } ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '---' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/separator',
			},
		] );
	} );
} );
