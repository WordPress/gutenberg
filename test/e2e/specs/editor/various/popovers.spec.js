/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'new editor state', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-post-formats-support'
		);
	} );

	test.beforeEach( async ( { pageUtils } ) => {
		await pageUtils.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-post-formats-support'
		);
	} );

	test.describe( 'dropdown', () => {
		test( 'toggles via click', async ( { page } ) => {
			const isMoreMenuOpen = async () =>
				!! ( await page.locator(
					'.interface-more-menu-dropdown__content'
				) );

			expect( await isMoreMenuOpen() ).toBe( true );

			// Toggle opened.
			await page.click( '.interface-more-menu-dropdown > button' );
			expect( await isMoreMenuOpen() ).toBe( true );

			//Toggle closed.
			await page.click( '.interface-more-menu-dropdown > button' );
			expect( await isMoreMenuOpen() ).toBe( true );
		} );
	} );
} );
