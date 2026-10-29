/**
 * The navigation lifecycle (`state.navigating` and `state.initiator`) as
 * produced by back and forward traversals.
 *
 * The router registers global listeners when it loads, so it is imported once
 * and every test in this file shares its `core/router` store. Tests run in
 * random order, so none can assume no navigation has happened yet; those
 * live in `lifecycle-initial.jsdom.test.ts` and
 * `lifecycle-first-traversal.jsdom.test.ts`.
 */

import { beforeAll, describe, expect, test, vi } from 'vitest';
import { watch } from '@wordpress/interactivity';
import {
	mockFetch,
	mockFetchNotFound,
	nextFrames,
	pageHtml,
	quiet,
	recordLifecycle,
	traverseTo,
} from './fixtures/helpers';

// Fills the jsdom gaps before `@wordpress/interactivity` evaluates.
await vi.hoisted( async () => {
	await import( './fixtures/jsdom-setup' );
} );

let state: ( typeof import( '../index' ) )[ 'state' ];
let actions: ( typeof import( '../index' ) )[ 'actions' ];

// The router's `popstate` listener, called directly by the tests that need
// to observe its returned promise rejecting.
let popstateListener: () => Promise< void >;

beforeAll( async () => {
	const addEventListener = window.addEventListener;
	vi.spyOn( window, 'addEventListener' ).mockImplementation(
		( type: string, listener: any, options?: any ) => {
			if ( type === 'popstate' ) {
				popstateListener = listener;
			}
			addEventListener.call( window, type, listener, options );
		}
	);
	( { state, actions } = await import( '../index' ) );
	vi.mocked( window.addEventListener ).mockRestore();
} );

/**
 * Moves to `path` and calls the router's `popstate` listener directly.
 *
 * @param path The destination path.
 * @return Whether the listener resolved or rejected, and with what error.
 */
async function callPopstateListener( path: string ) {
	window.history.pushState( {}, '', path );
	try {
		await popstateListener();
		return { error: undefined };
	} catch ( error ) {
		return { error };
	}
}

/**
 * Subscribes a watcher to the lifecycle keys that throws from the moment
 * `shouldThrow` is set.
 *
 * @param message The error message.
 * @return Functions to start throwing and to stop the watcher.
 */
function throwingWatcher( message: string ) {
	let shouldThrow = false;
	const stop = watch( () => {
		void state.navigating;
		void state.initiator;
		if ( shouldThrow ) {
			throw new Error( message );
		}
	} );
	shouldThrow = true;
	return () => {
		shouldThrow = false;
		stop();
	};
}

