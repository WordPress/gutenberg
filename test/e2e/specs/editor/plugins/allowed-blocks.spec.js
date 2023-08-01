/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Allowed Blocks Filter', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-allowed-blocks' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-allowed-blocks' );
	} );

	test( 'should restrict the allowed blocks in the inserter', async ( {
		page,
	} ) => {
		// The paragraph block is available.
		await page.getByRole('button', { name: 'Toggle block inserter' }).click();

		await page.getByPlaceholder('Search', { exact: true }).fill('Paragraph');

		expect(  page.getByRole('option', { name: 'Paragraph' }) ).toBeVisible();

		// The gallery block is not available.
		await page.getByPlaceholder('Search', { exact: true }).click({
			clickCount: 3
		  });
		await page.keyboard.press( 'Backspace' );

		await page.getByPlaceholder('Search', { exact: true }).fill('Gallery');

		expect( page.getByRole('option', { name: 'Gallery' })).toBeHidden()
	} );

	test( 'should remove not allowed blocks from the block manager', async ( {
		page,
	} ) => {
		await page.getByRole('button', { name: 'Options' }).click();

		await page.getByRole('menuitem', { name: 'Preferences' }).click();

		await page.getByRole('tab', { name: 'Blocks' }).click();

		const BLOCK_LABEL_SELECTOR =
			'.edit-post-block-manager__checklist-item .components-checkbox-control__label';
		const blocks = await page.evaluate( ( selector ) => {
			return Array.from( document.querySelectorAll( selector ) )
				.map( ( element ) => ( element.innerText || '' ).trim() )
				.sort();
		}, BLOCK_LABEL_SELECTOR );
		expect( blocks ).toEqual( [ 'Image', 'Paragraph' ] );
	} );
} );
