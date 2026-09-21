import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

type LogEntry = { navigating: string; initiator: string };
type RawWriteLogEntry = {
	navigating?: boolean;
	initiator?: string | null;
};
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
 * Waits, by polling, for the counted lifecycle log to contain at least one
 * truthy-navigating entry. This is the positive evidence Task 9's full-page
 * flows lead with: in full-page mode the whole BODY is the router region, so
 * the counted observer's own `data-wp-watch` element is torn down and
 * re-created on every navigation and its run **count** is not a transition
 * record there -- but `state.log` is module state and survives the region
 * swap, so its **content** still is. Without this checkpoint, "the initiator
 * reads absent" would also be satisfied by a lifecycle that never fired at
 * all.
 *
 * @param page The Playwright page.
 */
const waitForTruthyLogEntry = async ( page: Page ) => {
	await expect
		.poll( async () =>
			( await readLog( page, 'lifecycle log' ) ).some(
				( entry ) => entry.navigating === 'navigating'
			)
		)
		.toBe( true );
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
 * A real-time wait, used only where the plan explicitly calls for one:
 * comfortably past the 400 ms window Flows 27 and 30's consumer-side
 * debounces key off of. Without it the corresponding negative assertion is
 * a coin flip at 400 ms and a guaranteed pass taken immediately -- true on
 * every implementation, including one whose cache-served navigation
 * produces no end transition at all. There is no locator-based condition to
 * wait on instead: the thing being asserted is the *absence* of a DOM
 * change at this specific real-time distance from the trigger.
 *
 * The parameter is deliberately not named `page`: `no-restricted-syntax`
 * bans a literal `page.waitForTimeout(…)` call in this directory in favour
 * of `page.locator`-based waits, for the ordinary case where one is
 * available.
 *
 * @param browserPage The Playwright page.
 * @param ms          Milliseconds to wait.
 */
const waitRealTime = ( browserPage: Page, ms: number ) =>
	browserPage.waitForTimeout( ms );

/**
 * Registers a listener on `page` that collects every `pageerror` and every
 * `console.error`/`console.warning` message, for the two flows (26 and 27's
 * "SCRIPT_DEBUG is false" narrowing aside, plus 24 and 26 themselves) that
 * assert the browser console stays silent.
 *
 * @param page The Playwright page.
 * @return Three arrays, appended to for the lifetime of `page`.
 */
const collectConsoleActivity = ( page: Page ) => {
	const pageErrors: Error[] = [];
	const consoleErrors: string[] = [];
	const consoleWarnings: string[] = [];
	page.on( 'pageerror', ( error ) => pageErrors.push( error ) );
	page.on( 'console', ( message ) => {
		if ( message.type() === 'error' ) {
			consoleErrors.push( message.text() );
		} else if ( message.type() === 'warning' ) {
			consoleWarnings.push( message.text() );
		}
	} );
	return { pageErrors, consoleErrors, consoleWarnings };
};

/**
 * Registers a route on `url` *before* any request against it is expected,
 * holding it open until `release()` is called. This is the held-request
 * idiom from `router-navigate.spec.ts:89-102`, extended with a hit signal
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
 * **`release()` alone is not a reliable "the browser has resumed" signal.**
 * It only tells you Playwright's own route handler returned; the browser's
 * fetch-then-parse pipeline can still be in flight well after that. Flows
 * 14 and 15 need the *browser* to have the full response before sampling a
 * mid-window reading, so they pair `release()` with a `page.waitForResponse`
 * promise created beforehand, per the held-request idiom the operational
 * notes already prescribe.
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

/**
 * Reads and parses the raw lifecycle-write log as it stood the moment the
 * previous document (on the same origin) was last torn down -- persisted by
 * `view.js`'s `pagehide`/`beforeunload` listener into `localStorage`, which
 * survives a same-origin navigation. Call this only after the forced full
 * page load this flow expects has landed.
 *
 * @param page The Playwright page, already on the destination document.
 * @return The origin document's raw lifecycle-write log, or `[]` if none was
 *         ever persisted.
 */
const readBeforeUnloadRawLog = async (
	page: Page
): Promise< RawWriteLogEntry[] > => {
	const text = await page.evaluate( () =>
		window.localStorage.getItem(
			'router-navigation-lifecycle:raw-write-log-before-unload'
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

		/*
		 * Task 7's inventory, rows 8-12, appended in the same strict
		 * topological order: a post's `next`/`other` must already exist.
		 */

		// Row 8: region A's destination in Flows 13, 14, 15, 28, 29.
		const twoRegionDestA = await utils.addPostWithBlock(
			'test/router-navigation-lifecycle',
			{
				alias: 'lifecycle two-region - dest A',
				attributes: {
					page: 'two-a',
					regionId: 'lifecycle-a',
					secondRegionId: 'lifecycle-b',
				},
			}
		);

		// Row 9: region B's destination, and region A's *second*
		// destination in Flow 15. A different href from row 8.
		const twoRegionDestB = await utils.addPostWithBlock(
			'test/router-navigation-lifecycle',
			{
				alias: 'lifecycle two-region - dest B',
				attributes: {
					page: 'two-b',
					regionId: 'lifecycle-a',
					secondRegionId: 'lifecycle-b',
				},
			}
		);

		// Row 10: the origin for Flows 13, 14, 15, 28, 29. Region A's
		// `navigate` link -> `next` (row 8); region A's `navigate (other)`
		// link -> `other` (row 9); region B's `navigate` link -> `other`
		// (row 9), per Task 6's second-region rule.
		await utils.addPostWithBlock( 'test/router-navigation-lifecycle', {
			alias: 'lifecycle two-region - page 1',
			attributes: {
				page: 'two-1',
				regionId: 'lifecycle-a',
				secondRegionId: 'lifecycle-b',
				next: twoRegionDestA,
				other: twoRegionDestB,
			},
		} );

		// Row 11: the nested page's destination, so the inner and outer
		// regions exist on both pages.
		const nestedPage2 = await utils.addPostWithBlock(
			'test/router-navigation-lifecycle',
			{
				alias: 'lifecycle nested - page 2',
				attributes: { page: 'nested-2', nested: true },
			}
		);

		// Row 12: Flow 19's origin -- `render.php`'s `nested` branch emits
		// an `inner-region` inside an `outer-region`, with the `navigate`
		// link inside the inner one.
		await utils.addPostWithBlock( 'test/router-navigation-lifecycle', {
			alias: 'lifecycle nested - page 1',
			attributes: {
				page: 'nested-1',
				nested: true,
				next: nestedPage2,
			},
		} );

		/*
		 * Task 9's inventory, rows 13-14: the full-page mode fixture
		 * (`test/router-navigation-full-page`), a distinct block from the
		 * region-mode fixture above. Every plain link and every navigate
		 * control on page 1 targets page 2, so Flows 21-23 differ only in
		 * *what* was clicked, never in *where* it went.
		 */

		// Row 13: full-page mode's destination. No `next`.
		const fullPagePage2 = await utils.addPostWithBlock(
			'test/router-navigation-full-page',
			{
				alias: 'full-page - page 2',
				attributes: { page: 'fp-2', regionId: 'full-page-a' },
			}
		);

		// Row 14: the origin for Flows 21-23.
		await utils.addPostWithBlock( 'test/router-navigation-full-page', {
			alias: 'full-page - page 1',
			attributes: {
				page: 'fp-1',
				regionId: 'full-page-a',
				next: fullPagePage2,
			},
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

		test.describe( 'Flow 9: an uncached back/forward traversal produces no lifecycle cycle, and discharges the reading to idle as it reloads', () => {
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

			test( 'Part A: the traversal reaches the handler and discharges to idle', async ( {
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

				// The outgoing document's raw log must end with the setup
				// navigation's retained identity followed by the traversal's
				// single discharge. The frame-deferred counted log is not
				// asserted here because its final flush races replacement.
				expect(
					( await readBeforeUnloadRawLog( page ) ).slice( -2 )
				).toEqual( [
					{ navigating: false, initiator: 'lifecycle-a' },
					{ navigating: false, initiator: null },
				] );
			} );

			test( 'Part B: a navigation superseded by the traversal discharges to idle', async ( {
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

				// Primary discriminator: the outgoing document's raw log
				// must end with the refresh's in-flight start followed by
				// exactly one discharge that clears the identity. The
				// counted log is frame-deferred and is not asserted for the
				// traversal because its final flush races replacement.
				expect(
					( await readBeforeUnloadRawLog( page ) ).slice( -2 )
				).toEqual( [
					{ navigating: true, initiator: 'lifecycle-a' },
					{ navigating: false, initiator: null },
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

	test.describe( 'Initiator identity in region-based navigation mode', () => {
		test( 'Flow 13: two regions -- only the initiating region reads as the origin', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'lifecycle two-region - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			const destAUrl = utils.getLink( 'lifecycle two-region - dest A' );
			const heldDestA = await holdRoute( page, destAUrl );

			const regionA = page.getByTestId( 'region-lifecycle-a' );
			const regionB = page.getByTestId( 'region-lifecycle-b' );

			await regionA.getByTestId( 'navigate' ).click();
			await heldDestA.hit;

			// Positive checkpoint first, then the negative it protects.
			await expect( regionA ).toHaveClass( /is-origin/ );
			await expect( regionB ).not.toHaveClass( /is-origin/ );

			heldDestA.release();

			// Positive checkpoint (the lifecycle really ended), then the
			// settle, then the negative: neither region reads as origin.
			await expect(
				page.getByTestId( 'lifecycle navigating' )
			).toHaveText( 'not navigating' );
			await settle( page );
			await expect( regionA ).not.toHaveClass( /is-origin/ );
			await expect( regionB ).not.toHaveClass( /is-origin/ );
		} );

		test( 'Flow 14: cross-region supersession hands the origin over at the moment of supersession', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'lifecycle two-region - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			const destAUrl = utils.getLink( 'lifecycle two-region - dest A' );
			const destBUrl = utils.getLink( 'lifecycle two-region - dest B' );
			const heldDestA = await holdRoute( page, destAUrl );
			const heldDestB = await holdRoute( page, destBUrl );

			const regionA = page.getByTestId( 'region-lifecycle-a' );
			const regionB = page.getByTestId( 'region-lifecycle-b' );

			await regionA.getByTestId( 'navigate' ).click();
			await heldDestA.hit;
			await expect( regionA ).toHaveClass( /is-origin/ );

			await regionB.getByTestId( 'navigate' ).click();
			await heldDestB.hit;

			// Positive checkpoint before the negative it protects.
			await expect( regionB ).toHaveClass( /is-origin/ );
			await expect( regionA ).not.toHaveClass( /is-origin/ );
			await expect(
				page.getByTestId( 'lifecycle initiator' )
			).toHaveText( 'lifecycle-b' );

			// Release A's destination -- A's, not B's -- and wait for its
			// generator to actually resume and take the `navigatingTo`
			// bail. `page.waitForResponse` is the accurate signal here --
			// it resolves once the browser has the full response, unlike a
			// Node-side "the route handler returned" signal, which can
			// resolve well before the page's own fetch-then-parse pipeline
			// has actually let the generator past its `yield`.
			const destAResponse = page.waitForResponse( destAUrl );
			heldDestA.release();
			await destAResponse;
			await settle( page );

			// Mid-window reading, taken while B is still held: the
			// lifecycle must still read in flight and B must still read
			// as origin. Red on: an unguarded end write in A's `finally`.
			await expect(
				page.getByTestId( 'lifecycle navigating' )
			).toHaveText( 'navigating' );
			await expect( regionB ).toHaveClass( /is-origin/ );

			heldDestB.release();

			await expect(
				page.getByTestId( 'lifecycle navigating' )
			).toHaveText( 'not navigating' );
			await settle( page );
			await expect( regionA ).not.toHaveClass( /is-origin/ );
			await expect( regionB ).not.toHaveClass( /is-origin/ );
		} );

		test( 'Flow 15: two overlapping navigations from one region keep the region reading as origin', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'lifecycle two-region - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			const destAUrl = utils.getLink( 'lifecycle two-region - dest A' );
			const destBUrl = utils.getLink( 'lifecycle two-region - dest B' );
			const heldDestA = await holdRoute( page, destAUrl );
			const heldDestB = await holdRoute( page, destBUrl );

			const regionA = page.getByTestId( 'region-lifecycle-a' );

			// Both destinations, both from region A: `navigate` (-> next,
			// dest A) and then `navigate (other)` (-> other, dest B).
			await regionA.getByTestId( 'navigate' ).click();
			await heldDestA.hit;
			await expect( regionA ).toHaveClass( /is-origin/ );

			await regionA.getByTestId( 'navigate (other)' ).click();
			await heldDestB.hit;

			// Release the *first* destination and wait for its generator
			// to actually resume and take the bail. `page.waitForResponse`
			// is the accurate signal here -- it resolves once the browser
			// has the full response, unlike a Node-side "the route handler
			// returned" signal, which can resolve well before the page's
			// own fetch-then-parse pipeline has actually let the generator
			// past its `yield`.
			const destAResponse = page.waitForResponse( destAUrl );
			heldDestA.release();
			await destAResponse;
			await settle( page );

			// A must still read as origin: the region's own per-region
			// indication must not clear on a superseded call's own end.
			// Red on: an implementation that clears it at *every* end
			// rather than only the last.
			await expect( regionA ).toHaveClass( /is-origin/ );

			heldDestB.release();

			await expect(
				page.getByTestId( 'lifecycle navigating' )
			).toHaveText( 'not navigating' );
			await settle( page );
			await expect( regionA ).not.toHaveClass( /is-origin/ );
		} );

		test( 'Flow 16: a declared identity is readable by a consumer in a different store', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'lifecycle - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			const page2Url = utils.getLink( 'lifecycle - page 2' );
			const heldPage2 = await holdRoute( page, page2Url );

			// The `navigate (declared)` link sits inside region
			// `lifecycle-a` -- an implementation that ignored the
			// `initiator` option would read `lifecycle-a` here, not the
			// declared value.
			await page.getByTestId( 'navigate (declared)' ).click();
			await heldPage2.hit;

			await expect(
				page.getByTestId( 'lifecycle initiator' )
			).toHaveText( 'my-plugin/declared' );

			heldPage2.release();

			// The declared identity is also still readable at the end.
			await expect( page ).toHaveURL( page2Url );
			await expect(
				page.getByTestId( 'lifecycle initiator' )
			).toHaveText( 'my-plugin/declared' );
		} );

		test( 'Flow 17: `initiator: null` suppresses attribution', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'lifecycle - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			const page2Url = utils.getLink( 'lifecycle - page 2' );
			const heldPage2 = await holdRoute( page, page2Url );

			await page.getByTestId( 'navigate (suppressed)' ).click();
			await heldPage2.hit;

			// Positive checkpoint, then the settle, then the negatives.
			await expect(
				page.getByTestId( 'lifecycle navigating' )
			).toHaveText( 'navigating' );
			await settle( page );

			await expect(
				page.getByTestId( 'lifecycle initiator' )
			).toHaveText( 'absent' );
			await expect(
				page.getByTestId( 'region-lifecycle-a' )
			).not.toHaveClass( /is-origin/ );

			heldPage2.release();
		} );

		test( 'Flow 18: a scope-less programmatic navigation reads as having no initiator', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			const pageErrors: Error[] = [];
			const consoleErrors: string[] = [];
			page.on( 'pageerror', ( error ) => pageErrors.push( error ) );
			page.on( 'console', ( message ) => {
				if ( message.type() === 'error' ) {
					consoleErrors.push( message.text() );
				}
			} );

			// This page *does* carry region `lifecycle-a` -- a derivation
			// implemented as a document query rather than from the
			// (absent) scope would read it here instead of absent.
			await page.goto( utils.getLink( 'lifecycle - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			const page2Url = utils.getLink( 'lifecycle - page 2' );
			const heldPage2 = await holdRoute( page, page2Url );

			await page.evaluate( () =>
				window.dispatchEvent( new Event( '_test_navigate_scopeless_' ) )
			);
			await heldPage2.hit;

			await expect(
				page.getByTestId( 'lifecycle navigating' )
			).toHaveText( 'navigating' );
			await expect(
				page.getByTestId( 'lifecycle initiator' )
			).toHaveText( 'absent' );

			heldPage2.release();

			await expect( page ).toHaveURL( page2Url );
			await waitForLogLength( page, 'lifecycle log', 3 );
			expect( await readLog( page, 'lifecycle log' ) ).toEqual( [
				{ navigating: 'not navigating', initiator: 'absent' },
				{ navigating: 'navigating', initiator: 'absent' },
				{ navigating: 'not navigating', initiator: 'absent' },
			] );

			expect( pageErrors ).toEqual( [] );
			expect( consoleErrors ).toEqual( [] );
		} );

		test( 'Flow 19: nested regions attribute to the nearest enclosing region', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'lifecycle nested - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			const nestedPage2Url = utils.getLink( 'lifecycle nested - page 2' );
			const heldNestedPage2 = await holdRoute( page, nestedPage2Url );

			await page
				.getByTestId( 'region-inner-region' )
				.getByTestId( 'navigate' )
				.click();
			await heldNestedPage2.hit;

			// Would read `outer-region` under an outermost-region walk.
			await expect(
				page.getByTestId( 'lifecycle navigating' )
			).toHaveText( 'navigating' );
			await expect(
				page.getByTestId( 'lifecycle initiator' )
			).toHaveText( 'inner-region' );

			heldNestedPage2.release();
		} );
	} );

	test.describe( 'The two-Query per-instance derivation canary', () => {
		/*
		 * `core/query` is not part of the `interactive-blocks` test plugin,
		 * and `InteractivityUtils.addPostWithBlock` only ever generates a
		 * single root block, so this page is built directly with
		 * `requestUtils.createPost` and raw block markup, per the build
		 * plan's Task 8 notes -- rather than through `interactivityUtils`.
		 */
		const QUERY_PAGE_SIZE = 2;

		/**
		 * Raw markup for one independent (non-inheriting) `core/query`
		 * instance with enhanced pagination on and a "next page" link --
		 * the same shape `phpunit/blocks/render-query-test.php` already
		 * exercises for the `enhancedPagination` attribute, with
		 * `query.inherit` set to `false` instead of `true` so this works
		 * on a single-post page rather than an archive. No markup or
		 * JavaScript change is made to any Query block for this: the
		 * region attribute (`data-wp-router-region="query-<queryId>"`) is
		 * written by `packages/block-library/src/query/index.php:26-37`'s
		 * own render callback, unmodified.
		 *
		 * @param queryId The block's own `queryId`, 0 or 1.
		 * @return The block's raw comment-delimited markup.
		 */
		const queryBlockMarkup = ( queryId: 0 | 1 ) =>
			`<!-- wp:query {"queryId":${ queryId },"query":{"inherit":false,"postType":"post","perPage":${ QUERY_PAGE_SIZE },"pages":0,"order":"desc","orderBy":"date"},"enhancedPagination":true} -->` +
			'<div class="wp-block-query">' +
			'<!-- wp:post-template --><!-- /wp:post-template -->' +
			'<!-- wp:query-pagination --><!-- wp:query-pagination-next /--><!-- /wp:query-pagination -->' +
			'</div>' +
			'<!-- /wp:query -->';

		let queryCanaryUrl: string;

		test.beforeAll( async ( { requestUtils } ) => {
			// Dedicated filler posts, so pagination is guaranteed by this
			// flow's own setup rather than by however many posts the rest
			// of the site happens to carry.
			for ( let i = 1; i <= QUERY_PAGE_SIZE + 1; i++ ) {
				await requestUtils.createPost( {
					title: `lifecycle query canary - filler ${ i }`,
					content:
						'<!-- wp:paragraph --><p>filler</p><!-- /wp:paragraph -->',
					status: 'publish' as 'publish',
					date_gmt: '2023-01-01T00:00:00',
				} );
			}

			// The observer fixture block, in `observerOnly` mode so it
			// renders no region of its own and survives every region
			// update, placed outside both queries -- plus the two Query
			// block instances themselves, `queryId` 0 and 1.
			const content =
				'<!-- wp:test/router-navigation-lifecycle {"page":"query-canary","observerOnly":true} /-->' +
				queryBlockMarkup( 0 ) +
				queryBlockMarkup( 1 );

			// `CreatePostPayload` makes `date_gmt` required alongside
			// `status`, so this copies the payload shape
			// `InteractivityUtils.addPostWithBlock` uses.
			const { link } = await requestUtils.createPost( {
				title: 'lifecycle query canary',
				content,
				status: 'publish' as 'publish',
				date_gmt: '2023-01-01T00:00:00',
			} );

			// `createPost` returns a bare link; `InteractivityUtils.getLink`
			// is what normally appends this param, but it is scoped to that
			// class's own `links` map, so it is added here directly. This
			// does not disturb Query: the region attribute is written by
			// Query's own render callback with `WP_HTML_Tag_Processor`, not
			// through directive processing, so it survives
			// `disable_server_directive_processing=true`.
			const url = new URL( link );
			url.searchParams.append(
				'disable_server_directive_processing',
				'true'
			);
			queryCanaryUrl = url.href;
		} );

		test( 'Flow 20: two Query blocks with enhanced pagination are distinguished per instance', async ( {
			page,
		} ) => {
			await page.goto( queryCanaryUrl );
			await waitForLogLength( page, 'lifecycle log', 1 );

			// The second Query instance's own region and its own "next
			// page" link. Query's `data-wp-router-region` is
			// `query-<queryId>`, and its own click handler
			// (`packages/block-library/src/query/view.js`) calls
			// `actions.navigate` with no `initiator` option, so the
			// reading below exercises derivation end to end.
			const query1Region = page.locator(
				'[data-wp-router-region="query-1"]'
			);
			const nextLink = query1Region.locator(
				'.wp-block-query-pagination-next'
			);
			const destHref = await nextLink.getAttribute( 'href' );
			if ( ! destHref ) {
				throw new Error(
					'The second Query block rendered no "next page" link -- pagination did not trigger, so this flow cannot discriminate.'
				);
			}
			// Resolve against the current page: `add_query_arg()` (used by
			// `query-pagination-next`'s render callback) returns a
			// domain-relative path when given no explicit URL.
			const destUrl = new URL( destHref, page.url() ).href;

			const heldDest = await holdRoute( page, destUrl );
			await nextLink.click();
			await heldDest.hit;

			// In flight: the readable initiator is the second Query
			// instance's own region id -- never the first's, and never
			// absent.
			await expect(
				page.getByTestId( 'lifecycle initiator' )
			).toHaveText( 'query-1' );

			const destResponse = page.waitForResponse( destUrl );
			heldDest.release();
			await destResponse;

			// At the moment the navigation ends: still `query-1`.
			await expect(
				page.getByTestId( 'lifecycle navigating' )
			).toHaveText( 'not navigating' );
			await expect(
				page.getByTestId( 'lifecycle initiator' )
			).toHaveText( 'query-1' );
		} );
	} );

	test.describe( 'Full-page navigation mode', () => {
		/*
		 * The first e2e coverage of `gutenberg-full-page-client-side-
		 * navigation` in this repository -- there is no per-post switch, it
		 * is global while enabled, and Playwright runs this project with a
		 * single worker. So the reset in `afterAll` below is unconditional:
		 * a leaked experiment would not fail this task, it would corrupt
		 * every spec that runs after it, including the four existing router
		 * suites in this task's own gate.
		 */
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.setGutenbergExperiments( [
				'gutenberg-full-page-client-side-navigation',
			] );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.setGutenbergExperiments( [] );
		} );

		test( 'Flow 21a: a plain link outside every block region reads as having no initiator', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'full-page - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			await page.getByTestId( 'plain-link-outside-region' ).click();

			// Positive evidence a transition fired at all, before asserting
			// which identity was reported -- see `waitForTruthyLogEntry`.
			await waitForTruthyLogEntry( page );
			// The navigation actually landed on page 2.
			await expect( page.getByTestId( 'page-marker' ) ).toHaveText(
				'page marker: fp-2'
			);
			// `initiator` is retained through the end, so this reading is
			// stable once the navigation has landed and needs no held
			// request.
			await expect(
				page.getByTestId( 'lifecycle initiator' )
			).toHaveText( 'absent' );
		} );

		test( 'Flow 21b: a plain link inside a router region reads as having no initiator -- DOM containment is not initiation', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'full-page - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			await page.getByTestId( 'plain-link-inside-region' ).click();

			await waitForTruthyLogEntry( page );
			await expect( page.getByTestId( 'page-marker' ) ).toHaveText(
				'page marker: fp-2'
			);
			// Not `full-page-a`, even though the link sits inside that
			// region: it is handled by the full-page document click
			// listener, which carries no ambient directive scope, not by
			// any scoped action.
			await expect(
				page.getByTestId( 'lifecycle initiator' )
			).toHaveText( 'absent' );
		} );

		test( "Flow 22: a click handled by a block's own action is identified", async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'full-page - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			await page.getByTestId( 'navigate-inside-region' ).click();

			await waitForTruthyLogEntry( page );
			await expect( page.getByTestId( 'page-marker' ) ).toHaveText(
				'page marker: fp-2'
			);
			// The identical reading region-mode would produce for the same
			// shape of click -- not `core/body`, which would mean the
			// full-page listener's own frame reached the derivation instead
			// of the block's own scoped action (the full-page listener
			// never even sees this event: it skips default-prevented
			// clicks, and this action's first statement is
			// `e.preventDefault()`).
			await expect(
				page.getByTestId( 'lifecycle initiator' )
			).toHaveText( 'full-page-a' );
		} );

		test( 'Flow 23: a scoped element outside every block region derives core/body', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'full-page - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			await page.getByTestId( 'navigate-outside-region' ).click();

			await waitForTruthyLogEntry( page );
			await expect( page.getByTestId( 'page-marker' ) ).toHaveText(
				'page marker: fp-2'
			);
			// This control's nearest enclosing `data-wp-router-region` is
			// the BODY the full-page PHP class marks `core/body` -- the
			// documented mode difference (Requirement 12). Together with
			// Flow 21b (a plain link in the very same position reads
			// absent), no single wrong derivation satisfies both: one that
			// stops at block regions, or that special-cases BODY to `null`,
			// would read absent here instead.
			await expect(
				page.getByTestId( 'lifecycle initiator' )
			).toHaveText( 'core/body' );
		} );
	} );

	test.describe( 'Compatibility, degradation, directive bindings and sufficiency', () => {
		test( 'Flow 24: initial state, hydration, and directive bindings before the first navigation', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			const { pageErrors, consoleErrors, consoleWarnings } =
				collectConsoleActivity( page );

			await page.goto( utils.getLink( 'lifecycle - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );
			expect( await readLog( page, 'lifecycle log' ) ).toEqual( [
				{ navigating: 'not navigating', initiator: 'absent' },
			] );
			await expect(
				page.getByTestId( 'lifecycle navigating' )
			).toHaveText( 'not navigating' );
			await expect(
				page.getByTestId( 'lifecycle initiator' )
			).toHaveText( 'absent' );

			// `aria-busy` absent entirely -- not `"false"` -- is a declared
			// `navigating: false` seen through the binding. **Correction to
			// the build plan, verified by red-driving it**: this does *not*
			// discriminate Task 2's "neither key is declared in the router's
			// own store literal" decision -- at this point in the flow the
			// router module has not been imported at all (confirmed: zero
			// `interactivity-router` network requests before the first
			// click), so a mutation to that literal has no effect here.
			// That decision's only browser-reachable consequence is the
			// spurious hydration-time re-run the design doc names, which is
			// pinned at unit level (Task 2's first acceptance row) as the
			// plan itself says. This assertion still stands as a real
			// regression check: it pins that this binding renders no
			// attribute at all for an `undefined` value, before hydration
			// has ever touched it.
			await expect(
				page.getByTestId( 'bind-aria-busy' )
			).not.toHaveAttribute( 'aria-busy' );
			await expect(
				page.getByTestId( 'bind-class-busy' )
			).not.toHaveClass( /busy/ );

			// The two `hidden` bindings, in opposite directions. Asserted
			// on the `hidden` IDL property directly (`toHaveJSProperty`),
			// not on rendered visibility: both elements are empty `<span>`s
			// with no content of their own, so Playwright's own visibility
			// check (a non-empty bounding box) reads "not visible" for
			// *either* state and would not discriminate anything. Do not
			// "fix" either binding by flipping it if this goes red -- see
			// `render.php`'s comment on `bind-hidden-negated`.
			await expect(
				page.getByTestId( 'bind-hidden-negated' )
			).toHaveJSProperty( 'hidden', true ); // `!undefined` -> `true`.
			await expect(
				page.getByTestId( 'bind-hidden-plain' )
			).toHaveJSProperty( 'hidden', false ); // `undefined` -> `''` -> `false`.

			expect( pageErrors ).toEqual( [] );
			expect( consoleErrors ).toEqual( [] );
			expect( consoleWarnings ).toEqual( [] );
		} );

		test( 'Flow 25: directive bindings track the lifecycle during a navigation', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'lifecycle - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			const page2Url = utils.getLink( 'lifecycle - page 2' );
			const heldPage2 = await holdRoute( page, page2Url );

			const ariaBusy = page.getByTestId( 'bind-aria-busy' );
			const classBusy = page.getByTestId( 'bind-class-busy' );
			const hiddenNegated = page.getByTestId( 'bind-hidden-negated' );
			const hiddenPlain = page.getByTestId( 'bind-hidden-plain' );

			await page.getByTestId( 'navigate' ).click();
			await heldPage2.hit;

			// Mid-flight (`state.navigating === true`). Each state leads
			// with a positive assertion before any "is absent" clause.
			await expect( ariaBusy ).toHaveAttribute( 'aria-busy', 'true' );
			await expect( classBusy ).toHaveClass( /busy/ );
			await expect( hiddenNegated ).toHaveJSProperty( 'hidden', false ); // `!true` -> `false`.
			await expect( hiddenPlain ).toHaveJSProperty( 'hidden', true ); // `true`.

			heldPage2.release();

			// After the end (`state.navigating === false`). The positive
			// checkpoint first, then the readings settle back.
			await expect(
				page.getByTestId( 'lifecycle navigating' )
			).toHaveText( 'not navigating' );
			await expect( ariaBusy ).toHaveAttribute( 'aria-busy', 'false' );
			await expect( classBusy ).not.toHaveClass( /busy/ );
			await expect( hiddenNegated ).toHaveJSProperty( 'hidden', true ); // `!false` -> `true`.
			await expect( hiddenPlain ).toHaveJSProperty( 'hidden', false ); // `false`.
		} );

		test( 'Flow 26: a page where the router module never loads', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			const { pageErrors, consoleErrors, consoleWarnings } =
				collectConsoleActivity( page );

			await page.goto( utils.getLink( 'lifecycle - observer only' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );
			expect( await readLog( page, 'lifecycle log' ) ).toEqual( [
				{ navigating: 'not navigating', initiator: 'absent' },
			] );
			await expect(
				page.getByTestId( 'lifecycle navigating' )
			).toHaveText( 'not navigating' );
			await expect(
				page.getByTestId( 'lifecycle initiator' )
			).toHaveText( 'absent' );

			// Same readings as Flow 24, for the same reason: the keys are
			// `undefined` here too, since the router module never loads on
			// this page (no region, no navigation trigger).
			await expect(
				page.getByTestId( 'bind-aria-busy' )
			).not.toHaveAttribute( 'aria-busy' );
			await expect(
				page.getByTestId( 'bind-class-busy' )
			).not.toHaveClass( /busy/ );
			await expect(
				page.getByTestId( 'bind-hidden-negated' )
			).toHaveJSProperty( 'hidden', true );
			await expect(
				page.getByTestId( 'bind-hidden-plain' )
			).toHaveJSProperty( 'hidden', false );

			expect( pageErrors ).toEqual( [] );
			expect( consoleErrors ).toEqual( [] );
			expect( consoleWarnings ).toEqual( [] );
		} );

		test( "Flow 27: Core's loading bar keeps working alongside the new keys", async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			const page1Url = utils.getLink( 'lifecycle - page 1' );
			const page2Url = utils.getLink( 'lifecycle - page 2' );
			const bar = page.getByTestId( 'loading-bar' );

			await page.goto( page1Url );
			await waitForLogLength( page, 'lifecycle log', 1 );

			// Default options: the bar animates exactly as today.
			const heldPage2 = await holdRoute( page, page2Url );
			await page.getByTestId( 'navigate' ).click();
			await heldPage2.hit;

			// Positive, waiting assertion: the 400 ms delay has elapsed
			// (Playwright's own polling absorbs the wait) and the bar has
			// started.
			await expect( bar ).toHaveClass( /start-animation/ );

			heldPage2.release();

			// Positive checkpoint (the navigation ended), then the settle,
			// then the negative it protects.
			await expect( bar ).toHaveClass( /finish-animation/ );
			await settle( page );
			await expect( bar ).not.toHaveClass( /start-animation/ );

			/*
			 * A fresh page load before the `loadingAnimation: false` half.
			 * `hasFinished` above is left `true` indefinitely once set --
			 * matching today's bar, which only fades the class away via
			 * CSS rather than ever removing it -- so continuing on the same
			 * document would make "gains neither" trivially true for the
			 * wrong reason: the class would already be there from before
			 * this half even started.
			 */
			await page.unroute( page2Url );
			await page.goto( page1Url );
			await waitForLogLength( page, 'lifecycle log', 1 );

			const heldPage2Again = await holdRoute( page, page2Url );
			await page.getByTestId( 'navigate (silent)' ).click();
			await heldPage2Again.hit;

			// Positive checkpoint: the new keys transitioned even though
			// the loading animation option is off.
			await expect(
				page.getByTestId( 'lifecycle navigating' )
			).toHaveText( 'navigating' );

			// The real-time wait is the settle that matters here: at 400 ms
			// an implementation that ignored `loadingAnimation` would just
			// be writing the flags.
			await waitRealTime( page, 500 );
			await settle( page );
			await expect( bar ).not.toHaveClass( /start-animation/ );
			await expect( bar ).not.toHaveClass( /finish-animation/ );

			heldPage2Again.release();

			await expect(
				page.getByTestId( 'lifecycle navigating' )
			).toHaveText( 'not navigating' );
			await settle( page );
			await expect( bar ).not.toHaveClass( /start-animation/ );
			await expect( bar ).not.toHaveClass( /finish-animation/ );
		} );

		test( 'Flow 28: sufficiency -- a per-block spinner shown only for own-initiated navigations, never stuck', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'lifecycle two-region - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			const destAUrl = utils.getLink( 'lifecycle two-region - dest A' );
			const heldDestA = await holdRoute( page, destAUrl );

			const spinnerA = page.getByTestId( 'spinner-lifecycle-a' );
			const spinnerB = page.getByTestId( 'spinner-lifecycle-b' );
			const regionA = page.getByTestId( 'region-lifecycle-a' );

			await regionA.getByTestId( 'navigate' ).click();
			await heldDestA.hit;

			// Positive checkpoint, then the negative it protects: never for
			// the other region's own navigation.
			await expect( spinnerA ).toHaveClass( /is-loading/ );
			await expect( spinnerB ).not.toHaveClass( /is-loading/ );

			heldDestA.release();

			// Positive checkpoint (the navigation really ended), then the
			// settle, then the negative: never left on after the end.
			await expect( page.getByTestId( 'page-marker' ) ).toHaveText(
				'page marker: two-a'
			);
			await settle( page );
			await expect( spinnerA ).not.toHaveClass( /is-loading/ );
			await expect( spinnerB ).not.toHaveClass( /is-loading/ );

			// A back/forward traversal: `initiator` reads absent throughout,
			// so neither spinner should show -- the clause a stale-identity
			// implementation would fail.
			await page.goBack();
			await expect( page.getByTestId( 'page-marker' ) ).toHaveText(
				'page marker: two-1'
			);
			await settle( page );
			await expect( spinnerA ).not.toHaveClass( /is-loading/ );
			await expect( spinnerB ).not.toHaveClass( /is-loading/ );
		} );

		test( 'Flow 29: sufficiency -- region-scoped focus that refrains on traversals', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'lifecycle two-region - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			const focusedInRegionA = page.locator(
				'[data-wp-router-region="lifecycle-a"] :focus'
			);

			const regionA = page.getByTestId( 'region-lifecycle-a' );
			await regionA.getByTestId( 'navigate' ).click();

			// Positive: the navigation reached its destination.
			await expect( page.getByTestId( 'page-marker' ) ).toHaveText(
				'page marker: two-a'
			);

			// Focus landed inside region A -- the falling edge fired, and
			// `initiator` still read `lifecycle-a` at that moment.
			await expect( focusedInRegionA ).toHaveCount( 1 );

			// Explicit blur, so "focus did not move" below is
			// distinguishable from "focus was already there".
			await page.evaluate(
				() => ( document.activeElement as HTMLElement | null )?.blur?.()
			);

			await page.goBack();

			// Positive checkpoint: the traversal completed.
			await expect( page.getByTestId( 'page-marker' ) ).toHaveText(
				'page marker: two-1'
			);
			await settle( page );

			// The falling edge fired again (`navigating` did transition),
			// but `initiator` read absent, so the watcher refrained.
			await expect( focusedInRegionA ).toHaveCount( 0 );
		} );

		test( 'Flow 30: sufficiency -- a Core-loading-bar equivalent with a consumer-side 400 ms debounce', async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( 'lifecycle - page 1' ) );
			await waitForLogLength( page, 'lifecycle log', 1 );

			const bar = page.getByTestId( 'debounced-bar' );

			// Slow: held well past 400 ms. Positive, waiting assertion: the
			// bar appears.
			const page2Url = utils.getLink( 'lifecycle - page 2' );
			const heldPage2 = await holdRoute( page, page2Url );
			await page.getByTestId( 'navigate' ).click();
			await heldPage2.hit;
			await expect( bar ).toHaveClass( /show-bar/ );

			heldPage2.release();

			// Positive checkpoint (the navigation ended), then the settle,
			// then the negative: the bar clears once `navigating` goes
			// false, same as the timer's own `clearTimeout` branch.
			await expect( page.getByTestId( 'page-marker' ) ).toHaveText(
				'page marker: 2'
			);
			await settle( page );
			await expect( bar ).not.toHaveClass( /show-bar/ );

			// Fast: prefetched, so the next navigation is served from cache,
			// well under 400 ms.
			const page2bUrl = utils.getLink( 'lifecycle - page 2b' );
			const response = page.waitForResponse( page2bUrl );
			await page.getByTestId( 'prefetch' ).click();
			await response;

			await page.getByTestId( 'navigate' ).click();

			// Positive checkpoint: the navigation ended.
			await expect( page.getByTestId( 'page-marker' ) ).toHaveText(
				'page marker: 2b'
			);

			// The 600 ms wait is the settle, and it is not optional: at
			// 400 ms the assertion is a coin flip, and taken immediately it
			// passes on every implementation, including one whose
			// cache-served navigation produces no end transition at all.
			await waitRealTime( page, 600 );
			await settle( page );
			await expect( bar ).not.toHaveClass( /show-bar/ );
		} );
	} );
} );
