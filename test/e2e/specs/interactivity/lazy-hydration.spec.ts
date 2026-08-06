/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Lazy hydration and the router', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		const next = await utils.addPostWithBlock(
			'test/router-lazy-hydration',
			{
				alias: 'lazy hydration - page 2',
				attributes: { page: 2 },
			}
		);
		await utils.addPostWithBlock( 'test/router-lazy-hydration', {
			alias: 'lazy hydration - page 1',
			attributes: { page: 1, next },
		} );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'lazy hydration - page 1' ) );

		// Wait for the router region to hydrate so the `next` link's click
		// handler is attached — otherwise the browser follows the raw link
		// (full reload) instead of a client-side navigation. This results in
		// sporadic test failures.
		await expect( page.getByTestId( 'region-hydrated' ) ).toHaveText(
			'yes'
		);
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'should navigate without scrolling and hydrate the below-fold island', async ( {
		page,
	} ) => {
		const belowHydrated = page.getByTestId( 'below-hydrated' );
		const belowButton = page.getByTestId( 'below-button' );

		// Navigate client-side. The router force-hydrates the current page's
		// remaining islands before rendering — including the below-the-fold
		// island the observer hasn't reached yet.
		await page.getByTestId( 'next' ).click();

		await expect( page.getByTestId( 'region-ssr' ) ).toHaveText(
			'content from page 2'
		);
		await expect( belowHydrated ).toHaveText( 'yes' );
		await belowButton.click();
		await expect( belowButton ).toHaveText( '1' );
	} );

	test( 'should navigate after partially scrolling and hydrate the remaining island', async ( {
		page,
	} ) => {
		const deepHydrated = page.getByTestId( 'deep-hydrated' );
		const deepButton = page.getByTestId( 'deep-button' );

		// Scroll partway: the mid island hydrates via the observer.
		await page.evaluate( () => window.scrollTo( 0, 3000 ) );
		await expect( page.getByTestId( 'below-hydrated' ) ).toHaveText(
			'yes'
		);

		// Navigate client-side. The router force-hydrates the remaining
		// (deep) island before rendering.
		await page.getByTestId( 'next' ).click();

		await expect( page.getByTestId( 'region-ssr' ) ).toHaveText(
			'content from page 2'
		);
		await expect( deepHydrated ).toHaveText( 'yes' );
		await deepButton.click();
		await expect( deepButton ).toHaveText( '1' );
	} );

	test( 'should navigate after scrolling everything into view', async ( {
		page,
	} ) => {
		// Scroll through the page so the observer hydrates each island as it
		// approaches the viewport. (Scrolling straight to the bottom would
		// leave the mid island stranded above the observer's rootMargin.)
		await page.evaluate( () => window.scrollTo( 0, 3000 ) );
		await expect( page.getByTestId( 'below-hydrated' ) ).toHaveText(
			'yes'
		);
		await page.evaluate( () =>
			window.scrollTo( 0, document.body.scrollHeight )
		);
		await expect( page.getByTestId( 'deep-hydrated' ) ).toHaveText( 'yes' );

		await page.getByTestId( 'next' ).click();

		await expect( page.getByTestId( 'region-ssr' ) ).toHaveText(
			'content from page 2'
		);
		await page.getByTestId( 'below-button' ).click();
		await expect( page.getByTestId( 'below-button' ) ).toHaveText( '1' );
	} );

	test( 'should hydrate below-the-fold islands when the idle sweep fires, then navigate', async ( {
		page,
	} ) => {
		const belowHydrated = page.getByTestId( 'below-hydrated' );
		const belowButton = page.getByTestId( 'below-button' );

		// The real idle sweep runs (within the 2000ms timeout on an idle
		// page), hydrating the below-the-fold island without any scrolling.
		// Auto-waiting handles the timing.
		await expect( belowHydrated ).toHaveText( 'yes' );

		await belowButton.click();
		await expect( belowButton ).toHaveText( '1' );

		// Navigation still works after the sweep.
		await page.getByTestId( 'next' ).click();
		await expect( page.getByTestId( 'region-ssr' ) ).toHaveText(
			'content from page 2'
		);
	} );

	test( 'should not auto-hydrate raw HTML inserted after load (developers should use renderElement)', async ( {
		page,
	} ) => {
		// Wait for the idle sweep to have fired: `below-hydrated` only turns
		// "yes" via the sweep (the island is below the observer's reach
		// without scrolling), so this guarantees `hydrateAllRemaining` has
		// already run and is now one-shot.
		await expect( page.getByTestId( 'below-hydrated' ) ).toHaveText(
			'yes'
		);

		// Insert an island via raw HTML, bypassing the interactivity API's
		// rendering helpers.
		await page.evaluate( () => {
			document.body.insertAdjacentHTML(
				'beforeend',
				'<div data-wp-interactive="router-lazy-hydration" data-testid="raw-island"><button data-testid="raw-button" data-wp-text="state.count" data-wp-on--click="actions.increment">0</button></div>'
			);
		} );

		const rawButton = page.getByTestId( 'raw-button' );

		// The raw island stays inert: hydration is one-shot and already ran,
		// so the button's click handler is never attached.
		await expect( rawButton ).toHaveText( '0' );
		await rawButton.click();
		await expect( rawButton ).toHaveText( '0' ); // No change — not hydrated.

		// Navigation does not hydrate it either: `hydrateAllRemaining` is a
		// permanent no-op after its first run. Developers must hydrate
		// injected markup explicitly (e.g. with `renderElement`).
		await page.getByTestId( 'next' ).click();

		await expect( page.getByTestId( 'region-ssr' ) ).toHaveText(
			'content from page 2'
		);
		await expect( rawButton ).toHaveText( '0' );
		await rawButton.click();
		await expect( rawButton ).toHaveText( '0' ); // Still not hydrated.
	} );
} );

