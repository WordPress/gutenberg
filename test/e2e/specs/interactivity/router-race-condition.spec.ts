/**
 * E2E tests: Interactivity API router hydration race condition.
 *
 * Covers the bug in #75778 fixed in #76053.
 *
 * The test/router-race-condition block declares the router as a STATIC
 * dependency in view.asset.php ( 'import' => 'static' ). This places the
 * router in the initial ES module graph so its module-level code always
 * runs before hydrateRegions() populates initialVdom, making the race
 * deterministic in every browser and every CI run.
 *
 * Without the fix: router reads empty initialVdom, calls toVdom() on the
 * full document, marks every island in hydratedIslands, hydrateRegions()
 * skips all islands, dead DOM on every load.
 *
 * With initialVdomPromise: router awaits the promise, hydrateRegions()
 * runs normally, all bindings are attached.
 */

import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test.describe( 'Interactivity API router hydration race condition', () => {
	let pageId: number;

	test.beforeAll( async ( { requestUtils } ) => {
		const createdPage = await requestUtils.createPage( {
			title: 'Router race condition test',
			content: '<!-- wp:test/router-race-condition /-->',
			status: 'publish',
		} );
		pageId = createdPage.id;
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPages();
	} );

	/**
	 * context-counter: data-wp-on--click bound to local context.
	 * If hydration is skipped the binding is never attached, clicks have
	 * no effect, and the assertion times out -- reproducing dead DOM.
	 */
	test( 'context-driven binding works when router is a static dependency', async ( {
		page,
	} ) => {
		await page.goto( `/?p=${ pageId }` );

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
		page,
	} ) => {
		await page.goto( `/?p=${ pageId }` );

		const button = page.getByTestId( 'global-counter' );

		await expect( button ).toHaveText( '0' );

		await button.click();
		await expect( button ).toHaveText( '1' );

		await button.click();
		await expect( button ).toHaveText( '2' );
	} );
} );
