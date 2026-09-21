/**
 * A pre-commit script-module import failure must reject navigation without
 * committing the destination, while the guarded `finally` still schedules the
 * lifecycle's return to idle.
 *
 * This suite keeps the router module in its own Vitest module graph so the
 * source URL and lifecycle state are pristine when the rejection is tested.
 * The router's script-module helper is partially mocked: its real exports
 * remain available, while the import step rejects with one known error.
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { effect } from '@preact/signals';

/** The rejection injected at the router's script-module import step. */
const { importRejection, importScriptModulesMock } = vi.hoisted( () => {
	const rejection = new Error( 'script-module import failed' );
	const scriptModulesMock = vi.fn( () => Promise.reject( rejection ) );
	return {
		importRejection: rejection,
		importScriptModulesMock: scriptModulesMock,
	};
} );

vi.mock(
	import( '@wordpress/interactivity' ),
	async () => await import( './__fixtures__/interactivity-shim' )
);
vi.mock( import( '../assets/script-modules' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	importScriptModules: importScriptModulesMock,
} ) );

/** Native timer retained so frame callbacks can yield between fake-timer tasks. */
const nativeSetTimeout = globalThis.setTimeout;

beforeEach( () => {
	vi.useFakeTimers( { shouldAdvanceTime: true } );
	// The router's module scope reaches `onDOMReady()`, and the real directive
	// runtime may inspect performance while the page is prepared.
	window.performance.getEntriesByType = vi.fn( () => [] );
	window.performance.measure = vi.fn();
} );

afterEach( () => {
	vi.useRealTimers();
} );

/**
 * Settles the router's `afterNextFrame()` callback and its signal effects.
 *
 * @return A promise that resolves after the scheduled end write has run.
 */
async function advanceOneFrame() {
	await vi.advanceTimersByTimeAsync( 100 );
	// Keep the native task boundary explicit when the scheduler's callback
	// funnels through a zero-delay timeout.
	await new Promise( ( resolve ) => nativeSetTimeout( resolve, 0 ) );
}

/**
 * Builds page HTML with no script modules and a unique destination marker.
 *
 * @param marker Text placed in the destination body.
 * @return A complete HTML document string.
 */
const plainHtml = ( marker: string ) =>
	`<!doctype html><title>t</title><body>${ marker }</body>`;

describe( 'navigate() script-module import rejection', () => {
	test( 'rejects before commit, preserves the source URL and schedules the end transition', async () => {
		const { state, actions } = await import( '../index' );
		const sourceUrl = state.url;
		const destination = 'http://localhost/import-rejection-destination';
		const destinationMarker = 'import-rejection-destination-marker';
		const lifecycleReadings: Array< boolean | undefined > = [];
		const dispose = effect( () => {
			lifecycleReadings.push( state.navigating );
		} );

		try {
			let caught: unknown;
			try {
				await actions.navigate( destination, {
					html: plainHtml( destinationMarker ),
					loadingAnimation: false,
					screenReaderAnnouncement: false,
				} );
			} catch ( error ) {
				caught = error;
			}

			expect( caught ).toBe( importRejection );
			expect( importScriptModulesMock ).toHaveBeenCalledTimes( 1 );
			expect( importScriptModulesMock ).toHaveBeenCalledWith( [] );

			// The rejection occurs after the claim/start batch but before the
			// finally's frame-scheduled end callback can run.
			expect( state.navigating ).toBe( true );
			expect( state.url ).toBe( sourceUrl );
			expect( document.body ).not.toHaveTextContent( destinationMarker );
			expect( lifecycleReadings.slice( 1 ) ).toEqual( [ true ] );

			await advanceOneFrame();

			expect( state.navigating ).toBe( false );
			expect( state.url ).toBe( sourceUrl );
			expect( document.body ).not.toHaveTextContent( destinationMarker );
			expect( lifecycleReadings.slice( 1 ) ).toEqual( [ true, false ] );
		} finally {
			dispose();
		}
	} );
} );