test.describe( 'Lazy hydration failure resilience', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		// Page 2 is a plain router page. Page 1 carries the router region
		// plus an island that throws during hydration as a SIBLING block, so
		// the idle sweep reaches it last (after all of the router block's
		// islands, in document order).
		const next = await utils.addPostWithBlock(
			'test/router-lazy-hydration',
			{
				alias: 'lazy hydration failure - page 2',
				attributes: { page: 2 },
			}
		);
		await utils.addPostWithBlocks(
			[
				[ 'test/router-lazy-hydration', { page: 1, next } ],
				[ 'test/throwing-island' ],
			],
			{ alias: 'lazy hydration failure - page 1' }
		);
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'lazy hydration failure - page 1' ) );

		// Wait for the router region to hydrate so the `next` link's click
		// handler is attached — otherwise the browser follows the raw link
		// (full reload) instead of a client-side navigation.
		await expect( page.getByTestId( 'region-hydrated' ) ).toHaveText(
			'yes'
		);
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'should keep the router working when an island throws during the idle sweep', async ( {
		page,
	} ) => {
		// The idle sweep hydrates islands in document order: router region,
		// below, deep — and the throwing island comes next. The deep island
		// is far below the fold (only reachable via the sweep), so once it
		// has flipped, the sweep has already attempted — and, pre-fix,
		// thrown at — the throwing island. `initialVdomPromise` therefore
		// never resolved and the initial page was never cached by the router.
		await expect( page.getByTestId( 'deep-hydrated' ) ).toHaveText(
			'yes'
		);

		// Forward navigation still works: the router prefetches the
		// destination page independently of the initial-page cache. The
		// marker surviving proves this was a client-side navigation.
		await page.evaluate( () => {
			( window as any ).__clientSideNavMarker = true;
		} );
		await page.getByTestId( 'next' ).click();
		await expect( page.getByTestId( 'region-ssr' ) ).toHaveText(
			'content from page 2'
		);
		expect(
			await page.evaluate( () => ( window as any ).__clientSideNavMarker )
		).toBe( true );

		// Back navigation must restore the initial page from the router
		// cache. With a throwing island, the initial page is never cached,
		// so the router falls back to a full page reload, which wipes the
		// marker.
		await page.getByTestId( 'back' ).click();
		await expect( page.getByTestId( 'region-ssr' ) ).toHaveText(
			'content from page 1'
		);
		expect(
			await page.evaluate( () => ( window as any ).__clientSideNavMarker )
		).toBe( true );
	} );
} );
