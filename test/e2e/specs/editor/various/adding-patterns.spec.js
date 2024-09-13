/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'adding patterns', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should insert a block pattern', async ( { page, editor } ) => {
		await page.getByLabel( 'Toggle block inserter' ).click();

		await page.getByRole( 'tab', { name: 'Patterns' } ).click();
		await page.fill(
			'role=region[name="Block Library"i] >> role=searchbox[name="Search for blocks and patterns"i]',
			'Standard'
		);

		await page.getByRole( 'option', { name: 'Standard' } ).click();
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/query',
			},
		] );
	} );
} );
