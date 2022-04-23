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
			const isMoreMenuOpen = page.locator( 'role=menu[name="Options"i]' );
			// Toggle opened.
			await page.click( 'role=button[name="Options"i]' );
			await expect( isMoreMenuOpen ).toBeVisible();

			//Toggle closed.
			await page.click( 'role=button[name="Options"i]' );
			await expect( isMoreMenuOpen ).not.toBeVisible();
		} );
	} );
} );
