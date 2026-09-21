/**
 * The popstate handler: claim, uncached-first, conditional clear, guarded
 * start/end, `catch`, and bounded release.
 *
 * Like every other file in this directory, this suite is exercised through a
 * Vitest module mock that assembles the real implementations of everything
 * the router destructures from `privateApis` -- see
 * `__fixtures__/interactivity-shim.ts`.
 *
 * `vi.resetModules()` is unusable here (`assets/dynamic-importmap`
 * defines a non-configurable global that throws on redefinition -- see the
 * harness comment in `lifecycle-navigate.ts`), so the router module is
 * imported exactly once, in `beforeAll()` below, and every test in this
 * file shares that one instance and its `core/router` store.
 *
 * Row 6 needs to *capture* the router's own `popstate` listener rather than
 * dispatch to it, so that a rejection from inside it becomes handled rather
 * than an unassertable unhandled rejection.
 * That capture only works at the listener's registration, which happens
 * once, at module evaluation -- so `window.addEventListener` is wrapped
 * *before* the one-and-only `import( '../index' )` in `beforeAll()`, and
 * every other row in this file still drives the handler the ordinary way,
 * via a real dispatched `popstate` event, since the wrapper delegates to
 * the real `addEventListener` and so registers the listener normally too.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
	vi,
} from 'vitest';
import { effect } from '@preact/signals';
import { hydrate } from 'preact';
import { store, privateApis } from '@wordpress/interactivity';
vi.mock(
	import( '@wordpress/interactivity' ),
	async () => await import( './__fixtures__/interactivity-shim' )
);

const CONSENT =
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.';
const { getRegionRootFragment, toVdom } = privateApis( CONSENT );

let state: ( typeof import('../index') )[ 'state' ];
let actions: ( typeof import('../index') )[ 'actions' ];
let capturedPopstateHandler: ( () => Promise< void > ) | undefined;

const ORIGINAL_FETCH = window.fetch;

/** Native timeout used to let fake-timer frame callbacks yield between tasks. */
const nativeSetTimeout = globalThis.setTimeout;

// Vitest's jsdom virtual console is created before the console matcher spies;
// mirror navigation diagnostics onto the current console spy.
const jsdomVirtualConsole = (
	globalThis as typeof globalThis & {
		jsdom: {
			virtualConsole: {
				on: (
					event: string,
					listener: ( error: unknown ) => void
				) => void;
			};
		};
	}
 ).jsdom.virtualConsole;
jsdomVirtualConsole.on( 'jsdomError', ( error ) => {
	// eslint-disable-next-line no-console
	console.error( error );
} );

beforeAll( async () => {
	// Wrap addEventListener only long enough to capture the router's own
	// `popstate` callback at the moment it registers it -- see the module
	// comment above. Delegating to the real addEventListener keeps normal
	// registration (and therefore normal dispatchEvent-driven tests)
	// working unchanged.
	const originalAddEventListener = window.addEventListener.bind( window );
	window.addEventListener = ( (
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: boolean | AddEventListenerOptions
	) => {
		if ( type === 'popstate' && ! capturedPopstateHandler ) {
			capturedPopstateHandler = listener as () => Promise< void >;
		}
		return originalAddEventListener( type, listener, options );
	} ) as typeof window.addEventListener;

	( { state, actions } = await import( '../index' ) );

	window.addEventListener = originalAddEventListener;
} );

beforeEach( () => {
	vi.useFakeTimers( { shouldAdvanceTime: true } );
	const fakeSetTimeout = globalThis.setTimeout;
	const redirectSetTimeout = ( (
		callback: TimerHandler,
		delay?: number,
		...args: unknown[]
	) => {
		if ( delay === undefined || delay === 0 ) {
			return nativeSetTimeout( callback, 0, ...args );
		}
		return fakeSetTimeout( callback, delay, ...args );
	} ) as typeof globalThis.setTimeout;
	globalThis.setTimeout = redirectSetTimeout;

	// The hydrated watcher in the first row calls these APIs on every run.
	// Install the stubs after fake timers so Vitest's faked performance object
	// cannot replace them.
	window.performance.measure = vi.fn();
	window.performance.getEntriesByType = vi.fn( () => [] );
} );

