/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	getBlockFunction: async ( { page }, use ) => {
		await use( new GetAllBlockInserterItem( { page } ) );
	},
} );

test.describe( 'Columns Test', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'Create Columns and verify', async ( {
		page,
		editor,
		getBlockFunction,
	} ) => {
		// Open Columns
		await editor.insertBlock( { name: 'core/columns' } );
		await page.locator( '[aria-label="Two columns; equal split"]' ).click();

		// Open List view toggle
		await page.locator( 'role=button[name="List View"i]' ).click();

		await getBlockFunction.get_list_view_block( 'Column' );

		// Toggle Block inserter
		await page
			.locator( 'role=button[name="Toggle block inserter"i]' )
			.click();

		// Verify Column
		expect( await getBlockFunction.get_list_all_block() ).toHaveLength( 1 );
	} );
} );

class GetAllBlockInserterItem {
	constructor( { page } ) {
		this.page = page;
	}

	async get_list_view_block( blockLabel ) {
		return this.page
			.locator(
				`//table[contains(@aria-label,'Block navigation structure')]//a[.//span[text()='${ blockLabel }']]`
			)
			.first()
			.click();
	}
	async get_list_all_block() {
		await this.page.waitForTimeout( 500 );
		const inserterItemTitles = await this.page.evaluate( () => {
			return Array.from(
				document.querySelectorAll(
					'.block-editor-block-types-list__item-title'
				)
			).map( ( inserterItem ) => {
				return inserterItem.innerText;
			} );
		} );
		return [ ...new Set( inserterItemTitles ) ].sort();
	}
}
