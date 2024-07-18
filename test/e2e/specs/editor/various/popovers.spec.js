/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'popovers', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.describe( 'dropdown', () => {
		test( 'toggles via click', async ( { page } ) => {
			const moreMenu = page.locator( 'role=menu[name="Options"i]' );
			const moreMenuToggleButton = page.locator(
				'role=button[name="Options"i]'
			);
			await expect( moreMenu ).toBeHidden();
			// Toggle opened.
			await moreMenuToggleButton.click();
			await expect( moreMenu ).toBeVisible();

			// Toggle closed.
			await moreMenuToggleButton.click();
			await expect( moreMenu ).toBeHidden();
		} );
	} );
} );
