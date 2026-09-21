/**
 * External dependencies
 */
import type { Page } from '@playwright/test';

/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

type LogEntry = { navigating: string; initiator: string };
type SettlementEntry = {
	url: string;
	marker: string | null;
	serverContextReadout: string | null;
};

/**
 * Reads and parses one of the fixture's two JSON-serialized logs
 * (`state.log` / `state.settlementLog` in `view.js`).
 *
 * @param page   The Playwright page.
 * @param testId Which log to read.
 * @return The parsed log entries.
 */
const readLog = async < T = LogEntry >(
	page: Page,
	testId: 'lifecycle log' | 'settlement log'
): Promise< T[] > => {
	const text = await page.getByTestId( testId ).textContent();
	return JSON.parse( text ?? '[]' );
};

/**
 * Waits, by polling, for one of the fixture's logs to reach the given
 * length. A **positive**, waiting assertion -- used both as the checkpoint
 * a negative assertion must be preceded by, and wherever a flow's own
 * expectation is that a log grows to an exact length.
 *
 * @param page   The Playwright page.
 * @param testId Which log to wait on.
 * @param length The expected length.
 */
const waitForLogLength = async (
	page: Page,
	testId: 'lifecycle log' | 'settlement log',
	length: number
) => {
	await expect
		.poll( async () => ( await readLog( page, testId ) ).length )
		.toBe( length );
};

/**
 * The mandatory settle for every negative assertion in this file: two
 * animation frames flushed inside the page. `afterNextFrame` resolves on a
 * `setTimeout` nested inside its `requestAnimationFrame` callback, so a
 * single flushed frame does not guarantee the flush has run.
 *
 * @param page The Playwright page.
 */
const settle = ( page: Page ) =>
	page.evaluate(
		() =>
			new Promise< void >( ( resolve ) =>
				requestAnimationFrame( () =>
					requestAnimationFrame( () => resolve() )
				)
			)
	);

/**
 * Registers a route on `url` *before* any request against it is expected,
 * holding it open until `release()` is called. This is the held-request
 * idiom from `router-navigate.spec.ts:84-91`, extended with a hit signal
 * (per the operational notes): `hit` resolves the moment the request
 * arrives -- the positive checkpoint that it was really made.
 *
 * **Only ever safe on a resource `fetch()`, never on a main-frame document
 * request.** Holding (or aborting) a main-frame request was probed here and
 * found not to leave the outgoing document's execution context alive and
 * assertable in this environment -- residual R1 fails either way, which is
 * stronger than the plan's own named fallback (`route.abort()`)
 * anticipated. See `readBeforeUnloadLog()` below for the replacement this
 * file uses instead wherever a flow needs to inspect the *outgoing*
 * document's state around a forced full page load.
 *
 * @param page The Playwright page.
 * @param url  The URL to intercept.
 * @return An object with a `hit` promise and a `release` function.
 */
const holdRoute = async ( page: Page, url: string ) => {
	let onHit: () => void;
	let onRelease: () => void;
	const hit = new Promise< void >( ( resolve ) => ( onHit = resolve ) );
	await page.route( url, async ( route ) => {
		onHit();
		await new Promise< void >( ( resolve ) => ( onRelease = resolve ) );
		await route.continue();
	} );
	return { hit, release: () => onRelease() };
};

/**
 * Reads the counted lifecycle log as it stood the moment the *previous*
 * document (on the same origin) was last torn down -- persisted by
 * `view.js`'s `pagehide`/`beforeunload` listener into `localStorage`, which
 * survives a same-origin navigation even when the outgoing document's own
 * execution context does not (residual R1; see the `holdRoute` doc
 * comment). Call this only *after* the forced full page load this flow
 * expects has landed: reading it any earlier would return a stale value
 * from whatever document last unloaded on this origin, or `null` on a
 * browser context that has never unloaded one.
 *
 * @param page The Playwright page, already on the destination document.
 * @return The origin document's last known log, or `[]` if none was ever
 *         persisted.
 */
const readBeforeUnloadLog = async ( page: Page ): Promise< LogEntry[] > => {
	const text = await page.evaluate( () =>
		window.localStorage.getItem(
			'router-navigation-lifecycle:log-before-unload'
		)
	);
	return text ? JSON.parse( text ) : [];
};

