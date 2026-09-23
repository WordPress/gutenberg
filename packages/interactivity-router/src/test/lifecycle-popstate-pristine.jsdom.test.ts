/**
 * A cached popstate traversal from an untouched router instance must not
 * materialize the lifecycle identity while claiming the traversal.
 *
 * This case lives in its own suite because the shared popstate suite imports
 * the router once for all of its rows. Its earlier navigations therefore
 * materialize both lifecycle keys before its cached-idle row runs. A separate
 * Vitest module graph keeps this suite's first lifecycle-affecting action --
 * the traversal itself -- genuinely pristine.
 */

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
vi.mock(
	import( '@wordpress/interactivity' ),
	async () => await import( './__fixtures__/interactivity-shim' )
);

/** The router lifecycle state from this suite's isolated module graph. */
let state: ( typeof import('../index') )[ 'state' ];

/** The router actions from this suite's isolated module graph. */
let actions: ( typeof import('../index') )[ 'actions' ];

/** Native timeout used to let fake-timer frame callbacks yield between tasks. */
const nativeSetTimeout = globalThis.setTimeout;

beforeAll( async () => {
	( { state, actions } = await import( '../index' ) );
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

	// The directive runtime can call these APIs while a rendered page settles.
	// Install the stubs after fake timers so Vitest's faked performance object
	// cannot replace them.
	window.performance.measure = vi.fn();
	window.performance.getEntriesByType = vi.fn( () => [] );
} );

afterEach( () => {
	vi.useRealTimers();
} );

/**
 * Settles `afterNextFrame` on either scheduler arm and drains the microtask
 * chains needed by a cached traversal's render cycle.
 *
 * @return A promise that resolves after the frame callbacks and their watcher
 *         flushes have completed.
 */
async function advanceOneFrame() {
	await Promise.resolve();
	for ( let i = 0; i < 2; i++ ) {
		await vi.advanceTimersByTimeAsync( 300 );
		await new Promise( ( resolve ) => nativeSetTimeout( resolve, 0 ) );
	}
}

/**
 * Subscribes a raw signal effect to both lifecycle keys and records only keys
 * whose value is not `undefined` in each notification entry.
 *
 * @return The recorded entries and a disposer for the subscription.
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
 * Builds minimal page HTML that can be prepared and cached without a router
 * region or any lifecycle-affecting side effect.
 *
 * @param marker Text placed in the page body.
 * @return A complete HTML document string.
 */
const plainHtml = ( marker: string ) =>
	`<!doctype html><title>t</title><body>${ marker }</body>`;

/**
 * Moves the document to a destination path using same-document history.
 *
 * @param pathname Destination path, including an optional query string.
 */
function pushStateTo( pathname: string ) {
	window.history.pushState( {}, '', pathname );
}

/** Dispatches the traversal event consumed by the router's popstate handler. */
function dispatchPopstate() {
	window.dispatchEvent( new Event( 'popstate' ) );
}

describe( 'the pristine popstate handler', () => {
	test( 'a cached traversal from pristine idle leaves the absent lifecycle identity unmaterialized at its claim', async () => {
		const destination = 'http://localhost/popstate-pristine-dest';

		// Prefetch only populates the page cache. It must not write either
		// lifecycle key before the traversal is dispatched.
		await actions.prefetch( destination, {
			html: plainHtml( 'pristine-dest' ),
		} );
		expect( state.navigating ).toBeUndefined();
		expect( state.initiator ).toBeUndefined();

		const { raw, dispose } = rawLifecycleLog();
		// This entry certifies that no earlier action in this module graph wrote
		// either key before the traversal's claim.
		expect( raw ).toEqual( [ {} ] );

		pushStateTo( '/popstate-pristine-dest' );
		dispatchPopstate();
		await advanceOneFrame();

		dispose();

		expect( raw ).toEqual( [
			{},
			{ n: true, i: null },
			{ n: false, i: null },
		] );
		expect( {
			navigating: state.navigating,
			initiator: state.initiator,
		} ).toEqual( {
			navigating: false,
			initiator: null,
		} );
	} );
} );