describe( 'popstate', () => {
	test( 'a cached traversal clears the initiator of the previous navigation before its page is ready', async () => {
		await actions.navigate( 'http://localhost/previous', {
			...quiet,
			initiator: 'region-x',
			html: pageHtml( 'previous' ),
		} );
		await nextFrames();
		const requests = mockFetch();
		const page = actions.prefetch( 'http://localhost/cached-pending' );
		const { changes, stop } = recordLifecycle();

		traverseTo( '/cached-pending' );

		expect( changes ).toEqual( [ { navigating: false, initiator: null } ] );

		requests[ 0 ].respond( pageHtml( 'cached-pending' ) );
		await page;
		await nextFrames();
		stop();

		expect( changes ).toEqual( [
			{ navigating: false, initiator: null },
			{ navigating: true, initiator: null },
			{ navigating: false, initiator: null },
		] );
	} );

	test( 'a cached traversal that supersedes a navigation stays in flight until its own page is rendered', async () => {
		const requests = mockFetch();
		const navigation = actions.navigate( 'http://localhost/superseded', {
			...quiet,
			initiator: 'region-x',
		} );
		const page = actions.prefetch( 'http://localhost/superseding' );

		traverseTo( '/superseding' );

		expect( state.navigating ).toBe( true );
		expect( state.initiator ).toBeNull();

		requests[ 0 ].respond( pageHtml( 'superseded' ) );
		await navigation;
		await nextFrames();

		expect( state.navigating ).toBe( true );

		requests[ 1 ].respond( pageHtml( 'superseding' ) );
		await page;
		await nextFrames();

		expect( state.navigating ).toBe( false );
		expect( state.initiator ).toBeNull();
	} );

	test( 'an uncached traversal that supersedes a navigation ends it and clears its initiator', async () => {
		mockFetch();
		void actions.navigate( 'http://localhost/in-flight', {
			...quiet,
			initiator: 'region-x',
		} );
		const { changes, stop } = recordLifecycle();

		traverseTo( '/uncached-superseding' );
		await nextFrames();
		stop();

		expect( changes ).toEqual( [ { navigating: false, initiator: null } ] );
		expect( console ).toHaveErrored();
	} );

	test( 'an uncached traversal clears the initiator of the previous navigation', async () => {
		await actions.navigate( 'http://localhost/before-uncached', {
			...quiet,
			initiator: 'region-x',
			html: pageHtml( 'before-uncached' ),
		} );
		await nextFrames();
		const { changes, stop } = recordLifecycle();

		traverseTo( '/uncached' );
		await nextFrames();
		stop();

		expect( changes ).toEqual( [ { navigating: false, initiator: null } ] );
		expect( console ).toHaveErrored();
	} );

	test( 'a cached page that resolves to nothing reloads, clearing the initiator of the previous navigation', async () => {
		await actions.navigate( 'http://localhost/before-empty', {
			...quiet,
			initiator: 'region-x',
			html: pageHtml( 'before-empty' ),
		} );
		await nextFrames();
		mockFetchNotFound();
		await actions.prefetch( 'http://localhost/empty' );
		const { changes, stop } = recordLifecycle();

		traverseTo( '/empty' );
		await nextFrames();
		stop();

		expect( changes ).toEqual( [ { navigating: false, initiator: null } ] );
		expect( console ).toHaveErrored();
	} );

	test( 'a cached page that resolves to nothing reloads without changing an idle lifecycle', async () => {
		mockFetchNotFound();
		await actions.prefetch( 'http://localhost/empty-from-idle' );
		const { changes, stop } = recordLifecycle();

		traverseTo( '/empty-from-idle' );
		await nextFrames();
		stop();

		expect( changes ).toEqual( [] );
		expect( console ).toHaveErrored();
	} );

	test.each( [
		[ 'an uncached traversal', 'uncached', false ],
		[
			'a traversal to a cached page that resolves to nothing',
			'empty',
			true,
		],
	] )(
		'%s reloads before running watchers, which may throw',
		async ( _, slug, isCached ) => {
			mockFetch();
			void actions.navigate(
				`http://localhost/in-flight-${ slug }`,
				quiet
			);
			if ( isCached ) {
				mockFetchNotFound();
				await actions.prefetch( `http://localhost/throw-${ slug }` );
			}
			const stopThrowing = throwingWatcher( 'Watcher error' );

			const { error } = await callPopstateListener( `/throw-${ slug }` );
			stopThrowing();

			// jsdom reports the reload, which ran before the watcher threw.
			expect( console ).toHaveErrored();
			expect( error ).toEqual( new Error( 'Watcher error' ) );
		}
	);

	test( 'still ends, and rethrows, when a watcher throws during a cached traversal', async () => {
		await actions.prefetch( 'http://localhost/watcher-throws', {
			html: pageHtml( 'watcher-throws' ),
		} );
		const stop = watch( () => {
			if ( state.navigating ) {
				throw new Error( 'Watcher error' );
			}
		} );

		const { error } = await callPopstateListener( '/watcher-throws' );
		await nextFrames();
		stop();

		expect( error ).toEqual( new Error( 'Watcher error' ) );
		expect( state.navigating ).toBe( false );
	} );

	test( 'a traversal whose page never resolves is released after 10 seconds, and a later resolution produces a new cycle', async () => {
		vi.useFakeTimers( { shouldAdvanceTime: true } );
		const requests = mockFetch();
		void actions.navigate( 'http://localhost/never-resolves', {
			...quiet,
			timeout: 60_000,
		} );
		void actions.prefetch( 'http://localhost/resolves-late' );
		const { changes, stop } = recordLifecycle();

		traverseTo( '/resolves-late' );
		await vi.advanceTimersByTimeAsync( 9_000 );

		expect( state.navigating ).toBe( true );

		await vi.advanceTimersByTimeAsync( 1_100 );

		expect( state.navigating ).toBe( false );

		requests[ 1 ].respond( pageHtml( 'resolves-late' ) );
		await vi.advanceTimersByTimeAsync( 100 );
		stop();

		expect( changes ).toEqual( [
			{ navigating: false, initiator: null },
			{ navigating: true, initiator: null },
			{ navigating: false, initiator: null },
		] );
	} );

	test( 'releasing a traversal does not end a newer navigation', async () => {
		vi.useFakeTimers( { shouldAdvanceTime: true } );
		await actions.prefetch( 'http://localhost/released', {
			html: pageHtml( 'released' ),
		} );
		traverseTo( '/released' );
		await vi.advanceTimersByTimeAsync( 100 );
		const requests = mockFetch();
		const newer = actions.navigate( 'http://localhost/newer', {
			...quiet,
			timeout: 60_000,
		} );

		await vi.advanceTimersByTimeAsync( 10_100 );

		expect( state.navigating ).toBe( true );

		requests[ 0 ].respond( pageHtml( 'newer' ) );
		await newer;
		await vi.advanceTimersByTimeAsync( 100 );

		expect( state.navigating ).toBe( false );
	} );
} );
