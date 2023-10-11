/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	ChildBook: async ( { page }, use ) => {
		await use( new ChildBook( { page } ) );
	},
} );

test.describe( 'Child Blocks', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-child-blocks' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-child-blocks' );
	} );

	test( 'are hidden from the global block inserter', async ( {
		page,
		ChildBook,
	} ) => {
		await page
			.getByRole( 'button', { name: 'Toggle block inserter' } )
			.click();
		await expect(
			await ChildBook.getAllBlockInserterItemTitles()
		).not.toContain( 'Child Blocks Child' );
	} );

	test( 'shows up in a parent block', async ( {
		page,
		editor,
		ChildBook,
	} ) => {
		await editor.insertBlock( {
			name: 'test/child-blocks-unrestricted-parent',
		} );

		await page.click(
			'[data-type="test/child-blocks-unrestricted-parent"] .block-editor-default-block-appender'
		);
		await page
			.getByRole( 'button', { name: 'Toggle block inserter' } )
			.click();
		const inserterItemTitles =
			await ChildBook.getAllBlockInserterItemTitles();
		expect( inserterItemTitles ).toContain( 'Child Blocks Child' );
		expect( inserterItemTitles.length ).toBeGreaterThan( 10 );
	} );

	test( 'display in a parent block with allowedItems', async ( {
		page,
		editor,
		ChildBook,
	} ) => {
		await editor.insertBlock( {
			name: 'test/child-blocks-restricted-parent',
		} );

		await page.click(
			'[data-type="test/child-blocks-restricted-parent"] .block-editor-default-block-appender'
		);
		await page
			.getByRole( 'button', { name: 'Toggle block inserter' } )
			.click();
		const allowedBlocks = await ChildBook.getAllBlockInserterItemTitles();
		expect( allowedBlocks.sort() ).toEqual( [
			'Child Blocks Child',
			'Image',
			'Paragraph',
		] );
	} );
} );

class ChildBook {
	constructor( { page } ) {
		this.page = page;
	}

	async getAllBlockInserterItemTitles() {
		const inserterItemTitles = await this.page.evaluate( () => {
			return Array.from(
				document.querySelectorAll(
					'.block-editor-block-types-list__item-title'
				)
			).map( ( inserterItem ) => {
				return inserterItem.innerText;
			} );
		} );
		return [ ...new Set( inserterItemTitles ) ];
	}
}
