/**
 * The `navigate()` lifecycle write protocol.
 *
 * The router is exercised through a Vitest module mock that assembles the
 * real implementations of everything it destructures from `privateApis`.
 * See `__fixtures__/interactivity-shim.ts`.
 *
 * Because `vi.resetModules()` is unusable here (`assets/dynamic-importmap`
 * defines a non-configurable global that throws on redefinition), the
 * router module is imported exactly once per file and every test in this
 * file shares that one instance and its `core/router` store. The three tests
 * that depend on the lifecycle keys never having been written to (the
 * pristine `undefined` reading, `prefetch()` alone, and the entry-check
 * rejection) run first, in that order, before any test performs a real
 * navigation.
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { effect } from '@preact/signals';
import { hydrate } from 'preact';
import { store, privateApis } from '@wordpress/interactivity';
import { populateServerData } from './__fixtures__/interactivity-shim';
vi.mock(
	import( '@wordpress/interactivity' ),
	async () => await import( './__fixtures__/interactivity-shim' )
);

const CONSENT =
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.';
const { getRegionRootFragment, toVdom } = privateApis( CONSENT );

let router: typeof import('../index');
let state: ( typeof import('../index') )[ 'state' ];
let actions: ( typeof import('../index') )[ 'actions' ];

const ORIGINAL_FETCH = window.fetch;

// Vitest's jsdom environment forwards jsdom errors through the virtual
// console created before the console matcher spies are installed. Mirror those
// events onto the current spy so assertions about intentional navigation
// diagnostics keep observing the same runtime signal.
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

beforeEach( () => {
	vi.useFakeTimers( { shouldAdvanceTime: true } );
} );

afterEach( () => {
	window.fetch = ORIGINAL_FETCH;
	vi.useRealTimers();
} );

/**
 * Advances the fake clock far enough to settle `afterNextFrame`
 * (`packages/interactivity/src/utils.ts`) on either of its two scheduler
 * arms — the `requestAnimationFrame` race or its 100 ms timeout fallback —
 * and to drain the microtask chains a fetch/render cycle depends on.
 */
async function advanceOneFrame() {
	await vi.advanceTimersByTimeAsync( 100 );
}

/**
 * Binds a raw `effect()` to the two lifecycle keys, tagging each entry with
 * only the keys that are not `undefined` — the shape the lifecycle tests'
 * fingerprints are stated against (e.g. `{ n: true }` with no `i`).
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
 * wants via `respond()`.
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

/**
 * Hydrates a `[data-wp-interactive][data-wp-router-region]` element for
 * real, using the same `getRegionRootFragment` + `toVdom` + `hydrate`
 * recipe `packages/interactivity/src/hydration.ts`'s `hydrateRegions` uses
 * — done manually here because that function itself
 * lives inside the unimportable `packages/interactivity/src/index.ts`.
 *
 * @param id            Router region id — also used as the store namespace,
 *                      so it must be unique per test.
 * @param initialMarker Marker text rendered inside the region initially.
 */
function setupRegion( id: string, initialMarker: string ) {
	store( `test/${ id }`, {} );

	const container = document.createElement( 'div' );
	container.innerHTML =
		`<div data-wp-interactive="test/${ id }" data-wp-router-region="${ id }">` +
		`<span data-testid="${ id }-marker">${ initialMarker }</span>` +
		`</div>`;
	document.body.appendChild( container );
	const regionEl = container.firstElementChild as Element;

	const fragment = getRegionRootFragment( regionEl );
	hydrate( toVdom( regionEl ), fragment );

	return {
		markerText: () =>
			document.querySelector( `[data-testid="${ id }-marker"]` )
				?.textContent,
	};
}

function regionPageHtml( id: string, marker: string ) {
	return (
		'<!doctype html><title>t</title><body>' +
		`<div data-wp-interactive="test/${ id }" data-wp-router-region="${ id }">` +
		`<span data-testid="${ id }-marker">${ marker }</span>` +
		'</div></body>'
	);
}