afterEach( () => {
	window.fetch = ORIGINAL_FETCH;
	vi.useRealTimers();
} );

/**
 * Settles `afterNextFrame` (`packages/interactivity/src/utils.ts`) on
 * either scheduler arm and drains the microtask chains a fetch/render
 * cycle depends on -- same recipe as `lifecycle-navigate.ts`'s helper of
 * the same name.
 */
async function advanceOneFrame() {
	await vi.advanceTimersByTimeAsync( 300 );
	await new Promise( ( resolve ) => nativeSetTimeout( resolve, 0 ) );
}

/**
 * Binds a raw `effect()` to the two lifecycle keys, tagging each entry with
 * only the keys that are not `undefined` -- same shape as
 * `lifecycle-navigate.ts`'s helper of the same name.
 */
function rawLifecycleLog() {
	const raw: Array< { n?: boolean; i?: string | null } > = [];
	const dispose = effect( () => {
		const entry: { n?: boolean; i?: string | null } = {};
		if ( state.navigating !== undefined ) {
			entry.n = state.navigating;
		}
		if ( state.initiator !== undefined ) {
			entry.i = state.initiator;
		}
		raw.push( entry );
	} );
	return { raw, dispose };
}

/**
 * A `window.fetch` mock that never resolves on its own: every call is
 * queued in `pending`, and the test resolves them in whatever order it
 * wants via `respond()`. Same recipe as `lifecycle-navigate.ts`.
 */
function makeDeferredFetch() {
	const pending: Array< { resolve: ( response: unknown ) => void } > = [];
	const fetchMock = vi.fn( () => {
		let resolve!: ( response: unknown ) => void;
		const promise = new Promise( ( res ) => {
			resolve = res;
		} );
		pending.push( { resolve } );
		return promise;
	} );
	return { fetchMock, pending };
}

function respond(
	deferred: { resolve: ( response: unknown ) => void },
	html: string,
	status = 200
) {
	deferred.resolve( { status, text: async () => html } );
}

const plainHtml = ( marker: string ) =>
	`<!doctype html><title>t</title><body>${ marker }</body>`;

/**
 * Moves the document to `pathname` via a same-document `pushState`, the
 * construction that fires the router's own `popstate` listener (a
 * cross-document traversal never does).
 *
 * @param pathname The path (and optional search) to push, e.g.
 *                 `/dest?x=1`.
 */
function pushStateTo( pathname: string ) {
	window.history.pushState( {}, '', pathname );
}

function dispatchPopstate() {
	window.dispatchEvent( new Event( 'popstate' ) );
}

/**
 * Hydrates a `data-wp-watch` that logs `core/router`'s `state.navigating`
 * on every run -- same recipe as `directive-observability.ts`.
 *
 * @param namespace Store namespace for the hydrated island -- must be
 *                  unique per test.
 * @return The log of `navigating` readings, one entry per watcher run.
 */
function hydrateWatcher( namespace: string ) {
	const runs: Array< boolean | undefined > = [];
	store( namespace, {
		callbacks: {
			logNavigating() {
				runs.push( state.navigating );
			},
		},
	} );

	const container = document.createElement( 'div' );
	container.innerHTML = `<div data-wp-interactive="${ namespace }" data-wp-watch="callbacks.logNavigating"></div>`;
	document.body.appendChild( container );
	const el = container.firstElementChild as Element;

	hydrate( toVdom( el ), getRegionRootFragment( el ) );

	return runs;
}

