/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Child Blocks', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-child-blocks' );
	} );

	test.beforeEach( async ( { pageUtils } ) => {
		await pageUtils.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-child-blocks' );
	} );

	test( 'are hidden from the global block inserter', async ( {
		pageUtils,
	} ) => {
		await pageUtils.openGlobalBlockInserter();
		await expect(
			await pageUtils.getAllBlockInserterItemTitles()
		).not.toContain( 'Child Blocks Child' );
	} );

	test( 'shows up in a parent block', async ( { page, pageUtils } ) => {
		await pageUtils.insertBlock( 'Child Blocks Unrestricted Parent' );
		await pageUtils.closeGlobalBlockInserter();
		await page.click(
			'[data-type="test/child-blocks-unrestricted-parent"] .block-editor-default-block-appender'
		);
		await pageUtils.openGlobalBlockInserter();
		const inserterItemTitles = await pageUtils.getAllBlockInserterItemTitles();
		expect( inserterItemTitles ).toContain( 'Child Blocks Child' );
		expect( inserterItemTitles.length ).toBeGreaterThan( 20 );
	} );

	test( 'display in a parent block with allowedItems', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.insertBlock( 'Child Blocks Restricted Parent' );
		await pageUtils.closeGlobalBlockInserter();
		await page.click(
			'[data-type="test/child-blocks-restricted-parent"] .block-editor-default-block-appender'
		);
		await pageUtils.openGlobalBlockInserter();
		expect( await pageUtils.getAllBlockInserterItemTitles() ).toEqual( [
			'Child Blocks Child',
			'Image',
			'Paragraph',
		] );
	} );
} );
