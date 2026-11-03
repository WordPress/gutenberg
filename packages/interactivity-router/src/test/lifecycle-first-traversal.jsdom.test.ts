/**
 * The navigation lifecycle (`state.navigating` and `state.initiator`) as
 * produced by a back or forward traversal that is the first navigation.
 *
 * Vitest loads a fresh router for each test file, so this file's only test
 * starts from the lifecycle's initial state.
 */

import { beforeAll, expect, test, vi } from 'vitest';
import {
	hydrateNavigatingWatcher,
	nextFrames,
	pageHtml,
	recordLifecycle,
	traverseTo,
} from './fixtures/helpers';

// Fills the jsdom gaps before `@wordpress/interactivity` evaluates.
await vi.hoisted( async () => {
	await import( './fixtures/jsdom-setup' );
} );

let state: ( typeof import( '../index' ) )[ 'state' ];
let actions: ( typeof import( '../index' ) )[ 'actions' ];

beforeAll( async () => {
	( { state, actions } = await import( '../index' ) );
} );

test( 'a cached traversal produces a full cycle with no initiator, observable by a `data-wp-watch` directive', async () => {
	await actions.prefetch( 'http://localhost/cached-initial', {
		html: pageHtml( 'cached-initial' ),
	} );
	const runs = hydrateNavigatingWatcher();
	await nextFrames();
	const { changes, stop } = recordLifecycle();

	traverseTo( '/cached-initial' );
	await nextFrames();
	stop();

	expect( changes ).toEqual( [
		{ navigating: true, initiator: null },
		{ navigating: false, initiator: null },
	] );
	expect( runs ).toEqual( [ undefined, true, false ] );
	expect( state.url ).toBe( 'http://localhost/cached-initial' );
} );