describe( 'the popstate handler', () => {
	test( 'row 1 — cached, truthy entry, from idle: a full lifecycle cycle observed through a real hydrated data-wp-watch', async () => {
		const runs = hydrateWatcher( 'test/popstate-row1' );
		await advanceOneFrame();
		expect( runs ).toHaveLength( 1 );
		const baseline = runs[ 0 ];

		await actions.prefetch( 'http://localhost/popstate-row1-dest', {
			html: plainHtml( 'row1-dest' ),
		} );

		pushStateTo( '/popstate-row1-dest' );
		dispatchPopstate();
		await advanceOneFrame();

		expect( runs ).toEqual( [ baseline, true, false ] );
		expect( state.initiator ).toBeNull();
	} );

	test( 'row 1b — a cached traversal after a completed navigation reports no stale identity, only null, not the previous navigation’s', async () => {
		await actions.navigate( 'http://localhost/popstate-row1b-prior', {
			initiator: 'region-x',
			html: plainHtml( 'prior' ),
			loadingAnimation: false,
			screenReaderAnnouncement: false,
		} );
		await advanceOneFrame();
		expect( state.initiator ).toBe( 'region-x' );

		const { raw, dispose } = rawLifecycleLog();

		await actions.prefetch( 'http://localhost/popstate-row1b-dest', {
			html: plainHtml( 'row1b-dest' ),
		} );
		pushStateTo( '/popstate-row1b-dest' );
		dispatchPopstate();
		await advanceOneFrame();

		dispose();

		expect( raw.slice( 1 ) ).toEqual( [
			{ n: true, i: null },
			{ n: false, i: null },
		] );
		expect( state.initiator ).toBeNull();
	} );

	test( 'row 2a — uncached traversal, from idle: no consumer code runs before the reload, and no lifecycle write happens', async () => {
		let adversarialRuns = 0;
		const dispose = effect( () => {
			// Read both keys to subscribe.
			void state.navigating;
			void state.initiator;
			adversarialRuns++;
			if ( adversarialRuns > 1 ) {
				throw new Error(
					'adversarial watcher must never run on an uncached traversal'
				);
			}
		} );

		pushStateTo( '/popstate-row2a-absent' );
		dispatchPopstate();
		await advanceOneFrame();

		dispose();

		expect( adversarialRuns ).toBe( 1 );
		// jsdom reports "Not implemented: navigation (except hash changes)"
		// through console.error when window.location.reload() runs.
		expect( console ).toHaveErrored();
	} );

	test( 'row 2b — uncached traversal superseding a navigation in flight writes nothing at all (pins the uncached-first ordering)', async () => {
		const { fetchMock } = makeDeferredFetch();
		window.fetch = fetchMock as unknown as typeof window.fetch;

		const inFlight = actions.navigate(
			'http://localhost/popstate-row2b-inflight',
			{
				initiator: 'region-x',
				timeout: 60000,
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			}
		);

		// The reactive call's synchronous prefix -- including its start
		// batch -- has already run by this point.
		expect( state.navigating ).toBe( true );
		expect( state.initiator ).toBe( 'region-x' );

		const { raw, dispose } = rawLifecycleLog();

		pushStateTo( '/popstate-row2b-absent' );
		dispatchPopstate();
		await advanceOneFrame();

		dispose();

		expect( raw.slice( 1 ) ).toEqual( [] );
		expect( state.navigating ).toBe( true );
		expect( state.initiator ).toBe( 'region-x' );
		expect( console ).toHaveErrored();

		// Clean up: popstate's own release (armed under its own claim,
		// still current -- the in-flight navigate() above never
		// superseded it) restores idle at its bound. Advancing past it
		// here, before this test's fake timers are torn down, keeps a
		// stale reading from leaking into a later test sharing this
		// file's one module instance -- navigate()'s own fallback has
		// deliberately no release of its own (see the design), and a
		// timer armed under fake timers never fires once they're torn
		// down.
		await vi.advanceTimersByTimeAsync( 10600 );
		expect( state.navigating ).toBe( false );

		// Left permanently unresolved -- its own token is stale from the
		// moment popstate claimed a newer one, so it can never write
		// again.
		void inFlight;
	} );

	test( 'row 3 — a cached entry that resolves falsy: no start pair, no end, reload on a normal return', async () => {
		window.fetch = vi.fn( async () => ( {
			status: 404,
			text: async () => '',
		} ) ) as unknown as typeof window.fetch;

		await actions.prefetch( 'http://localhost/popstate-row3-dest' );

		const beforeNavigating = state.navigating;
		const beforeInitiator = state.initiator;
		const { raw, dispose } = rawLifecycleLog();

		pushStateTo( '/popstate-row3-dest' );
		dispatchPopstate();
		await advanceOneFrame();

		dispose();

		expect( raw.slice( 1 ) ).toEqual( [] );
		expect( state.navigating ).toBe( beforeNavigating );
		expect( state.initiator ).toBe( beforeInitiator );
		expect( console ).toHaveErrored();
	} );

	test( 'row 4 — plain idle traversal to a cached entry: the clear notifies nobody (raw effect(), the opposite instrument of row 1)', async () => {
		await actions.prefetch( 'http://localhost/popstate-row4-dest', {
			html: plainHtml( 'row4-dest' ),
		} );

		const { raw, dispose } = rawLifecycleLog();

		pushStateTo( '/popstate-row4-dest' );
		dispatchPopstate();
		await advanceOneFrame();

		dispose();

		expect( raw.slice( 1 ) ).toEqual( [
			{ n: true, i: null },
			{ n: false, i: null },
		] );
	} );

	test( 'row 5 — a cached traversal superseding a navigation in flight, whose entry has not yet settled: reads in flight throughout, then closes its own cycle', async () => {
		const { fetchMock, pending } = makeDeferredFetch();
		window.fetch = fetchMock as unknown as typeof window.fetch;

		const inFlight = actions.navigate(
			'http://localhost/popstate-row5-inflight',
			{
				initiator: 'region-x',
				timeout: 60000,
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			}
		);
		expect( pending ).toHaveLength( 1 );

		// Plant the traversal's own cache entry against a second held
		// fetch -- not awaited: prefetch()'s pages.set() happens
		// synchronously, before its own yield.
		actions.prefetch( 'http://localhost/popstate-row5-dest' );
		expect( pending ).toHaveLength( 2 );

		pushStateTo( '/popstate-row5-dest' );
		dispatchPopstate();

		// From the moment of supersession: initiator reads absent, and the
		// lifecycle is still in flight.
		expect( state.initiator ).toBeNull();
		expect( state.navigating ).toBe( true );

		// Deliver the superseded navigation's response: its finally runs
		// while the traversal is still awaiting its own (still-pending)
		// entry.
		respond( pending[ 0 ], plainHtml( 'row5-inflight' ) );
		await advanceOneFrame();

		// The superseded navigation's end write is stale-guarded: the
		// lifecycle still reads in flight, on the traversal's own claim.
		expect( state.navigating ).toBe( true );
		expect( state.initiator ).toBeNull();

		await inFlight;

		// Now the traversal's own cached entry settles: its cycle closes.
		respond( pending[ 1 ], plainHtml( 'row5-dest' ) );
		await advanceOneFrame();

		expect( state.navigating ).toBe( false );
		expect( state.initiator ).toBeNull();
	} );

	describe( 'row 6 — exceptional exit (captured-listener instrument)', () => {
		test( 'half 1 — the lifecycle is restored idle a frame later; half 2 — the original error still propagates', async () => {
			await actions.prefetch( 'http://localhost/popstate-row6-dest', {
				html: plainHtml( 'row6-dest' ),
			} );

			// A consumer effect that throws the moment the traversal's
			// start pair makes navigating truthy.
			const dispose = effect( () => {
				if ( state.navigating === true ) {
					throw new Error( 'consumer-effect-throw' );
				}
			} );

			pushStateTo( '/popstate-row6-dest' );

			expect( capturedPopstateHandler ).toBeDefined();

			let settled: 'resolved' | 'rejected' | undefined;
			let rethrown: unknown;
			capturedPopstateHandler!().then(
				() => {
					settled = 'resolved';
				},
				( error: unknown ) => {
					settled = 'rejected';
					rethrown = error;
				}
			);

			await advanceOneFrame();

			dispose();

			// Half 1 — the lifecycle is restored idle a frame later.
			expect( state.navigating ).toBe( false );

			// Half 2 — the original error still propagates, handled here
			// only because the listener was captured and invoked directly
			// (see the module comment) rather than reached via
			// dispatchEvent, which hands back no promise to catch at all.
			expect( settled ).toBe( 'rejected' );
			expect( ( rethrown as Error ).message ).toBe(
				'consumer-effect-throw'
			);
		} );

		test( 'characterisation — no `await` sits between the catch’s scheduled restoration and its rethrow (source-level guard)', () => {
			const routerIndexSource = readFileSync(
				join(
					dirname( fileURLToPath( import.meta.url ) ),
					'../index.ts'
				),
				'utf-8'
			);

			// `await`-ing before the rethrow is byte-identical to the
			// correct implementation on every behavioural observable
			// so this clause is pinned at source level rather than claimed as a
			// behavioural assertion.
			const catchBlockSource = '\t} catch ( error ) {\n';

			expect( routerIndexSource ).toContain( catchBlockSource );

			const catchIndex = routerIndexSource.indexOf( catchBlockSource );
			const throwIndex = routerIndexSource.indexOf(
				'throw error;',
				catchIndex
			);
			const catchBody = routerIndexSource.slice( catchIndex, throwIndex );

			expect( catchBody ).not.toContain( 'await' );
		} );
	} );

	describe( 'row 7 — the claim never discharges, and the guard is not decoration', () => {
		test( 'half 1 — the release restores idle at the bound when the awaited entry never settles', async () => {
			const { fetchMock, pending } = makeDeferredFetch();
			window.fetch = fetchMock as unknown as typeof window.fetch;

			const { raw, dispose } = rawLifecycleLog();

			// An outer navigation in flight, so state.navigating reads
			// true -- parked, on a held fetch, timeout well beyond this
			// test's advances.
			const outerNav = actions.navigate(
				'http://localhost/popstate-row7a-outer',
				{
					timeout: 60000,
					loadingAnimation: false,
					screenReaderAnnouncement: false,
				}
			);
			expect( pending ).toHaveLength( 1 );

			// A popstate traversal to a cache entry planted against a
			// second held fetch, so it never settles either.
			actions.prefetch( 'http://localhost/popstate-row7a-dest' );
			expect( pending ).toHaveLength( 2 );

			pushStateTo( '/popstate-row7a-dest' );
			dispatchPopstate();

			expect( raw.slice( 1 ) ).toEqual( [ { n: true, i: null } ] );

			// Well before the bound: still in flight, nothing new
			// published.
			await vi.advanceTimersByTimeAsync( 5000 );
			expect( state.navigating ).toBe( true );
			expect( raw.slice( 1 ) ).toEqual( [ { n: true, i: null } ] );

			// Past the bound: the release restores idle.
			await vi.advanceTimersByTimeAsync( 5500 );
			dispose();

			expect( state.navigating ).toBe( false );
			expect( raw.slice( 1 ) ).toEqual( [
				{ n: true, i: null },
				{ n: false, i: null },
			] );

			void outerNav;
		} );

		test( "half 2 — the guard: a second navigation left in flight at the first claim's bound is not disturbed", async () => {
			// An ordinary cached traversal completes first -- this claims
			// and discharges its own token normally.
			await actions.prefetch( 'http://localhost/popstate-row7b-first', {
				html: plainHtml( 'row7b-first' ),
			} );
			pushStateTo( '/popstate-row7b-first' );
			dispatchPopstate();
			await advanceOneFrame();
			expect( state.navigating ).toBe( false );

			// A second navigation starts and is left in flight -- held
			// fetch, timeout beyond the advance below.
			const { fetchMock, pending } = makeDeferredFetch();
			window.fetch = fetchMock as unknown as typeof window.fetch;
			const secondNav = actions.navigate(
				'http://localhost/popstate-row7b-second',
				{
					timeout: 60000,
					loadingAnimation: false,
					screenReaderAnnouncement: false,
				}
			);
			expect( state.navigating ).toBe( true );

			const { raw, dispose } = rawLifecycleLog();

			// Advance past the FIRST claim's (the popstate traversal's)
			// 10 s bound -- it must find itself no longer current and
			// write nothing.
			await vi.advanceTimersByTimeAsync( 10600 );
			dispose();

			expect( state.navigating ).toBe( true );
			expect( raw.slice( 1 ) ).toEqual( [] );

			// Clean up: settle the second navigation normally (its own
			// claim is still current, so its finally's guarded end fires
			// as usual) so a later test sharing this file's one module
			// instance does not inherit a stale in-flight reading --
			// unlike a popstate claim, navigate()'s own fallback has
			// deliberately no release timer to fall back on.
			respond( pending[ 0 ], plainHtml( 'row7b-second' ) );
			await advanceOneFrame();
			await secondNav;
			expect( state.navigating ).toBe( false );
		} );
	} );

	test( 'row 8 — a cache entry that settles after the release bound produces a second, well-ordered cycle', async () => {
		const { fetchMock, pending } = makeDeferredFetch();
		window.fetch = fetchMock as unknown as typeof window.fetch;

		const { raw, dispose } = rawLifecycleLog();

		// A navigation in flight on a never-resolving fetch -- required:
		// from idle the release's own state.navigating guard is a no-op
		// and this row cannot be built.
		const outerNav = actions.navigate(
			'http://localhost/popstate-row8-outer',
			{
				timeout: 60000,
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			}
		);
		expect( pending ).toHaveLength( 1 );

		// A traversal to an entry planted against a second held fetch, so
		// pages.get() is still pending when the release fires.
		actions.prefetch( 'http://localhost/popstate-row8-dest' );
		expect( pending ).toHaveLength( 2 );

		pushStateTo( '/popstate-row8-dest' );
		dispatchPopstate();

		expect( raw.slice( 1 ) ).toEqual( [ { n: true, i: null } ] );

		// Past the release bound: the release restores idle.
		await vi.advanceTimersByTimeAsync( 10600 );
		expect( raw.slice( 1 ) ).toEqual( [
			{ n: true, i: null },
			{ n: false, i: null },
		] );

		// Now the entry settles: a second, well-ordered cycle -- not a
		// suppressed start with no matching end.
		respond( pending[ 1 ], plainHtml( 'row8-dest' ) );
		await advanceOneFrame();
		dispose();

		expect( raw.slice( 1 ) ).toEqual( [
			{ n: true, i: null },
			{ n: false, i: null },
			{ n: true, i: null },
			{ n: false, i: null },
		] );

		void outerNav;
	} );

	test( 'row 10 — the existing render batch is unchanged (drift guard), asserted at source level against a literal', () => {
		const routerIndexSource = readFileSync(
			join( dirname( fileURLToPath( import.meta.url ) ), '../index.ts' ),
			'utf-8'
		);

		// This must stay byte-identical to packages/interactivity-router/
		// src/index.ts's popstate handler's render batch. What it
		// protects: the handler is structured *around* an
		// existing batch without disturbing it, and state.url still
		// updates on traversals exactly as today.
		const popstateRenderBatchSource =
			'\t\tbatch( () => {\n' +
			'\t\t\tstate.url = window.location.href;\n' +
			'\t\t\trenderPage( page );\n' +
			'\t\t} );';

		expect( routerIndexSource ).toContain( popstateRenderBatchSource );
	} );
} );
