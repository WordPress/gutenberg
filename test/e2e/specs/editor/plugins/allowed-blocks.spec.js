/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Allowed Blocks Filter', () => {
	test.beforeEach( async ( { pageUtils, requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-allowed-blocks' );
		await pageUtils.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-allowed-blocks' );
	} );

	test( 'should restrict the allowed blocks in the inserter (Paragraph)', async ( {
		page,
		pageUtils,
	} ) => {
		// The paragraph block is available.
		await pageUtils.searchForBlock( 'Paragraph' );
		const paragraphBlockButton = await page.locator(
			'button[role="option"]:has-text("Paragraph")'
		);
		await expect( paragraphBlockButton ).toBeVisible();
	} );

	test( 'should restrict the allowed blocks in the inserter (Gallery)', async ( {
		page,
		pageUtils,
	} ) => {
		// The gallery block is not available.
		await pageUtils.searchForBlock( 'Gallery' );

		const galleryBlockButton = await page.locator(
			'button[role="option"]:has-text("Gallery")'
		);
		await expect( galleryBlockButton ).toBeHidden();
	} );

	test( 'should remove not allowed blocks from the block manager', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.clickOnMoreMenuItem( 'Preferences' );
		const blocksTab = await page.locator(
			'button[role="tab"]:has-text("Blocks")'
		);
		await blocksTab.click();

		const BLOCK_LABEL_SELECTOR =
			'.edit-post-block-manager__checklist-item .components-checkbox-control__label';
		const allowedBlocks = await page.locator( BLOCK_LABEL_SELECTOR );

		expect( await allowedBlocks.allTextContents() ).toMatchObject( [
			'Paragraph',
			'Image',
		] );
	} );
} );
