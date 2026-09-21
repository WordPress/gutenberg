/**
 * The release never pre-empts the pending directive flush:
 * the observable form of the "the lifecycle-release bound must remain
 * greater than one frame" invariant, and the row that must go red if the
 * bound is ever tuned down.
 *
 * This composite uses the real router, and the constants below keep the
 * measured scheduler relationship explicit rather than re-deriving it.
 *
 * This file installs fake-timer control before importing the router module
 * and never toggles it per test (unlike every other file in this
 * directory's `beforeEach`/`afterEach` pattern) -- the router's own
 * module-scope timers must be under deterministic control from the moment
 * the module evaluates, which a per-test `beforeEach` cannot guarantee.
 * That is why this row lives in its own file rather than alongside the
 * others in `lifecycle-popstate.ts`.
 */

import { expect, test, vi } from 'vitest';
import { hydrate } from 'preact';
import { store, privateApis } from '@wordpress/interactivity';
vi.mock(
	import( '@wordpress/interactivity' ),
	async () => await import( './__fixtures__/interactivity-shim' )
);

const CONSENT =
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.';
const { getRegionRootFragment, toVdom } = privateApis( CONSENT );

// The watch directive calls performance.measure()
// on every run, unimplemented by jsdom, and an unstubbed throw there aborts
// the flusher's dependency tracking silently -- the watcher would go quiet
// rather than error, the exact false-pass this rule exists to prevent.
// performance.getEntriesByType is stubbed too, since the router's module
// scope reaches onDOMReady.
test( 'row 9 — the release never pre-empts the pending directive flush (the bound-greater-than-one-frame invariant)', async () => {
	vi.useFakeTimers( { shouldAdvanceTime: true } );

	try {
		// Install these after fake timers so Vitest's faked performance object
		// cannot replace the jsdom stubs.
		window.performance.measure = vi.fn();
		window.performance.getEntriesByType = vi.fn( () => [] );
		// A window.fetch mock that never resolves on its own -- both the
		// outer navigate() call and the popstate traversal's cache entry
		// are held against it, so neither await ever settles by itself.
		window.fetch = vi.fn(
			() => new Promise( () => {} )
		) as unknown as typeof window.fetch;

		const { state, actions } = await import( '../index' );

		// An actions.navigate() left in flight: writes navigating = true
		// in its claim frame, then parks at its Promise.race yield -- it
		// never enters its finally, so it has no end write of its own to
		// be stale-guarded, and the release below is the only structure
		// that can discharge the claim while the generator remains parked.
		//
		// All three options are load-bearing for
		// reasons that have nothing to do with the assertion below:
		// screenReaderAnnouncement: false is the one that matters most --
		// left at its default the 400 ms loadingTimeout calls
		// a11ySpeak( 'loading' ), which finds no
		// #wp-script-module-data-@wordpress/interactivity-router element
		// in jsdom, takes the Core < 6.7 fallback, reads the deprecated
		// state.navigation.texts getter, and so warns under SCRIPT_DEBUG
		// -- which the console matcher setup fails the suite on.
		// loadingAnimation: false keeps that same timer from writing
		// navigation.hasStarted/hasFinished mid-measurement.
		const outerNav = actions.navigate(
			'http://localhost/release-bound-outer',
			{
				timeout: 60000,
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			}
		);
		expect( state.navigating ).toBe( true );

		// A popstate traversal to a cached entry that never settles,
		// planted against the same never-resolving fetch -- prefetch()'s
		// pages.set() happens synchronously, before its own yield.
		actions.prefetch( 'http://localhost/release-bound-dest' );

		// window.location cannot be stubbed; a
		// same-document pushState is what actually fires the router's own
		// popstate listener.
		window.history.pushState( {}, '', '/release-bound-dest' );
		window.dispatchEvent( new Event( 'popstate' ) );

		// The handler parks at its own `await pages.get( … )`: the
		// popstate claim now holds the latest token, but has not (and
		// never will, in this test) reached its own start pair -- the
		// currently-true reading it inherits is entirely the outer
		// navigation's.

		// A real hydrated data-wp-watch, reading only state.navigating,
		// hydrated only now -- after navigating is already true -- so its
		// own (frame-deferred) hydration run is "the in-flight reading"
		// this row asserts, observed before the idle one.
		const namespace = 'test/release-bound';
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

		// Phase-align the fake clock to a 16 ms boundary (any multiple of
		// 16 works; 208 is the value that was measured and executed).
		await vi.advanceTimersByTimeAsync( 208 );

		// The +1: the faked rAF's nested zero-delay setTimeout is bumped
		// to 1 ms, so the pending flush lands at "next 16 ms boundary,
		// plus 1". A 16 ms advance here yields an empty run log and reads
		// as a dead watcher -- 17 ms is what the measured recipe
		// requires. Must be the async variant: the synchronous
		// vi.advanceTimersByTime() never drains the microtask that
		// resets useSignalEffect's isExecuting guard, so it would report
		// one run at *every* bound -- a false result that looks like a
		// pass of the wrong assertion.
		await vi.advanceTimersByTimeAsync( 17 );

		expect( runs ).toEqual( [ true ] );

		// Past the release bound (10 s from the popstate claim): the
		// release restores idle, and the watcher's own next flush records
		// it as a second, frame-separated run -- not a coalesced one. A
		// release bound tuned down to land inside the still-pending
		// directive flush would collapse this to a single run reading the
		// already-settled false, which is exactly the defect this row
		// exists to catch.
		await vi.advanceTimersByTimeAsync( 10200 );

		expect( runs ).toEqual( [ true, false ] );

		void outerNav;
	} finally {
		vi.useRealTimers();
	}
} );
