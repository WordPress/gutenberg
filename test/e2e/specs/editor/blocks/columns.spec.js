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

	test( 'prevent the removal of locked column block from the column count change UI', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		// Open Columns
		await editor.insertBlock( { name: 'core/columns' } );
		await page
			.locator( '[aria-label="Three columns; equal split"]' )
			.click();

		// Lock last column block
		await editor.selectBlocks(
			page.locator( 'role=document[name="Block: Column (3 of 3)"i]' )
		);
		await editor.clickBlockToolbarButton( 'Options' );
		await page.click( 'role=menuitem[name="Lock"i]' );
		await page.locator( 'role=checkbox[name="Prevent removal"i]' ).check();
		await page.click( 'role=button[name="Apply"i]' );

		// Select columns block
		await editor.selectBlocks(
			page.locator( 'role=document[name="Block: Columns"i]' )
		);

		const columnsChangeInput = page.locator(
			'role=spinbutton[name="Columns"i]'
		);

		// The min attribute should take into account locked columns
		await expect( columnsChangeInput ).toHaveAttribute( 'min', '3' );

		// Changing the number of columns should take into account locked columns
		await page.fill( 'role=spinbutton[name="Columns"i]', '1' );
		await pageUtils.pressKeys( 'Tab' );
		await expect( columnsChangeInput ).toHaveValue( '3' );
	} );
} );