test.describe( 'Router navigation lifecycle', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();

		/*
		 * Task 6's inventory, rows 1-7, in the stated topological order.
		 * `addPostWithBlock` creates and returns a post's link in one call
		 * with no update path, so a post's `next`/`other` must already
		 * exist -- every row below is built strictly top to bottom.
		 */

		// Row 1: Flow 9's uncached URL, and the page the forced reload
		// lands on. No flow navigates to it or prefetches it.
		await utils.addPostWithBlock( 'test/router-navigation-lifecycle', {
			alias: 'lifecycle - page 3',
			attributes: { page: 3, regionId: 'lifecycle-a' },
		} );

		// Row 2: Flow 6's second destination.
		const page2b = await utils.addPostWithBlock(
			'test/router-navigation-lifecycle',
			{
				alias: 'lifecycle - page 2b',
				attributes: { page: '2b', regionId: 'lifecycle-a' },
			}
		);

		// Row 3: Flow 12's destination -- discovers `clientNavigationDisabled`
		// only after being fetched.
		const disabledDestination = await utils.addPostWithBlock(
			'test/router-navigation-lifecycle',
			{
				alias: 'lifecycle - disabled destination',
				attributes: {
					page: 'disabled-dest',
					regionId: 'lifecycle-a',
					disableNavigation: true,
				},
			}
		);

		// Row 4: destination of every Flow 1-9 navigation; origin of Flow
		// 6's second hop.
		const page2 = await utils.addPostWithBlock(
			'test/router-navigation-lifecycle',
			{
				alias: 'lifecycle - page 2',
				attributes: {
					page: 2,
					regionId: 'lifecycle-a',
					next: page2b,
				},
			}
		);

		// Row 5: the origin for Flows 1-9, 11, 12, 16, 17, 18, 24, 25, 27, 30.
		await utils.addPostWithBlock( 'test/router-navigation-lifecycle', {
			alias: 'lifecycle - page 1',
			attributes: {
				page: 1,
				regionId: 'lifecycle-a',
				next: page2,
				other: disabledDestination,
			},
		} );

		// Row 6: Flow 10's page -- the entry `clientNavigationDisabled`
		// check rejects the call.
		await utils.addPostWithBlock( 'test/router-navigation-lifecycle', {
			alias: 'lifecycle - disabled origin',
			attributes: {
				page: 'disabled-origin',
				regionId: 'lifecycle-a',
				disableNavigation: true,
				next: page2,
			},
		} );

		// Row 7: Flow 26 -- no region, no navigation trigger, so the
		// router's dynamic import never runs.
		await utils.addPostWithBlock( 'test/router-navigation-lifecycle', {
			alias: 'lifecycle - observer only',
			attributes: { page: 'observer', observerOnly: true },
		} );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test.describe( 'Region-mode lifecycle, end timing, settlement and failure', () => {
		test( 'Flow 1: a navigation produces a start transition and then an end transition', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'lifecycle - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );
			expect( await readLog( page, 'lifecycle log' ) ).toEqual( [
				{ navigating: 'not navigating', initiator: 'absent' },
			] );

			await page.getByTestId( 'navigate' ).click();

			await waitForLogLength( page, 'lifecycle log', 3 );
			expect( await readLog( page, 'lifecycle log' ) ).toEqual( [
				{ navigating: 'not navigating', initiator: 'absent' },
				{ navigating: 'navigating', initiator: 'lifecycle-a' },
				{ navigating: 'not navigating', initiator: 'lifecycle-a' },
			] );
			await expect( page.getByTestId( 'page-marker' ) ).toHaveText(
				'page marker: 2'
			);
		} );

		test( 'Flow 2: a cache-served navigation still produces both transitions, in order', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'lifecycle - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			const page2Url = utils.getLink( 'lifecycle - page 2' );
			const response = page.waitForResponse( page2Url );
			await page.getByTestId( 'prefetch' ).click();
			await response;

			await page.getByTestId( 'navigate' ).click();

			await waitForLogLength( page, 'lifecycle log', 3 );
			expect( await readLog( page, 'lifecycle log' ) ).toEqual( [
				{ navigating: 'not navigating', initiator: 'absent' },
				{ navigating: 'navigating', initiator: 'lifecycle-a' },
				{ navigating: 'not navigating', initiator: 'lifecycle-a' },
			] );
		} );

		test( 'Flow 3: prefetch() alone produces no lifecycle transition', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'lifecycle - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			const page2Url = utils.getLink( 'lifecycle - page 2' );
			const response = page.waitForResponse( page2Url );
			await page.getByTestId( 'prefetch' ).click();
			await response; // Positive checkpoint.
			await settle( page );

			await expect(
				page.getByTestId( 'lifecycle navigating' )
			).toHaveText( 'not navigating' );
			await expect(
				page.getByTestId( 'lifecycle initiator' )
			).toHaveText( 'absent' );
			expect( await readLog( page, 'lifecycle log' ) ).toHaveLength( 1 );
		} );

		test( 'Flow 4: navigation options do not suppress the lifecycle', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'lifecycle - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			await page.getByTestId( 'navigate (silent)' ).click();

			await waitForLogLength( page, 'lifecycle log', 3 );
			expect( await readLog( page, 'lifecycle log' ) ).toEqual( [
				{ navigating: 'not navigating', initiator: 'absent' },
				{ navigating: 'navigating', initiator: 'lifecycle-a' },
				{ navigating: 'not navigating', initiator: 'lifecycle-a' },
			] );
		} );

		test( 'Flow 5: a same-URL forced navigation produces a full cycle', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			const page1Url = utils.getLink( 'lifecycle - page 1' );
			await page.goto( page1Url );
			await waitForLogLength( page, 'lifecycle log', 1 );

			await page.getByTestId( 'refresh' ).click();

			await waitForLogLength( page, 'lifecycle log', 3 );
			expect( await readLog( page, 'lifecycle log' ) ).toEqual( [
				{ navigating: 'not navigating', initiator: 'absent' },
				{ navigating: 'navigating', initiator: 'lifecycle-a' },
				{ navigating: 'not navigating', initiator: 'lifecycle-a' },
			] );
			await expect( page ).toHaveURL( page1Url );
		} );

		test( 'Flow 6: consecutive navigations are each distinctly observable', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'lifecycle - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			await page.getByTestId( 'navigate' ).click();
			await waitForLogLength( page, 'lifecycle log', 3 );

			await page.getByTestId( 'navigate' ).click();
			await waitForLogLength( page, 'lifecycle log', 5 );

			expect( await readLog( page, 'lifecycle log' ) ).toEqual( [
				{ navigating: 'not navigating', initiator: 'absent' },
				{ navigating: 'navigating', initiator: 'lifecycle-a' },
				{ navigating: 'not navigating', initiator: 'lifecycle-a' },
				{ navigating: 'navigating', initiator: 'lifecycle-a' },
				{ navigating: 'not navigating', initiator: 'lifecycle-a' },
			] );
			await expect( page.getByTestId( 'page-marker' ) ).toHaveText(
				'page marker: 2b'
			);
		} );

		test( "Flow 7: the end transition observes the committed DOM and the destination's server context", async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'lifecycle - page 1' ) );

			const page2Url = utils.getLink( 'lifecycle - page 2' );
			const response = page.waitForResponse( page2Url );
			await page.getByTestId( 'prefetch' ).click();
			await response;

			await page.getByTestId( 'navigate' ).click();

			await waitForLogLength( page, 'settlement log', 1 );
			await settle( page ); // Negative half below: "exactly one".

			const settlementLog = await readLog< SettlementEntry >(
				page,
				'settlement log'
			);
			expect( settlementLog ).toHaveLength( 1 );
			expect( settlementLog[ 0 ].url ).toBe( page2Url );
			expect( settlementLog[ 0 ].marker ).toBe( 'page marker: 2' );
			expect( settlementLog[ 0 ].serverContextReadout ).toBe(
				'server context for page 2'
			);
		} );

		test( 'Flow 8: a cached back/forward restore produces a full cycle with no initiator', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'lifecycle - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			await page.getByTestId( 'navigate' ).click();
			await waitForLogLength( page, 'lifecycle log', 3 );

			await page.goBack();

			await waitForLogLength( page, 'lifecycle log', 5 );
			expect( await readLog( page, 'lifecycle log' ) ).toEqual( [
				{ navigating: 'not navigating', initiator: 'absent' },
				{ navigating: 'navigating', initiator: 'lifecycle-a' },
				{ navigating: 'not navigating', initiator: 'lifecycle-a' },
				{ navigating: 'navigating', initiator: 'absent' },
				{ navigating: 'not navigating', initiator: 'absent' },
			] );
			await expect( page.getByTestId( 'page-marker' ) ).toHaveText(
				'page marker: 1'
			);
		} );

		test.describe( 'Flow 9: an uncached back/forward traversal produces no lifecycle transition, and decides before it writes', () => {
			/**
			 * The shared setup both parts build on: a real router
			 * navigation (the positive control that the module
			 * executed, so its `popstate` listener exists), followed
			 * by a same-document, non-router history entry the
			 * router has never cached, built from `pushState` pairs
			 * rather than page loads -- the only way to reach a
			 * same-document entry outside `pages` (investigation
			 * fact 9).
			 *
			 * @param page          The Playwright page.
			 * @param utils         The `interactivityUtils` fixture.
			 * @param utils.getLink Resolves a published post's alias to its link.
			 * @return The three published pages' links.
			 */
			const setup = async (
				page: Page,
				utils: {
					getLink: ( alias: string ) => string;
				}
			) => {
				const page1Url = utils.getLink( 'lifecycle - page 1' );
				const page2Url = utils.getLink( 'lifecycle - page 2' );
				const page3Url = utils.getLink( 'lifecycle - page 3' );

				await page.goto( page1Url );
				await waitForLogLength( page, 'lifecycle log', 1 );

				// A real router navigation: executes
				// `@wordpress/interactivity-router` on this
				// document, which is what registers the `popstate`
				// listener the traversal below must reach.
				await page.getByTestId( 'navigate' ).click();
				await waitForLogLength( page, 'lifecycle log', 3 );
				expect( await readLog( page, 'lifecycle log' ) ).toEqual( [
					{ navigating: 'not navigating', initiator: 'absent' },
					{ navigating: 'navigating', initiator: 'lifecycle-a' },
					{
						navigating: 'not navigating',
						initiator: 'lifecycle-a',
					},
				] );

				await page.evaluate(
					( [ p3, p2 ] ) => {
						history.pushState( {}, '', p3 );
						history.pushState( {}, '', p2 );
					},
					[ page3Url, page2Url ]
				);
				await settle( page );
				expect( await readLog( page, 'lifecycle log' ) ).toHaveLength(
					3
				);

				return { page1Url, page2Url, page3Url };
			};

			test( 'Part A: the traversal reaches the handler and writes nothing', async ( {
				page,
				interactivityUtils: utils,
			} ) => {
				const { page3Url } = await setup( page, utils );

				// No interception of `page3Url`: residual R1 means
				// holding or aborting it would be no safer than
				// letting it through, so the reload is let through
				// normally and the outgoing document's last known
				// state is recovered from `localStorage` afterwards
				// (see `readBeforeUnloadLog`).
				await page.evaluate( () => history.back() );

				await expect( page ).toHaveURL( page3Url );
				await waitForLogLength( page, 'lifecycle log', 1 );
				expect( await readLog( page, 'lifecycle log' ) ).toEqual( [
					{ navigating: 'not navigating', initiator: 'absent' },
				] );

				// The outgoing document's last known state must still be
				// exactly the post-setup log -- nothing written between
				// the traversal and the document being replaced.
				expect( await readBeforeUnloadLog( page ) ).toEqual( [
					{ navigating: 'not navigating', initiator: 'absent' },
					{ navigating: 'navigating', initiator: 'lifecycle-a' },
					{
						navigating: 'not navigating',
						initiator: 'lifecycle-a',
					},
				] );
			} );

			test( 'Part B: a navigation superseded by the traversal keeps reading as origin until the reload lands', async ( {
				page,
				interactivityUtils: utils,
			} ) => {
				const { page2Url, page3Url } = await setup( page, utils );

				// Registered only now: registering it before the
				// shared setup's own navigation to `page2Url` would
				// deadlock that fetch. This is a resource `fetch()`,
				// not a main-frame document request, so holding it
				// open is unaffected by residual R1.
				const heldPage2 = await holdRoute( page, page2Url );

				// `refresh` re-fetches `window.location.href`,
				// which is `page2Url` after the setup's `pushState`
				// pair, and bypasses the cache via `force: true`.
				await page.getByTestId( 'refresh' ).click();
				await heldPage2.hit;

				await expect(
					page.getByTestId( 'lifecycle navigating' )
				).toHaveText( 'navigating' );
				await expect(
					page.getByTestId( 'lifecycle initiator' )
				).toHaveText( 'lifecycle-a' );
				await waitForLogLength( page, 'lifecycle log', 4 );

				// No interception of `page3Url`: let the reload
				// complete normally. The superseded `page2Url` fetch,
				// still held, simply dies with the document.
				await page.evaluate( () => history.back() );

				await expect( page ).toHaveURL( page3Url );
				await waitForLogLength( page, 'lifecycle log', 1 );
				expect( await readLog( page, 'lifecycle log' ) ).toEqual( [
					{ navigating: 'not navigating', initiator: 'absent' },
				] );

				// Primary discriminator: the outgoing document's last
				// known state, recovered from `localStorage`, must
				// still show `lifecycle-a` as the in-flight entry's
				// initiator -- not a fifth entry with a fallen-through,
				// cleared identity (which the design prices as "a
				// superseded navigation's `[true, <initiator>]` reading
				// persists until the earlier of the reload landing and
				// the release bound").
				expect( await readBeforeUnloadLog( page ) ).toEqual( [
					{ navigating: 'not navigating', initiator: 'absent' },
					{ navigating: 'navigating', initiator: 'lifecycle-a' },
					{
						navigating: 'not navigating',
						initiator: 'lifecycle-a',
					},
					{ navigating: 'navigating', initiator: 'lifecycle-a' },
				] );
			} );
		} );

		test( 'Flow 10: an entry-check rejection produces no lifecycle transition', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'lifecycle - disabled origin' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			const page2Url = utils.getLink( 'lifecycle - page 2' );
			// No interception: residual R1 means holding or aborting the
			// forced reload's main-frame request is no safer than letting
			// it through, so it is let through normally and the origin
			// document's last known state is recovered afterwards.
			await page.getByTestId( 'navigate' ).click();

			await expect( page ).toHaveURL( page2Url );
			await expect( page.getByTestId( 'page-marker' ) ).toHaveText(
				'page marker: 2'
			);
			await waitForLogLength( page, 'lifecycle log', 1 );

			// Red on: placing the token claim or the start batch before
			// the entry `clientNavigationDisabled` check -- the origin
			// document's last known log would then carry a second,
			// spurious "navigating" entry instead of staying at one.
			expect( await readBeforeUnloadLog( page ) ).toEqual( [
				{ navigating: 'not navigating', initiator: 'absent' },
			] );
		} );

		test( 'Flow 11: a mid-flight fetch failure is never reported as a successful end', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'lifecycle - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			const page2Url = utils.getLink( 'lifecycle - page 2' );
			// The *first* request (the fetch `navigate (timeout)`
			// triggers) hangs forever, forcing the router's own
			// short-timeout fallback. The *second* request -- the
			// forced reload that follows -- is a main-frame request,
			// so -- residual R1 -- it is deliberately left
			// unintercepted (a counter tells them apart, since both
			// hit this same URL): its landing and the origin
			// document's last known state are both checked afterwards.
			let requestCount = 0;
			await page.route( page2Url, async ( route ) => {
				requestCount += 1;
				if ( requestCount === 1 ) {
					await new Promise( () => {} ); // Never resolves.
					return;
				}
				await route.continue();
			} );

			await page.getByTestId( 'navigate (timeout)' ).click();

			// Positive checkpoint: the in-flight reading appears.
			await expect(
				page.getByTestId( 'lifecycle navigating' )
			).toHaveText( 'navigating' );
			await expect(
				page.getByTestId( 'lifecycle initiator' )
			).toHaveText( 'lifecycle-a' );

			await expect( page ).toHaveURL( page2Url );
			await waitForLogLength( page, 'lifecycle log', 1 );

			// Red on: an end write reachable on the fallback path -- the
			// origin document's last known log would then carry a third,
			// "not navigating" entry instead of staying at two.
			expect( await readBeforeUnloadLog( page ) ).toEqual( [
				{ navigating: 'not navigating', initiator: 'absent' },
				{ navigating: 'navigating', initiator: 'lifecycle-a' },
			] );
		} );

		test( 'Flow 12: a fetched page that disables client navigation is never reported as a successful end', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'lifecycle - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			const disabledDestUrl = utils.getLink(
				'lifecycle - disabled destination'
			);
			// Delay the router's own successful fetch of the destination
			// just enough to widen the in-flight window for the positive
			// checkpoint below; the forced reload that follows is a
			// main-frame request, so -- residual R1 -- it is left
			// unintercepted.
			await page.route( disabledDestUrl, async ( route ) => {
				await new Promise( ( resolve ) => setTimeout( resolve, 300 ) );
				await route.continue();
			} );

			await page.getByTestId( 'navigate (other)' ).click();

			// Positive checkpoint: the in-flight reading appears.
			await expect(
				page.getByTestId( 'lifecycle navigating' )
			).toHaveText( 'navigating' );
			await expect(
				page.getByTestId( 'lifecycle initiator' )
			).toHaveText( 'lifecycle-a' );

			await expect( page ).toHaveURL( disabledDestUrl );
			await waitForLogLength( page, 'lifecycle log', 1 );

			// Red on: treating "fetch succeeded" as "navigation ended" --
			// the origin document's last known log would then carry a
			// third, "not navigating" entry instead of staying at two.
			expect( await readBeforeUnloadLog( page ) ).toEqual( [
				{ navigating: 'not navigating', initiator: 'absent' },
				{ navigating: 'navigating', initiator: 'lifecycle-a' },
			] );
		} );
	} );
} );
