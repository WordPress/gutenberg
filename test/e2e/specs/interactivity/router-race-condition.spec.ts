import { test, expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * Covers the race condition from #75778 fixed in #76053.
 *
 * The test/router-race-condition block declares the router as a STATIC
 * dependency in view.asset.php ('import' => 'static'). This places the
 * router at the root of the ES module graph so its module-level code
 * always runs before hydrateRegions() populates initialVdom -- making
 * the race deterministic in all browsers, not just Firefox and Safari.
 *
 * Without the fix:
 *   router reads empty initialVdom -> calls toVdom() on full document ->
 *   every island is added to hydratedIslands -> hydrateRegions() skips
 *   all islands -> dead DOM, no event listeners attached.
 *
 * With the fix (initialVdomPromise):
 *   router awaits the promise before reading initialVdom ->
 *   hydrateRegions() runs normally -> all bindings attached.
 */
test.describe( 'Interactivity API router hydration race condition', () => {
	/**
	 * context-counter: data-wp-on--click bound to local context.
	 * If hydration is skipped the click has no effect and the assertion
	 * times out, reproducing the dead DOM observable in #75778.
	 */
	test( 'context-driven binding works when router is a static dependency', async ( {
		page,
		admin,
	} ) => {
		await admin.createNewPost( { postType: 'page' } );
		await admin.insertBlock( 'test/router-race-condition' );
		await admin.publishPost();

		await page.goto( page.url() );

		const button = page.getByTestId( 'context-counter' );

		await expect( button ).toHaveText( '0' );

		await button.click();
		await expect( button ).toHaveText( '1' );

		await button.click();
		await expect( button ).toHaveText( '2' );
	} );

	/**
	 * global-counter: data-wp-on--click bound to global state.
	 * Tests that state-driven bindings are also correctly hydrated when
	 * the router is loaded statically.
	 */
	test( 'global-state binding works when router is a static dependency', async ( {
		page,
		admin,
	} ) => {
		await admin.createNewPost( { postType: 'page' } );
		await admin.insertBlock( 'test/router-race-condition' );
		await admin.publishPost();

		await page.goto( page.url() );

		const button = page.getByTestId( 'global-counter' );

		await expect( button ).toHaveText( '0' );

		await button.click();
		await expect( button ).toHaveText( '1' );

		await button.click();
		await expect( button ).toHaveText( '2' );
	} );
} );
