/**
 * Row 7 — a real hydrated `data-wp-watch` observes the navigation lifecycle
 * as three distinct runs (hydration, in flight, ended), on both of
 * `afterNextFrame`'s scheduler arms.
 *
 * This is the one file in this task that hydrates a real `data-wp-watch`,
 * so it is the one that must stub `performance.measure` and
 * `performance.getEntriesByType` (investigation fact 4): the directive
 * wrapper calls `performance.measure` on every run, which jsdom does not
 * implement, and an unstubbed throw there aborts the flusher's dependency
 * tracking silently — the watcher goes quiet rather than erroring visibly,
 * which is the exact false-pass this rule exists to prevent.
 */

/**
 * External dependencies
 */
import { hydrate } from 'preact';

/**
 * WordPress dependencies
 */
jest.mock( '@wordpress/interactivity', () =>
	require( './__fixtures__/interactivity-shim' )
);

import { store, privateApis } from '@wordpress/interactivity';

const CONSENT =
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.';
const { getRegionRootFragment, toVdom } = privateApis( CONSENT );

beforeAll( () => {
	// See the module comment: only this file needs these stubs.

	window.performance.measure = jest.fn();

	window.performance.getEntriesByType = jest.fn( () => [] );
} );

beforeEach( () => {
	jest.useFakeTimers();
} );

afterEach( () => {
	jest.useRealTimers();
} );

/**
 * Settles `afterNextFrame` on either scheduler arm. 300 ms comfortably
 * covers two chained `afterNextFrame` windows (the watcher's own flush and
 * the router's end write, each racing a 100 ms fallback) plus margin, which
 * the requestAnimationFrame-stubbed arm needs — a bare 100 ms advance
 * settles the standard rAF arm but not that one.
 */
async function advanceOneFrame() {
	await jest.advanceTimersByTimeAsync( 300 );
}

/**
 * Hydrates a `data-wp-watch` that logs `core/router`'s `state.navigating` on
 * every run, into a fresh namespace/element so it does not collide with any
 * other hydrated island (investigation fact 8).
 *
 * @param namespace              Store namespace for the hydrated island —
 *                               must be unique per test.
 * @param routerState            The router's own `state` object.
 * @param routerState.navigating The lifecycle key logged on every run.
 * @return The log of `navigating` readings, one entry per watcher run.
 */
function hydrateWatcher(
	namespace: string,
	routerState: { navigating?: boolean }
) {
	const runs: Array< boolean | undefined > = [];
	store( namespace, {
		callbacks: {
			logNavigating() {
				runs.push( routerState.navigating );
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

describe( 'directive observability — row 7', () => {
	// Both tests below import the same router module instance
	// (`jest.resetModules()` is unusable here — see the harness comment in
	// `lifecycle-navigate.ts`), so the second test's hydration may observe
	// a residual `navigating` reading left over from the first test's
	// completed navigation, rather than a pristine `undefined`. Each test
	// therefore treats its own first (hydration) run as its baseline,
	// rather than hard-coding `undefined` — the property under test is the
	// run **count** and the two later readings, not the pre-navigation
	// value.

	test( 'the requestAnimationFrame scheduler arm produces three runs: hydration, in flight, ended', async () => {
		const { state, actions } = await import( '../index' );
		const runs = hydrateWatcher( 'test/observability-raf', state );
		// useWatch()'s effect is a Preact useEffect, which is deferred:
		// flush it before asserting the hydration run happened.
		await advanceOneFrame();

		expect( runs ).toHaveLength( 1 );
		const baseline = runs[ 0 ];

		await actions.navigate( 'http://localhost/directive-obs-raf', {
			html: '<!doctype html><title>t</title><body>dest</body>',
			loadingAnimation: false,
			screenReaderAnnouncement: false,
		} );
		await advanceOneFrame();

		expect( runs ).toEqual( [ baseline, true, false ] );
	} );

	test( 'the 100 ms timeout scheduler arm (requestAnimationFrame stubbed never to fire) also produces three runs', async () => {
		window.requestAnimationFrame = jest.fn( () => 0 );

		const { state, actions } = await import( '../index' );
		const runs = hydrateWatcher( 'test/observability-timeout', state );
		await advanceOneFrame();

		expect( runs ).toHaveLength( 1 );
		const baseline = runs[ 0 ];

		await actions.navigate( 'http://localhost/directive-obs-timeout', {
			html: '<!doctype html><title>t</title><body>dest</body>',
			loadingAnimation: false,
			screenReaderAnnouncement: false,
		} );
		await advanceOneFrame();

		expect( runs ).toEqual( [ baseline, true, false ] );
	} );
} );
