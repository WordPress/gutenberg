/**
 * The navigation lifecycle (`state.navigating` and `state.initiator`) before
 * the first navigation, and the calls that leave it unset.
 *
 * Vitest loads a fresh router for each test file, and none of these tests
 * changes the lifecycle, so they hold in any order. A test that produces a
 * lifecycle change from this initial state needs a file of its own.
 */

import { beforeAll, expect, test, vi } from 'vitest';
import { privateApis, store, watch } from '@wordpress/interactivity';
import {
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

const { populateServerData } = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);

let state: ( typeof import( '../index' ) )[ 'state' ];
let actions: ( typeof import( '../index' ) )[ 'actions' ];

// Readings of `state.navigating` by a watcher subscribed before the router
// loads.
const runsBeforeLoad: Array< boolean | undefined > = [];

beforeAll( async () => {
	const { state: routerState } = store( 'core/router' ) as {
		state: typeof state;
	};
	const stop = watch( () => {
		runsBeforeLoad.push( routerState.navigating );
	} );
	( { state, actions } = await import( '../index' ) );
	stop();
} );

test( 'the lifecycle keys are undefined, and loading the router does not re-run watchers that read them', () => {
	expect( runsBeforeLoad ).toEqual( [ undefined ] );
	expect( state.navigating ).toBeUndefined();
	expect( state.initiator ).toBeUndefined();
} );

test( 'prefetch() does not change the lifecycle', async () => {
	const { changes, stop } = recordLifecycle();

	await actions.prefetch( 'http://localhost/prefetched', {
		html: pageHtml( 'prefetched' ),
	} );
	stop();

	expect( changes ).toEqual( [] );
	expect( state.navigating ).toBeUndefined();
} );

test( 'a navigation that reloads because client-side navigation is disabled does not change the lifecycle', async () => {
	populateServerData( {
		config: { 'core/router': { clientNavigationDisabled: true } },
	} );
	const { changes, stop } = recordLifecycle();

	void actions.navigate( 'http://localhost/disabled', quiet );
	await nextFrames();
	stop();
	populateServerData();

	expect( changes ).toEqual( [] );
	expect( state.navigating ).toBeUndefined();
	// jsdom reports the attempted full page load.
	expect( console ).toHaveErrored();
} );

test( 'an uncached traversal reloads the page without changing the lifecycle', async () => {
	const { changes, stop } = recordLifecycle();

	traverseTo( '/uncached-initial' );
	await nextFrames();
	stop();

	expect( changes ).toEqual( [] );
	expect( state.navigating ).toBeUndefined();
	expect( state.initiator ).toBeUndefined();
	// jsdom reports the attempted reload.
	expect( console ).toHaveErrored();
} );
