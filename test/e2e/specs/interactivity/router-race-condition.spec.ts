/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

/**
 * Covers the race condition from #75778 fixed in #76053.
 *
 * The test/router-race-condition block declares the router as a STATIC
 * dependency in view.asset.php ('import' => 'static'). This places the
 * router at the root of the ES module graph so its module-level code
 * always runs before hydrateRegions() populates initialVdom -- making
 * the race deterministic in all browsers, not just Firefox and Safari.
 *
 * Without the fix: router reads empty initialVdom -> calls toVdom() on
 * the full document -> every island is added to hydratedIslands ->
 * hydrateRegions() skips all islands -> dead DOM, no event listeners.
 *
 * With initialVdomPromise: router awaits the promise ->
 * hydrateRegions() runs normally -> all bindings attached.
 */
test.describe( 'Interactivity API router hydration race condition (@webkit, @firefox)', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/router-race-condition', {
			alias: 'router-race-condition',
		} );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	/**
	 * context-counter: data-wp-on--click bound to local context.
	 * If hydration is skipped the binding is never attached and clicks
	 * have no effect -- reproducing the dead DOM from #75778.
	 */
	test( 'context-driven binding works when router is a static dependency', async ( {
		interactivityUtils: utils,
		page,
	} ) => {
		await page.goto( utils.getLink( 'router-race-condition' ) );

		const button = page.getByTestId( 'context-counter' );

		await expect( button ).toHaveText( '0' );

		await button.click();
		await expect( button ).toHaveText( '1' );

		await button.click();
		await expect( button ).toHaveText( '2' );
	} );

	/**
	 * global-counter: data-wp-on--click bound to global state.
	 * Tests that state-driven bindings are also correctly hydrated.
	 */
	test( 'global-state binding works when router is a static dependency', async ( {
		interactivityUtils: utils,
		page,
	} ) => {
		await page.goto( utils.getLink( 'router-race-condition' ) );

		const button = page.getByTestId( 'global-counter' );

		await expect( button ).toHaveText( '0' );

		await button.click();
		await expect( button ).toHaveText( '1' );

		await button.click();
		await expect( button ).toHaveText( '2' );
	} );
} );
