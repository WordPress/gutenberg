/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Columns', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'restricts all blocks inside the columns block', async ( {
		page,
		editor,
	} ) => {
		// Open Columns
		await editor.insertBlock( { name: 'core/columns' } );
		await page.locator( '[aria-label="Two columns; equal split"]' ).click();

		// Open List view toggle
		await page.locator( 'role=button[name="Document Overview"i]' ).click();

		// block column add
		await page
			.locator(
				'role=treegrid[name="Block navigation structure"i] >> role=gridcell[name="Column link"i]'
			)
			.first()
			.click();

		// Toggle Block inserter
		await page
			.locator( 'role=button[name="Toggle block inserter"i]' )
			.click();

		// Verify Column
		const inserterOptions = page.locator(
			'role=region[name="Block Library"i] >> role=option'
		);
		await expect( inserterOptions ).toHaveCount( 1 );
		await expect( inserterOptions ).toHaveText( 'Column' );
	} );
} );
