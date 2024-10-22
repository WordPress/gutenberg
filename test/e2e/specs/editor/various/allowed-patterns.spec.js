/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Allowed Patterns', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-allowed-patterns' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-allowed-patterns'
		);
	} );

	test( 'should show all patterns by default', async ( { admin, page } ) => {
		await admin.createNewPost();
		await page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();

		await page
			.getByRole( 'region', {
				name: 'Block Library',
			} )
			.getByRole( 'searchbox', {
				name: 'Search',
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

	test.describe( 'with a small subset of allowed blocks', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activatePlugin(
				'gutenberg-test-allowed-patterns-disable-blocks'
			);
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-allowed-patterns-disable-blocks'
			);
		} );

		test( 'should hide patterns with only hidden blocks', async ( {
			admin,
			page,
		} ) => {
			await admin.createNewPost();
			await page
				.getByRole( 'toolbar', { name: 'Document tools' } )
				.getByRole( 'button', { name: 'Block Inserter', exact: true } )
				.click();

			await page
				.getByRole( 'region', {
					name: 'Block Library',
				} )
				.getByRole( 'searchbox', {
					name: 'Search',
				} )
				.fill( 'Test:' );

			await expect(
				page
					.getByRole( 'listbox', { name: 'Block patterns' } )
					.getByRole( 'option' )
			).toHaveText( [ 'Test: Single heading' ] );
		} );
	} );
} );
