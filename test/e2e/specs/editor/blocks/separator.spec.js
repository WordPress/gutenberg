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
		// Should be able to keep typing after the separator transform.
		await page.keyboard.type( '---a' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/separator',
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: 'a',
				},
			},
		] );
	} );
} );
