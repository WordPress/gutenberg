/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'preferences', () => {
	test( 'remembers sidebar dismissal between sessions', async ( {
		page,
		admin,
	} ) => {
		const post = 'role=button[name="Post (selected)"i]';
		await admin.createNewPost();
		// Open by default.

		await expect( page.locator( post ) ).toHaveText( 'Post' );

		// Change to "Block" tab.
		await page.click( 'role=button[name="Block"i]' );

		await expect(
			page.locator( 'role=button[name="Block (selected)"i]' )
		).toHaveText( 'Block' );

		// Regression test: Reload resets to document tab.
		//
		// See: https://github.com/WordPress/gutenberg/issues/6377
		// See: https://github.com/WordPress/gutenberg/pull/8995
		await page.reload();
		await expect( page.locator( post ) ).toHaveText( 'Post' );

		// Dismiss.
		await page.click( 'role=button[name="Close settings"i]' );
		await expect( page.locator( post ) ).not.toBeVisible();

		// Remember after reload.
		await page.reload();

		await expect( page.locator( post ) ).not.toBeVisible();
	} );
} );
