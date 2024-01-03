/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Allowed Patterns', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-allowed-patterns' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deactivatePlugin( 'gutenberg-test-allowed-patterns' ),
			requestUtils.deactivatePlugin(
				'gutenberg-test-allowed-patterns-disable-blocks'
			),
		] );
	} );

	test( 'should show all patterns when blocks are not disabled', async ( {
		admin,
		page,
	} ) => {
		await admin.createNewPost();
		await page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Toggle block inserter' } )
			.click();

		await page
			.getByRole( 'region', {
				name: 'Block Library',
			} )
			.getByRole( 'searchbox', {
				name: 'Search for blocks and patterns',
			} )
			.fill( 'Test:' );

		await expect(
			page
				.getByRole( 'listbox', { name: 'Block patterns' } )
				.getByRole( 'option' )
		).toHaveText( [
			'Test: Single heading',
			'Test: Single paragraph',
			'Test: Paragraph inside group',
		] );
	} );

	test( 'should show only allowed patterns when blocks are disabled', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-allowed-patterns-disable-blocks'
		);
		await admin.createNewPost();
		await page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Toggle block inserter' } )
			.click();

		await page
			.getByRole( 'region', {
				name: 'Block Library',
			} )
			.getByRole( 'searchbox', {
				name: 'Search for blocks and patterns',
			} )
			.fill( 'Test:' );

		await expect(
			page
				.getByRole( 'listbox', { name: 'Block patterns' } )
				.getByRole( 'option' )
		).toHaveText( [ 'Test: Single heading' ] );
	} );
} );
