/**
 * Overlapping navigations: only the most recently started navigation renders
 * its page, writes `state.url`, changes the session history or replaces the
 * document. A superseded navigation never touches the loading feedback: the
 * next navigation that renders its page closes the feedback left open,
 * whatever its options. A superseded `actions.navigate()` call's promise
 * resolves.
 *
 * The router registers global listeners when it loads, so it is imported once
 * and every test in this file shares its `core/router` store and the session
 * history. Each test hydrates a router region of its own and starts with
 * navigations of its own, which make its pages the last history entries.
 */

import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { speak } from '@wordpress/a11y';
import { store, watch } from '@wordpress/interactivity';
import { importScriptModules } from '../assets/script-modules';
import {
	hydrateHtml,
	mockFetch,
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

vi.mock( import( '@wordpress/a11y' ), () => ( { speak: vi.fn() } ) );

let state: ( typeof import( '../index' ) )[ 'state' ];
let actions: ( typeof import( '../index' ) )[ 'actions' ];

// Core's loading bar, as WordPress prints it.
let loadingBar: Element;

beforeAll( async () => {
	// The router's translated messages, as WordPress prints them.
	document.body.insertAdjacentHTML(
		'beforeend',
		`<script type="application/json" id="wp-script-module-data-@wordpress/interactivity-router">${ JSON.stringify(
			{
				i18n: {
					loading: 'Loading page, please wait.',
					loaded: 'Page Loaded.',
				},
			}
		) }</script>`
	);
	( { state, actions } = await import( '../index' ) );
	loadingBar = hydrateHtml(
		'<div class="wp-interactivity-router-loading-bar" data-wp-interactive="core/router/private" data-wp-class--start-animation="state.navigation.hasStarted" data-wp-class--finish-animation="state.navigation.hasFinished"></div>'
	);
} );

/**
 * Reads the animation classes of Core's loading bar.
 *
 * @return The classes, in a fixed order.
 */
const loadingBarClasses = () =>
	[ 'start-animation', 'finish-animation' ].filter( ( name ) =>
		loadingBar.classList.contains( name )
	);

store( 'test/overlapping', {} );

let testCount = 0;
// The current test's region id, also the first segment of its page paths.
let id: string;

beforeEach( () => {
	id = `overlapping-${ ++testCount }`;
} );

/**
 * Builds the URL of one of the current test's pages.
 *
 * @param name The page name.
 * @return The absolute URL.
 */
const url = ( name: string ) => `http://localhost/${ id }/${ name }`;

/**
 * Builds the markup of the current test's router region.
 *
 * @param name The page name the region shows, or nothing for an empty region.
 * @return The region markup.
 */
const region = ( name = '' ) =>
	`<div data-wp-interactive="test/overlapping" data-wp-router-region="${ id }"><p data-testid="${ id }">${ name }</p></div>`;

/**
 * Builds one of the current test's pages.
 *
 * @param name The page name, shown in the page's region.
 * @return The HTML document.
 */
const page = ( name: string ) => pageHtml( region( name ) );

/**
 * Reads the name of the page the current test's region shows.
 *
 * @return The region text.
 */
const content = () =>
	document.querySelector( `[data-testid="${ id }"]` )?.textContent;

/**
 * Hydrates the current test's region and navigates to each of the given
 * pages, which become the last history entries and stay cached for back and
 * forward traversals.
 *
 * @param names The pages to navigate to, in order.
 * @return The session history length after the last navigation.
 */
async function start( names = [ 'start' ] ) {
	hydrateHtml( region() );
	for ( const name of names ) {
		await actions.navigate( url( name ), { ...quiet, html: page( name ) } );
	}
	await nextFrames();
	return window.history.length;
}

/**
 * Makes the next script-module import wait until the test finishes it.
 *
 * @return A promise of the import's start, and a function to finish it.
 */
function holdImport() {
	let finish: () => void;
	const started = new Promise< void >( ( resolve ) => {
		vi.mocked( importScriptModules ).mockImplementationOnce( () => {
			resolve();
			return new Promise( ( resolveImport ) => {
				finish = () => resolveImport( [] );
			} );
		} );
	} );
	return { started, finish: () => finish() };
}

/**
 * Records whether a navigation's promise has resolved.
 *
 * @param navigation The promise returned by `actions.navigate()`.
 * @return An object whose `resolved` property turns `true` when it resolves.
 */
function track( navigation: Promise< void > ) {
	const call = { resolved: false };
	void navigation.then( () => {
		call.resolved = true;
	} );
	return call;
}

/**
 * Waits for the given time.
 *
 * @param ms The time, in milliseconds.
 */
const sleep = ( ms: number ) =>
	new Promise( ( resolve ) => setTimeout( resolve, ms ) );

/**
 * Presses Back and waits until the traversal to the given page has ended.
 *
 * @param name The page Back leads to.
 */
async function back( name: string ) {
	window.history.back();
	await vi.waitFor( () => expect( content() ).toBe( name ) );
	await nextFrames();
}

/**
 * Builds a page whose configuration disables client-side navigation.
 *
 * @param name The page name.
 * @return The HTML document.
 */
const disabledPage = ( name: string ) =>
	pageHtml(
		region( name ) +
			`<script type="application/json" id="wp-script-module-data-@wordpress/interactivity">${ JSON.stringify(
				{
					config: {
						'core/router': { clientNavigationDisabled: true },
					},
				}
			) }</script>`
	);

describe( 'a navigation superseded by another `navigate()` call', () => {
	/**
	 * Starts a navigation to page X, holds its script-module import, and then
	 * starts a navigation to page Y.
	 *
	 * @param options Additional options of the navigation to page X.
	 * @return Both navigations, and functions to finish X's import and to
	 *         deliver Y's page.
	 */
	async function supersedeWhileImporting( options = {} ) {
		const requests = mockFetch();
		const importX = holdImport();
		const x = actions.navigate( url( 'x' ), {
			...quiet,
			...options,
			initiator: 'x',
		} );
		requests[ 0 ].respond( page( 'x' ) );
		await importX.started;
		const y = actions.navigate( url( 'y' ), { ...quiet, initiator: 'y' } );
		return {
			x,
			y,
			finishImportX: importX.finish,
			respondY: () => requests[ 1 ].respond( page( 'y' ) ),
		};
	}

	test.each( [
		[ 'without options', {} ],
		[ 'called with `replace: true`', { replace: true } ],
	] )(
		'never renders when its script modules finish importing after the newer one ends, %s',
		async ( _, options ) => {
			const historyLength = await start();
			const { changes, stop } = recordLifecycle();
			const { x, y, finishImportX, respondY } =
				await supersedeWhileImporting( options );

			respondY();
			await y;
			await nextFrames();
			finishImportX();
			await x;
			await nextFrames();
			stop();

			expect( content() ).toBe( 'y' );
			expect( state.url ).toBe( url( 'y' ) );
			expect( window.location.href ).toBe( url( 'y' ) );
			expect( window.history.length ).toBe( historyLength + 1 );
			expect( changes ).toEqual( [
				{ navigating: true, initiator: 'x' },
				{ navigating: true, initiator: 'y' },
				{ navigating: false, initiator: 'y' },
			] );
		}
	);

	test( 'never renders when its script modules finish importing before the newer one renders', async () => {
		const historyLength = await start();
		const { x, y, finishImportX, respondY } =
			await supersedeWhileImporting();

		finishImportX();
		await x;
		await nextFrames();

		expect( content() ).toBe( 'start' );
		expect( state.url ).toBe( url( 'start' ) );
		expect( window.location.href ).toBe( url( 'start' ) );
		expect( window.history.length ).toBe( historyLength );
		expect( state.navigating ).toBe( true );
		expect( state.initiator ).toBe( 'y' );

		respondY();
		await y;
		await nextFrames();

		expect( content() ).toBe( 'y' );
		expect( window.location.href ).toBe( url( 'y' ) );
		expect( window.history.length ).toBe( historyLength + 1 );
	} );
} );

describe( 'a navigation superseded by a `navigate()` call to the same URL', () => {
	/**
	 * Refreshes the current page, as the documented forced navigation does.
	 *
	 * @return The `navigate()` promise.
	 */
	const refresh = () =>
		actions.navigate( window.location.href, { ...quiet, force: true } );

	test.each( [
		[ 'arrives', 200 ],
		[ 'is not accepted', 503 ],
	] )(
		'never renders nor reloads when, for forced calls, its response %s after the newer one ends',
		async ( _, status ) => {
			const historyLength = await start();
			const requests = mockFetch();

			const first = track( refresh() );
			const second = refresh();
			requests[ 1 ].respond( page( 'second' ) );
			await second;
			await nextFrames();
			requests[ 0 ].respond( page( 'first' ), status );
			await vi.waitFor( () => expect( first.resolved ).toBe( true ) );
			await nextFrames();

			expect( content() ).toBe( 'second' );
			expect( window.location.href ).toBe( url( 'start' ) );
			expect( window.history.length ).toBe( historyLength + 1 );
			expect( state.navigating ).toBe( false );
		}
	);

	test( 'never renders, for forced calls, when its page arrives first', async () => {
		const historyLength = await start();
		const requests = mockFetch();

		const first = refresh();
		const second = refresh();
		requests[ 0 ].respond( page( 'first' ) );
		await first;
		await nextFrames();

		expect( content() ).toBe( 'start' );

		requests[ 1 ].respond( page( 'second' ) );
		await second;
		await nextFrames();

		expect( content() ).toBe( 'second' );
		expect( window.history.length ).toBe( historyLength + 1 );
	} );

	test( 'adds a single history entry when it is a second click on a link whose page is still loading', async () => {
		const historyLength = await start();
		const requests = mockFetch();

		const first = actions.navigate( url( 'link' ), quiet );
		const second = actions.navigate( url( 'link' ), quiet );
		requests[ 0 ].respond( page( 'link' ) );
		await Promise.all( [ first, second ] );
		await nextFrames();

		expect( content() ).toBe( 'link' );
		expect( window.location.href ).toBe( url( 'link' ) );
		expect( window.history.length ).toBe( historyLength + 1 );
	} );
} );

describe( 'a navigation superseded by a back/forward traversal', () => {
	test.each( [
		[ 'fetching its page', false ],
		[ 'importing its script modules', true ],
	] )(
		'loses to a Back press made while it is %s',
		async ( _, isImporting ) => {
			await start( [ 'a', 'b' ] );
			const requests = mockFetch();
			const importS = isImporting ? holdImport() : undefined;

			const s = actions.navigate( url( 's' ), {
				...quiet,
				initiator: 's',
			} );
			if ( importS ) {
				requests[ 0 ].respond( page( 's' ) );
				await importS.started;
			}

			await back( 'a' );
			if ( importS ) {
				importS.finish();
			} else {
				requests[ 0 ].respond( page( 's' ) );
			}
			await s;
			await nextFrames();

			expect( content() ).toBe( 'a' );
			expect( state.url ).toBe( url( 'a' ) );
			expect( window.location.href ).toBe( url( 'a' ) );
			expect( state.navigating ).toBe( false );
			expect( state.initiator ).toBeNull();

			window.history.forward();
			await vi.waitFor( () => expect( content() ).toBe( 'b' ) );
			await nextFrames();

			expect( window.location.href ).toBe( url( 'b' ) );
		}
	);

	// A full page load would make jsdom report an unexpected console error.
	test.each( [
		[
			'its response is not accepted',
			{},
			( respond: ( html: string, status?: number ) => void ) =>
				respond( page( 's' ), 503 ),
		],
		[
			'its page disables client-side navigation',
			{},
			( respond: ( html: string, status?: number ) => void ) =>
				respond( disabledPage( 's' ) ),
		],
		[ 'its timeout elapses', { timeout: 500 }, () => {} ],
	] )(
		'does not fall back to a full page load, and resolves, when %s after a Back press',
		async ( _, options, settle ) => {
			await start( [ 'a', 'b' ] );
			const requests = mockFetch();

			const s = track(
				actions.navigate( url( 's' ), { ...quiet, ...options } )
			);
			await back( 'a' );
			settle( requests[ 0 ].respond );
			await vi.waitFor( () => expect( s.resolved ).toBe( true ) );
			await nextFrames();

			expect( content() ).toBe( 'a' );
			expect( state.url ).toBe( url( 'a' ) );
			expect( window.location.href ).toBe( url( 'a' ) );
			expect( state.navigating ).toBe( false );
			expect( state.initiator ).toBeNull();
		}
	);
} );

describe( 'a back/forward traversal superseded while its cached page is loading', () => {
	/**
	 * Navigates to page Y.
	 *
	 * @return The `navigate()` promise.
	 */
	const navigateToY = () =>
		actions.navigate( url( 'y' ), {
			...quiet,
			initiator: 'y',
			html: page( 'y' ),
		} );

	/**
	 * Presses Forward and waits until page B renders.
	 */
	async function forwardToB() {
		window.history.forward();
		await vi.waitFor( () => expect( content() ).toBe( 'b' ) );
	}

	// A full page load would make jsdom report an unexpected console error.
	test.each( [
		[ 'arrives after a newer navigation ends', navigateToY, 'y', 'y', 200 ],
		[ 'arrives after a Forward press ends', forwardToB, 'b', null, 200 ],
		[ 'fails after a newer navigation ends', navigateToY, 'y', 'y', 503 ],
	] )(
		'neither renders nor reloads when its page %s',
		async ( _, overtake, winner, initiator, status ) => {
			await start( [ 'a', 'b' ] );
			const requests = mockFetch();
			const pendingA = actions.prefetch( url( 'a' ), { force: true } );

			window.history.back();
			await vi.waitFor( () =>
				expect( window.location.href ).toBe( url( 'a' ) )
			);
			await overtake();
			await nextFrames();

			requests[ 0 ].respond( page( 'a' ), status );
			await pendingA;
			await nextFrames();

			expect( content() ).toBe( winner );
			expect( state.url ).toBe( url( winner ) );
			expect( window.location.href ).toBe( url( winner ) );
			expect( state.navigating ).toBe( false );
			expect( state.initiator ).toBe( initiator );
		}
	);
} );

describe( 'a navigation started when an older one publishes its start', () => {
	test( 'supersedes a back/forward traversal, which never renders', async () => {
		await start( [ 'a', 'b' ] );
		const urls: string[] = [];
		let newer: Promise< void > | undefined;
		const stopRecording = watch( () => {
			urls.push( state.url );
		} );
		const stop = watch( () => {
			if ( state.navigating && ! newer ) {
				newer = actions.navigate( url( 'y' ), {
					...quiet,
					html: page( 'y' ),
				} );
			}
		} );

		window.history.back();
		await vi.waitFor( () => expect( newer ).toBeDefined() );
		await newer;
		await nextFrames();
		stop();
		stopRecording();

		expect( urls ).toEqual( [ url( 'b' ), url( 'y' ) ] );
		expect( content() ).toBe( 'y' );
		expect( window.location.href ).toBe( url( 'y' ) );
		expect( state.navigating ).toBe( false );
	} );
} );

describe( 'a navigation started inside the commit of an older one', () => {
	test( 'renders after the older commit, which still adds its history entry', async () => {
		const historyLength = await start();
		const requests = mockFetch();
		const { changes, stop: stopRecording } = recordLifecycle();
		let newer: Promise< void > | undefined;
		const stop = watch( () => {
			if ( state.url === url( 'x' ) && ! newer ) {
				newer = actions.navigate( url( 'y' ), quiet );
			}
		} );

		await actions.navigate( url( 'x' ), { ...quiet, html: page( 'x' ) } );
		stop();
		await nextFrames();

		expect( content() ).toBe( 'x' );
		expect( window.location.href ).toBe( url( 'x' ) );
		expect( window.history.length ).toBe( historyLength + 1 );
		expect( state.navigating ).toBe( true );

		requests[ 0 ].respond( page( 'y' ) );
		await newer;
		await nextFrames();
		stopRecording();

		expect( content() ).toBe( 'y' );
		expect( state.url ).toBe( url( 'y' ) );
		expect( window.location.href ).toBe( url( 'y' ) );
		expect( window.history.length ).toBe( historyLength + 2 );
		expect( changes ).toEqual( [
			{ navigating: true, initiator: null },
			{ navigating: false, initiator: null },
		] );
	} );
} );

describe( 'the loading feedback of a superseded navigation', () => {
	const loading = [ 'Loading page, please wait.' ];
	const loaded = [ 'Page Loaded.' ];

	/**
	 * Waits until a navigation still loading 400 ms after it started has
	 * started the loading bar and announced that the page is loading.
	 */
	async function loadingShown() {
		await vi.waitFor( () => {
			expect( loadingBarClasses() ).toEqual( [ 'start-animation' ] );
			expect( vi.mocked( speak ).mock.calls ).toEqual( [ loading ] );
		} );
	}

	test.each( [
		[
			'its page arrives',
			{},
			( respond: ( html: string, status?: number ) => void ) =>
				respond( page( 's' ) ),
		],
		[
			'its response is not accepted',
			{},
			( respond: ( html: string, status?: number ) => void ) =>
				respond( page( 's' ), 503 ),
		],
		[ 'its timeout elapses', { timeout: 800 }, () => {} ],
	] )(
		'is closed by the Back press that supersedes it, and stays closed when %s',
		async ( _, options, settle ) => {
			await start( [ 'a', 'b' ] );
			const requests = mockFetch();

			const s = track( actions.navigate( url( 's' ), options ) );
			await loadingShown();
			await back( 'a' );

			expect( loadingBarClasses() ).toEqual( [ 'finish-animation' ] );
			expect( vi.mocked( speak ).mock.calls ).toEqual( [
				loading,
				loaded,
			] );

			settle( requests[ 0 ].respond );
			await vi.waitFor( () => expect( s.resolved ).toBe( true ), {
				timeout: 2000,
			} );
			await nextFrames();

			expect( loadingBarClasses() ).toEqual( [ 'finish-animation' ] );
			expect( vi.mocked( speak ).mock.calls ).toEqual( [
				loading,
				loaded,
			] );
		}
	);

	test( 'is never shown when a Back press supersedes it within its first 400 ms', async () => {
		await start( [ 'a', 'b' ] );
		const requests = mockFetch();
		const classesBefore = loadingBarClasses();

		const s = actions.navigate( url( 's' ) );
		await back( 'a' );
		// Past the 400 ms after which a navigation still loading shows it.
		await sleep( 450 );

		expect( loadingBarClasses() ).toEqual( classesBefore );
		expect( speak ).not.toHaveBeenCalled();

		requests[ 0 ].respond( page( 's' ) );
		await s;
		await nextFrames();

		expect( loadingBarClasses() ).toEqual( classesBefore );
		expect( speak ).not.toHaveBeenCalled();
	} );

	test( 'is never shown, nor closed by the Back press that supersedes it, when it is called with `loadingAnimation: false` and `screenReaderAnnouncement: false`', async () => {
		await start( [ 'a', 'b' ] );
		const requests = mockFetch();
		const classesBefore = loadingBarClasses();

		const s = actions.navigate( url( 's' ), quiet );
		// Past the 400 ms after which a navigation still loading shows it.
		await sleep( 450 );
		await back( 'a' );
		requests[ 0 ].respond( page( 's' ) );
		await s;
		await nextFrames();

		expect( loadingBarClasses() ).toEqual( classesBefore );
		expect( speak ).not.toHaveBeenCalled();
	} );

	test( 'stays shown, when the newer navigation has also shown it, until the newer one renders', async () => {
		await start();
		const requests = mockFetch();

		const x = actions.navigate( url( 'x' ) );
		await loadingShown();
		const y = actions.navigate( url( 'y' ) );
		await vi.waitFor( () => expect( speak ).toHaveBeenCalledTimes( 2 ) );

		requests[ 0 ].respond( page( 'x' ) );
		await x;
		await nextFrames();

		expect( content() ).toBe( 'start' );
		expect( loadingBarClasses() ).toEqual( [ 'start-animation' ] );
		expect( vi.mocked( speak ).mock.calls ).toEqual( [ loading, loading ] );

		requests[ 1 ].respond( page( 'y' ) );
		await y;
		await vi.waitFor( () => expect( speak ).toHaveBeenCalledTimes( 3 ) );
		await nextFrames();

		expect( content() ).toBe( 'y' );
		expect( loadingBarClasses() ).toEqual( [ 'finish-animation' ] );
		expect( vi.mocked( speak ).mock.calls ).toEqual( [
			loading,
			loading,
			loaded,
		] );
	} );

	test.each( [
		[ 'that renders within its first 400 ms', {}, 0, [ loading, loaded ] ],
		[
			'that shows its own loading feedback before rendering',
			{},
			450,
			[ loading, loading, loaded ],
		],
		[
			'called with `loadingAnimation: false` and `screenReaderAnnouncement: false`',
			quiet,
			0,
			[ loading, loaded ],
		],
	] )(
		'stays shown, when it settles within the first 400 ms of a newer navigation %s, until the newer one renders',
		async ( _, options, delay, announcements ) => {
			await start();
			const requests = mockFetch();

			const x = actions.navigate( url( 'x' ) );
			await loadingShown();
			const y = actions.navigate( url( 'y' ), options );
			requests[ 0 ].respond( page( 'x' ) );
			await x;
			await nextFrames();

			expect( content() ).toBe( 'start' );
			expect( loadingBarClasses() ).toEqual( [ 'start-animation' ] );
			expect( vi.mocked( speak ).mock.calls ).toEqual( [ loading ] );

			await sleep( delay );
			requests[ 1 ].respond( page( 'y' ) );
			await y;
			await vi.waitFor( () =>
				expect( speak ).toHaveBeenLastCalledWith( 'Page Loaded.' )
			);
			await nextFrames();

			expect( content() ).toBe( 'y' );
			expect( loadingBarClasses() ).toEqual( [ 'finish-animation' ] );
			expect( vi.mocked( speak ).mock.calls ).toEqual( announcements );
		}
	);

	test( 'is closed by a Back press that supersedes a newer navigation within its first 400 ms', async () => {
		await start( [ 'a', 'b' ] );
		const requests = mockFetch();

		const x = actions.navigate( url( 'x' ) );
		await loadingShown();
		const y = actions.navigate( url( 'y' ) );
		await back( 'a' );

		expect( loadingBarClasses() ).toEqual( [ 'finish-animation' ] );
		expect( vi.mocked( speak ).mock.calls ).toEqual( [ loading, loaded ] );

		// Past the 400 ms after which a navigation still loading shows it.
		await sleep( 450 );
		requests[ 0 ].respond( page( 'x' ) );
		requests[ 1 ].respond( page( 'y' ) );
		await Promise.all( [ x, y ] );
		await nextFrames();

		expect( content() ).toBe( 'a' );
		expect( loadingBarClasses() ).toEqual( [ 'finish-animation' ] );
		expect( vi.mocked( speak ).mock.calls ).toEqual( [ loading, loaded ] );
	} );

	test( 'is announced as loaded once when two refreshes still loading after 400 ms end in reverse order', async () => {
		await start();
		const requests = mockFetch();
		const refresh = () =>
			actions.navigate( window.location.href, { force: true } );

		const first = refresh();
		const second = refresh();
		await sleep( 450 );
		requests[ 1 ].respond( page( 'second' ) );
		await second;
		await vi.waitFor( () =>
			expect( speak ).toHaveBeenLastCalledWith( 'Page Loaded.' )
		);
		requests[ 0 ].respond( page( 'first' ) );
		await first;
		await nextFrames();

		expect( content() ).toBe( 'second' );
		expect( vi.mocked( speak ).mock.calls ).toEqual( [ loading, loaded ] );
	} );
} );
