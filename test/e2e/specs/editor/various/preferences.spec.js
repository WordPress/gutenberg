/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'preferences', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'remembers sidebar dismissal between sessions', async ( {
		page,
	} ) => {
		// Open by default.
		await expect(
			page.locator( "button[aria-label='Post (selected)']" )
		).toHaveText( 'Post' );

		// Change to "Block" tab.
		await page.click( 'role=button[name="Block"i]' );

		await expect(
			page.locator( "button[aria-label='Block (selected)']" )
		).toHaveText( 'Block' );

		// Regression test: Reload resets to document tab.
		//
		// See: https://github.com/WordPress/gutenberg/issues/6377
		// See: https://github.com/WordPress/gutenberg/pull/8995
		await page.reload();
		await page.waitForSelector( '.edit-post-layout' );
		await expect(
			page.locator( "button[aria-label='Post (selected)']" )
		).toHaveText( 'Post' );

		// Dismiss.
		await page.click(
			'.edit-post-sidebar__panel-tabs [aria-label="Close settings"]'
		);
		await expect(
			page.locator( '.edit-post-sidebar__panel-tab.is-active' )
		).not.toBeVisible();

		// Remember after reload.
		await page.reload();
		await page.waitForSelector( '.edit-post-layout' );
		await expect(
			page.locator( '.edit-post-sidebar__panel-tab.is-active' )
		).not.toBeVisible();
	} );
} );
