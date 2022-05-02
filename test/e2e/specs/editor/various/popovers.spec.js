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
			const moreMenu = page.locator( 'role=menu[name="Options"i]' );
			const moreMenuToggleButton = page.locator(
				'role=button[name="Options"i]'
			);
			await expect( moreMenu ).not.toBeVisible();
			// Toggle opened.
			await moreMenuToggleButton.click();
			await expect( moreMenu ).toBeVisible();

			//Toggle closed.
			await moreMenuToggleButton.click();
			await expect( moreMenu ).not.toBeVisible();
		} );
	} );
} );
