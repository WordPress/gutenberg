/**
 * The navigation lifecycle (`state.navigating` and `state.initiator`) as
 * produced by `actions.navigate()`.
 *
 * The router registers global listeners when it loads, so it is imported once
 * and every test in this file shares its `core/router` store. The tests in the
 * first `describe` block rely on no navigation having happened yet, so they
 * must stay first.
 */

import { beforeAll, describe, expect, test, vi } from 'vitest';
import { privateApis, store, watch } from '@wordpress/interactivity';
import { importScriptModules } from '../assets/script-modules';
import {
	hydrateHtml,
	hydrateNavigatingWatcher,
	mockFetch,
	mockFetchNotFound,
	nextFrames,
	pageHtml,
	quiet,
	recordLifecycle,
} from './fixtures/helpers';

// Fills the jsdom gaps before `@wordpress/interactivity` evaluates.
await vi.hoisted( async () => {
	await import( './fixtures/jsdom-setup' );
} );

vi.mock( import( '../assets/script-modules' ), async ( importOriginal ) => {
	const original = await importOriginal();
	return {
		...original,
		importScriptModules: vi.fn( original.importScriptModules ),
	};
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

describe( 'before the first navigation', () => {
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
} );

describe( 'navigate()', () => {
	test( 'publishes `navigating` and `initiator` together, and ends a frame after the navigation resolves', async () => {
		const { changes, stop } = recordLifecycle();

		await actions.navigate( 'http://localhost/start-and-end', {
			...quiet,
			initiator: 'region-x',
			html: pageHtml( 'start-and-end' ),
		} );

		expect( changes ).toEqual( [
			{ navigating: true, initiator: 'region-x' },
		] );

		await nextFrames();
		stop();

		expect( changes ).toEqual( [
			{ navigating: true, initiator: 'region-x' },
			{ navigating: false, initiator: 'region-x' },
		] );
	} );

	test( 'ends after the new page and URL are committed', async () => {
		store( 'test/commit', {} );
		hydrateHtml(
			'<div data-wp-interactive="test/commit" data-wp-router-region="commit"><span data-testid="commit">origin</span></div>'
		);
		const href = 'http://localhost/commit';
		let atEnd: { url: string; text: string | null } | undefined;
		const stop = watch( () => {
			if ( state.navigating === false && ! atEnd ) {
				atEnd = {
					url: state.url,
					text: document.querySelector( '[data-testid="commit"]' )!
						.textContent,
				};
			}
		} );
		atEnd = undefined;

		await actions.navigate( href, {
			...quiet,
			html: pageHtml(
				'<div data-wp-interactive="test/commit" data-wp-router-region="commit"><span data-testid="commit">destination</span></div>'
			),
		} );
		await nextFrames();
		stop();

		expect( atEnd ).toEqual( { url: href, text: 'destination' } );
	} );

	test( 'a `data-wp-watch` directive observes the start and the end as separate runs, even for a cached page', async () => {
		const runs = hydrateNavigatingWatcher();
		await nextFrames();
		const initialRuns = runs.length;

		await actions.navigate( 'http://localhost/directive', {
			...quiet,
			html: pageHtml( 'directive' ),
		} );
		await nextFrames();

		expect( runs.slice( initialRuns ) ).toEqual( [ true, false ] );
	} );

	test( 'produces a full cycle for every navigation, including a forced navigation to the current URL', async () => {
		const navigations = [
			[ 'http://localhost/cycle-1', {} ],
			[ 'http://localhost/cycle-2', {} ],
			[ 'http://localhost/cycle-2', { force: true } ],
		] as const;

		for ( const [ href, options ] of navigations ) {
			const { changes, stop } = recordLifecycle();
			await actions.navigate( href, {
				...quiet,
				...options,
				html: pageHtml( href ),
			} );
			await nextFrames();
			stop();

			expect( changes ).toEqual( [
				{ navigating: true, initiator: null },
				{ navigating: false, initiator: null },
			] );
		}
	} );

	test( 'does not delay the promise it returns until the end', async () => {
		await actions.navigate( 'http://localhost/promise', {
			...quiet,
			html: pageHtml( 'promise' ),
		} );

		expect( state.navigating ).toBe( true );

		await nextFrames();

		expect( state.navigating ).toBe( false );
	} );

	test( 'still ends when the navigation throws after the new page is committed', async () => {
		const { changes, stop } = recordLifecycle();

		// An id that starts with a digit is an invalid selector, so scrolling
		// to the hash throws.
		await expect(
			actions.navigate( 'http://localhost/hash#2024-report', {
				...quiet,
				html: pageHtml( 'hash' ),
			} )
		).rejects.toMatchObject( { name: 'SyntaxError' } );
		await nextFrames();
		stop();

		expect( changes ).toEqual( [
			{ navigating: true, initiator: null },
			{ navigating: false, initiator: null },
		] );
	} );

	test( 'still ends, without committing the page, when importing its script modules fails', async () => {
		const error = new Error( 'Script module import failed' );
		vi.mocked( importScriptModules ).mockRejectedValueOnce( error );
		const url = state.url;
		const { changes, stop } = recordLifecycle();

		await expect(
			actions.navigate( 'http://localhost/import-failure', {
				...quiet,
				html: pageHtml( 'import-failure' ),
			} )
		).rejects.toBe( error );
		await nextFrames();
		stop();

		expect( state.url ).toBe( url );
		expect( document.body ).not.toHaveTextContent( 'import-failure' );
		expect( changes ).toEqual( [
			{ navigating: true, initiator: null },
			{ navigating: false, initiator: null },
		] );
	} );

	test( 'stays in flight while a superseded navigation finishes, and ends with the newest one', async () => {
		const requests = mockFetch();
		const { changes, stop } = recordLifecycle();

		const first = actions.navigate( 'http://localhost/first', {
			...quiet,
			initiator: 'first',
		} );
		const second = actions.navigate( 'http://localhost/second', {
			...quiet,
			initiator: 'second',
		} );

		requests[ 0 ].respond( pageHtml( 'first' ) );
		await first;
		await nextFrames();

		expect( state.navigating ).toBe( true );
		expect( state.initiator ).toBe( 'second' );

		requests[ 1 ].respond( pageHtml( 'second' ) );
		await second;
		await nextFrames();
		stop();

		expect( changes ).toEqual( [
			{ navigating: true, initiator: 'first' },
			{ navigating: true, initiator: 'second' },
			{ navigating: false, initiator: 'second' },
		] );
	} );

	test( 'overlapping forced navigations to the same URL produce a single cycle', async () => {
		const requests = mockFetch();
		const { changes, stop } = recordLifecycle();
		const href = 'http://localhost/same-url';

		const first = actions.navigate( href, { ...quiet, force: true } );
		const second = actions.navigate( href, { ...quiet, force: true } );
		requests[ 0 ].respond( pageHtml( 'first' ) );
		await nextFrames();

		expect( state.navigating ).toBe( true );

		requests[ 1 ].respond( pageHtml( 'second' ) );
		await Promise.all( [ first, second ] );
		await nextFrames();
		stop();

		expect( changes ).toEqual( [
			{ navigating: true, initiator: null },
			{ navigating: false, initiator: null },
		] );
	} );

	test( 'the end scheduled by a finished navigation does not end a newer one started in the same frame', async () => {
		const { changes, stop } = recordLifecycle();

		await actions.navigate( 'http://localhost/finished', {
			...quiet,
			html: pageHtml( 'finished' ),
		} );
		const requests = mockFetch();
		const newer = actions.navigate( 'http://localhost/newer', quiet );
		await nextFrames();

		expect( state.navigating ).toBe( true );

		requests[ 0 ].respond( pageHtml( 'newer' ) );
		await newer;
		await nextFrames();
		stop();

		expect( changes ).toEqual( [
			{ navigating: true, initiator: null },
			{ navigating: false, initiator: null },
		] );
	} );

	test( 'a navigation that falls back to a full page load stays in flight until the reload, or until 10 seconds pass', async () => {
		vi.useFakeTimers( { shouldAdvanceTime: true } );
		mockFetchNotFound();
		const { changes, stop } = recordLifecycle();

		void actions.navigate( 'http://localhost/fallback', {
			...quiet,
			initiator: 'fallback',
		} );
		await vi.advanceTimersByTimeAsync( 9_000 );

		expect( state.navigating ).toBe( true );
		expect( console ).toHaveErrored();

		await vi.advanceTimersByTimeAsync( 1_100 );
		stop();

		expect( changes ).toEqual( [
			{ navigating: true, initiator: 'fallback' },
			{ navigating: false, initiator: 'fallback' },
		] );
	} );

	test( 'releasing a fallback navigation does not end a newer navigation', async () => {
		vi.useFakeTimers( { shouldAdvanceTime: true } );
		mockFetchNotFound();
		void actions.navigate( 'http://localhost/stale-fallback', quiet );
		await vi.advanceTimersByTimeAsync( 0 );

		const requests = mockFetch();
		const newer = actions.navigate(
			'http://localhost/newer-than-fallback',
			{
				...quiet,
				initiator: 'newer',
				timeout: 60_000,
			}
		);
		await vi.advanceTimersByTimeAsync( 10_100 );

		expect( state.navigating ).toBe( true );
		expect( state.initiator ).toBe( 'newer' );
		expect( console ).toHaveErrored();

		requests[ 0 ].respond( pageHtml( 'newer' ) );
		await newer;
		await vi.advanceTimersByTimeAsync( 100 );

		expect( state.navigating ).toBe( false );
	} );

	test( 'the deprecated `state.navigation` keeps working and is not read by the router', async () => {
		await actions.navigate( 'http://localhost/deprecated', {
			loadingAnimation: true,
			screenReaderAnnouncement: false,
			html: pageHtml( 'deprecated' ),
		} );
		await nextFrames();

		expect( console ).not.toHaveWarned();
		expect( state.navigation ).toEqual( {
			hasStarted: false,
			hasFinished: true,
		} );
		expect( console ).toHaveWarnedWith(
			'The usage of state.navigation.{hasStarted|hasFinished} from core/router is deprecated and will stop working in WordPress 7.1.'
		);
	} );
} );
