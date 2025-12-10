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
		await page
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();

		const searchbox = page
			.getByRole( 'region', { name: 'Block Library' } )
			.getByRole( 'searchbox', {
				name: 'Search',
			} );

		await searchbox.fill( 'Paragraph' );

		await expect(
			page.getByRole( 'option', { name: 'Paragraph' } )
		).toBeVisible();

		// The gallery block is not available.
		await searchbox.click( {
			clickCount: 3,
		} );
		await page.keyboard.press( 'Backspace' );

		await searchbox.fill( 'Gallery' );

		await expect(
			page.getByRole( 'option', { name: 'Gallery' } )
		).toBeHidden();
	} );

	test( 'should remove not allowed blocks from the block manager', async ( {
		page,
	} ) => {
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();

		await page.getByRole( 'menuitem', { name: 'Preferences' } ).click();

		await page.getByRole( 'tab', { name: 'Blocks' } ).click();

		await expect(
			page
				.getByRole( 'region', { name: 'Available block types' } )
				.getByRole( 'listitem' )
		).toHaveText( [ 'Paragraph', 'Image' ] );
	} );
} );