const plainHtml = ( marker: string ) =>
	`<!doctype html><title>t</title><body>${ marker }</body>`;

describe( 'navigate() lifecycle write protocol', () => {
	test( 'before any navigation the lifecycle keys read undefined, and loading the router module alone does not re-run a watcher already bound to the namespace', async () => {
		const { state: preState } = store( 'core/router', {} ) as {
			state: typeof state;
		};

		expect( preState.navigating ).toBeUndefined();
		expect( preState.initiator ).toBeUndefined();

		const runs: Array< boolean | undefined > = [];
		const dispose = effect( () => {
			runs.push( preState.navigating );
		} );

		expect( runs ).toEqual( [ undefined ] );

		router = await import( '../index' );
		( { state, actions } = router );

		// Neither key is declared in the store literal, so merging the
		// router's own `store()` call into the already-bound namespace
		// must not re-run the watcher.
		expect( runs ).toEqual( [ undefined ] );
		expect( state.initiator ).toBeUndefined();

		dispose();
	} );

	test( 'actions.prefetch() alone produces no lifecycle transition at all', async () => {
		const { raw, dispose } = rawLifecycleLog();

		await actions.prefetch( 'http://localhost/row14-dest', {
			html: plainHtml( 'row14-dest' ),
		} );

		dispose();

		expect( raw.slice( 1 ) ).toEqual( [] );
		expect( state.navigating ).toBeUndefined();
		expect( state.initiator ).toBeUndefined();
	} );

	test( 'an entry-check rejection produces no lifecycle transition, and the lifecycle reads idle throughout', async () => {
		populateServerData( {
			config: { 'core/router': { clientNavigationDisabled: true } },
		} );

		const { raw, dispose } = rawLifecycleLog();

		const promise = actions.navigate( 'http://localhost/row15-dest', {
			loadingAnimation: false,
			screenReaderAnnouncement: false,
		} );
		let settled = false;
		promise.then(
			() => {
				settled = true;
			},
			() => {
				settled = true;
			}
		);

		await vi.advanceTimersByTimeAsync( 0 );
		dispose();

		expect( raw.slice( 1 ) ).toEqual( [] );
		expect( state.navigating ).toBeUndefined();
		expect( state.initiator ).toBeUndefined();
		expect( settled ).toBe( false );
		// jsdom logs "Not implemented: navigation (except hash changes)"
		// through console.error when forcePageReload() calls
		// window.location.assign() — jsdom reports the attempted navigation.
		expect( console ).toHaveErrored();

		// This call never reached renderPage()'s own populateServerData()
		// call, so the config set above would otherwise leak into every
		// later test in this file. Reset it explicitly.
		populateServerData();
	} );

	test( 'the start pair is atomic: no notification is published in which navigating is truthy and initiator is still absent', async () => {
		const { raw, dispose } = rawLifecycleLog();

		await actions.navigate( 'http://localhost/row2-dest', {
			initiator: 'region-x',
			html: plainHtml( 'row2-dest' ),
			loadingAnimation: false,
			screenReaderAnnouncement: false,
		} );
		await advanceOneFrame();
		dispose();

		expect(
			raw.some( ( entry ) => entry.n === true && entry.i === undefined )
		).toBe( false );
		// Sanity: the row must not pass vacuously — the happy-path entries
		// are actually present.
		expect(
			raw.some( ( entry ) => entry.n === true && entry.i === 'region-x' )
		).toBe( true );
		expect( raw.some( ( entry ) => entry.n === false ) ).toBe( true );
	} );

	test( 'initiator is not cleared by the end write and stays readable at and after the end', async () => {
		await actions.navigate( 'http://localhost/row3-dest', {
			initiator: 'region-x',
			html: plainHtml( 'row3-dest' ),
			loadingAnimation: false,
			screenReaderAnnouncement: false,
		} );
		await advanceOneFrame();

		expect( {
			navigating: state.navigating,
			initiator: state.initiator,
		} ).toEqual( { navigating: false, initiator: 'region-x' } );
	} );

	test( 'the transitions are produced regardless of options, of a forced same-URL navigation, and for consecutive navigations without any latch', async () => {
		// Clause 1: loadingAnimation/screenReaderAnnouncement both false.
		{
			const { raw, dispose } = rawLifecycleLog();
			await actions.navigate( 'http://localhost/row4-a', {
				html: plainHtml( 'row4-a' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} );
			await advanceOneFrame();
			dispose();
			expect( raw.length - 1 ).toBe( 2 );
		}

		// Clause 2: navigate( currentUrl, { force: true } ) — same URL.
		{
			const currentUrl = state.url;
			const { raw, dispose } = rawLifecycleLog();
			await actions.navigate( currentUrl, {
				force: true,
				html: plainHtml( 'row4-b' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} );
			await advanceOneFrame();
			dispose();
			expect( raw.length - 1 ).toBe( 2 );
		}

		// Clause 3: the second of two consecutive navigations, isolated.
		{
			await actions.navigate( 'http://localhost/row4-c1', {
				html: plainHtml( 'row4-c1' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} );
			await advanceOneFrame();

			const { raw, dispose } = rawLifecycleLog();
			await actions.navigate( 'http://localhost/row4-c2', {
				html: plainHtml( 'row4-c2' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} );
			await advanceOneFrame();
			dispose();
			expect( raw.length - 1 ).toBe( 2 );
		}
	} );

	test( 'the end transition observes the committed DOM and the destination URL (raw effect(), the deliberate split-the-effects exception)', async () => {
		const region = setupRegion( 'row6', 'origin-marker' );
		const href = 'http://localhost/row6-dest';

		const entries: Array< {
			navigating: boolean | undefined;
			url: string;
			dom: string | undefined;
		} > = [];
		const dispose = effect( () => {
			entries.push( {
				navigating: state.navigating,
				url: state.url,
				dom: region.markerText(),
			} );
		} );

		await actions.navigate( href, {
			html: regionPageHtml( 'row6', 'dest-marker' ),
			loadingAnimation: false,
			screenReaderAnnouncement: false,
		} );
		await advanceOneFrame();
		dispose();

		// Slice off the effect's own subscription run, which captures
		// whatever this shared store's residual state happens to be from an
		// earlier test — including, possibly, `navigating: false` — before
		// this test's navigation has even started.
		const endEntry = entries
			.slice( 1 )
			.find( ( entry ) => entry.navigating === false );
		expect( endEntry ).toEqual( {
			navigating: false,
			url: href,
			dom: 'dest-marker',
		} );
	} );

	test( 'a throw in the post-commit hash-scroll tail still lands the end write, leaves the lifecycle idle, and the original error still propagates', async () => {
		const { raw, dispose } = rawLifecycleLog();

		let caught: unknown;
		try {
			await actions.navigate( 'http://localhost/row8-dest#2024-report', {
				html: plainHtml( 'row8-dest' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} );
		} catch ( error ) {
			caught = error;
		}
		await advanceOneFrame();
		dispose();

		expect( caught ).toBeInstanceOf( window.DOMException );
		expect( ( caught as Error ).name ).toBe( 'SyntaxError' );
		expect( state.navigating ).toBe( false );
		expect( raw.slice( 1 ) ).toEqual( [
			{ n: true, i: null },
			{ n: false, i: null },
		] );
	} );

	test( 'a navigation superseded at the existing-URL bail runs its finally, finds the token no longer current, and writes nothing', async () => {
		const { fetchMock, pending } = makeDeferredFetch();
		window.fetch = fetchMock as unknown as typeof window.fetch;

		const callA = actions.navigate( 'http://localhost/row9-a', {
			initiator: 'region-x',
			loadingAnimation: false,
			screenReaderAnnouncement: false,
		} );
		const callB = actions.navigate( 'http://localhost/row9-b', {
			initiator: 'region-x',
			loadingAnimation: false,
			screenReaderAnnouncement: false,
		} );

		expect( pending ).toHaveLength( 2 );

		// Deliver the superseded call's (A's) response first.
		respond( pending[ 0 ], plainHtml( 'row9-a' ) );
		await advanceOneFrame();

		// (a) the lifecycle clause — still in flight.
		expect( state.navigating ).toBe( true );
		// (b) the identity clause remains in phase with the navigation.
		expect( state.initiator ).toBe( 'region-x' );

		respond( pending[ 1 ], plainHtml( 'row9-b' ) );
		await advanceOneFrame();
		await callA;
		await callB;
	} );

	test( 'staggered same-href overlap under { force: true }, the natural delivery order', async () => {
		const region = setupRegion( 'row10', 'origin' );
		const href = 'http://localhost/row10-dest';

		const { fetchMock, pending } = makeDeferredFetch();
		window.fetch = fetchMock as unknown as typeof window.fetch;

		const { raw, dispose } = rawLifecycleLog();

		const call1 = actions.navigate( href, {
			force: true,
			loadingAnimation: false,
			screenReaderAnnouncement: false,
		} );
		const call2 = actions.navigate( href, {
			force: true,
			loadingAnimation: false,
			screenReaderAnnouncement: false,
		} );

		expect( pending ).toHaveLength( 2 );

		respond( pending[ 0 ], regionPageHtml( 'row10', 'call-1-body' ) );
		await advanceOneFrame();

		expect( raw.slice( 1 ) ).toEqual( [ { n: true, i: null } ] );
		expect( state.navigating ).toBe( true );

		respond( pending[ 1 ], regionPageHtml( 'row10', 'call-2-body' ) );
		await advanceOneFrame();
		await call1;
		await call2;

		expect( raw.slice( 1 ) ).toEqual( [
			{ n: true, i: null },
			{ n: false, i: null },
		] );
		expect( region.markerText() ).toBe( 'call-2-body' );
		dispose();
	} );

	test( 'a second navigation claiming the token inside the frame-wide window makes the stale scheduled end write nothing', async () => {
		const { raw, dispose } = rawLifecycleLog();

		// First navigation: cache-served, reaches its finally and schedules
		// its end — but nothing has fired yet, since no fake time has
		// advanced.
		await actions.navigate( 'http://localhost/row12-a', {
			html: plainHtml( 'row12-a' ),
			loadingAnimation: false,
			screenReaderAnnouncement: false,
		} );

		// Second navigation: held in flight across the frame on a
		// never-delivered fetch.
		const { fetchMock, pending } = makeDeferredFetch();
		window.fetch = fetchMock as unknown as typeof window.fetch;
		const call2 = actions.navigate( 'http://localhost/row12-b', {
			timeout: 60000,
			loadingAnimation: false,
			screenReaderAnnouncement: false,
		} );

		// Advance one frame: the first call's stale scheduled end fires,
		// re-checks its token and finds it no longer current — it writes
		// nothing, because the second call already claimed the token.
		await advanceOneFrame();

		expect( raw.slice( 1 ) ).toEqual( [ { n: true, i: null } ] );
		expect( state.navigating ).toBe( true );

		respond( pending[ 0 ], plainHtml( 'row12-b' ) );
		await advanceOneFrame();
		await call2;

		expect( raw.slice( 1 ) ).toEqual( [
			{ n: true, i: null },
			{ n: false, i: null },
		] );
		dispose();
	} );

	test( "actions.navigate()'s promise for a cache-served call resolves on microtasks alone", async () => {
		const promise = actions.navigate( 'http://localhost/row13-dest', {
			html: plainHtml( 'row13-dest' ),
			loadingAnimation: false,
			screenReaderAnnouncement: false,
		} );

		let settledOnMicrotasks = false;
		promise.then( () => {
			settledOnMicrotasks = true;
		} );

		for ( let i = 0; i < 50; i++ ) {
			await Promise.resolve();
		}

		expect( settledOnMicrotasks ).toBe( true );

		// Let the scheduled end write fire so it doesn't leak into later
		// tests.
		await advanceOneFrame();
	} );

	test( 'a newer navigation keeps the lifecycle in flight when an earlier fallback release reaches its bound', async () => {
		let fetchCount = 0;
		const pending: Array< { resolve: ( response: unknown ) => void } > = [];
		window.fetch = vi.fn( () => {
			if ( fetchCount++ === 0 ) {
				return Promise.resolve( {
					status: 404,
					text: async () => '',
				} );
			}
			let resolve!: ( response: unknown ) => void;
			const promise = new Promise( ( res ) => {
				resolve = res;
			} );
			pending.push( { resolve } );
			return promise;
		} ) as unknown as typeof window.fetch;

		const fallback = actions.navigate(
			'http://localhost/row11-guard-fallback',
			{
				initiator: 'fallback',
				timeout: 60000,
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			}
		);
		await vi.advanceTimersByTimeAsync( 0 );

		const { raw, dispose } = rawLifecycleLog();
		const newer = actions.navigate( 'http://localhost/row11-guard-newer', {
			initiator: 'newer',
			timeout: 60000,
			loadingAnimation: false,
			screenReaderAnnouncement: false,
		} );
		const logAtNewerClaim = raw.slice( 1 );

		expect( pending ).toHaveLength( 1 );
		await vi.advanceTimersByTimeAsync( 10000 );
		dispose();

		expect( {
			navigating: state.navigating,
			initiator: state.initiator,
		} ).toEqual( { navigating: true, initiator: 'newer' } );
		expect( raw.slice( 1 ) ).toEqual( logAtNewerClaim );

		respond( pending[ 0 ], plainHtml( 'row11-guard-newer' ) );
		await advanceOneFrame();
		await newer;
		expect( console ).toHaveErrored();

		void fallback;
	} );

	// This row deliberately leaves its navigation promise parked at
	// `forcePageReload()`, but the lifecycle release has already restored idle
	// and retained the declared initiator. The unresolved generator is stale
	// as soon as a later navigation claims the token, so no ordering requirement
	// remains for the lifecycle reading.
	test( 'a navigation that falls back mid-flight is released after the bound while its reload remains pending', async () => {
		window.fetch = vi.fn( async () => ( {
			status: 404,
			text: async () => '',
		} ) ) as unknown as typeof window.fetch;

		const { raw, dispose } = rawLifecycleLog();

		const promise = actions.navigate( 'http://localhost/row11-dest', {
			initiator: 'row11-fallback',
			timeout: 60000,
			loadingAnimation: false,
			screenReaderAnnouncement: false,
		} );
		let settled = false;
		promise.then(
			() => {
				settled = true;
			},
			() => {
				settled = true;
			}
		);

		// Advance past the fallback's release bound, the 400 ms loadingTimeout,
		// and the 60 s timeout promise. The forcePageReload() yield remains
		// parked, so the navigation promise never settles.
		await vi.advanceTimersByTimeAsync( 60000 + 400 + 200 );
		dispose();

		expect( settled ).toBe( false );
		expect( raw.slice( 1 ) ).toEqual( [
			{ n: true, i: 'row11-fallback' },
			{ n: false, i: 'row11-fallback' },
		] );
		expect( {
			navigating: state.navigating,
			initiator: state.initiator,
		} ).toEqual( {
			navigating: false,
			initiator: 'row11-fallback',
		} );
		expect( console ).toHaveErrored();
	} );
} );
