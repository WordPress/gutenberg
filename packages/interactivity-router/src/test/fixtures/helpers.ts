import { hydrate } from 'preact';
import { vi } from 'vitest';
import { privateApis, store, watch } from '@wordpress/interactivity';

const { afterNextFrame, getRegionRootFragment, toVdom, sessionId } =
	privateApis(
		'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
	);

// The router merges into this same store when it loads, so the lifecycle keys
// can be read without importing the router module.
const { state: routerState } = store( 'core/router' ) as {
	state: { navigating?: boolean; initiator?: string | null };
};

type Lifecycle = Pick< typeof routerState, 'navigating' | 'initiator' >;

/**
 * Options that keep a navigation from scheduling the loading bar and the
 * screen reader announcements, which are unrelated to these tests.
 */
export const quiet = {
	loadingAnimation: false,
	screenReaderAnnouncement: false,
};

let namespaceCount = 0;
const uniqueNamespace = () => `test/namespace-${ ++namespaceCount }`;

/**
 * Builds a full HTML document for a navigation destination.
 *
 * @param body The body markup.
 * @return The HTML document.
 */
export const pageHtml = ( body: string ) =>
	`<!doctype html><title>t</title><body>${ body }</body>`;

/**
 * Records every change of the lifecycle keys, skipping the initial reading.
 *
 * @return The recorded changes and a function to stop recording.
 */
export function recordLifecycle() {
	const changes: Lifecycle[] = [];
	let isInitialRun = true;
	const stop = watch( () => {
		const reading = {
			navigating: routerState.navigating,
			initiator: routerState.initiator,
		};
		if ( isInitialRun ) {
			isInitialRun = false;
			return;
		}
		changes.push( reading );
	} );
	return { changes, stop };
}

/**
 * Replaces `window.fetch` with a mock whose responses the test delivers.
 *
 * @return The pending requests, in call order.
 */
export function mockFetch() {
	const requests: Array< {
		respond: ( html: string, status?: number ) => void;
	} > = [];
	vi.stubGlobal(
		'fetch',
		vi.fn(
			() =>
				new Promise( ( resolve ) => {
					requests.push( {
						respond: ( html, status = 200 ) =>
							resolve( { status, text: async () => html } ),
					} );
				} )
		)
	);
	return requests;
}

/**
 * Replaces `window.fetch` with a mock that answers every request with a 404,
 * which makes the router fall back to a full page load.
 */
export function mockFetchNotFound() {
	vi.stubGlobal(
		'fetch',
		vi.fn( async () => ( { status: 404, text: async () => '' } ) )
	);
}

/**
 * Appends the markup to the document and hydrates it like the runtime does.
 *
 * @param html Markup with a single root element.
 * @return The hydrated root element.
 */
export function hydrateHtml( html: string ) {
	const container = document.createElement( 'div' );
	container.innerHTML = html;
	document.body.appendChild( container );
	const element = container.firstElementChild as Element;
	hydrate( toVdom( element ), getRegionRootFragment( element ) );
	return element;
}

/**
 * Hydrates a `data-wp-watch` directive that records `state.navigating` on
 * every run.
 *
 * @return The readings, one per run.
 */
export function hydrateNavigatingWatcher() {
	const runs: Array< boolean | undefined > = [];
	const namespace = uniqueNamespace();
	store( namespace, {
		callbacks: {
			log() {
				runs.push( routerState.navigating );
			},
		},
	} );
	hydrateHtml(
		`<div data-wp-interactive="${ namespace }" data-wp-watch="callbacks.log"></div>`
	);
	return runs;
}

/**
 * Hydrates an element with a `data-wp-on--click` directive, optionally inside
 * a router region, so a callback can run with that element's directive scope.
 *
 * @param regionAttribute The `data-wp-router-region` value, or `null` to
 *                        render no region.
 * @return The trigger element and a function to run a callback in its scope.
 */
export function hydrateTrigger( regionAttribute: string | null ) {
	let callback: () => unknown = () => undefined;
	let result: unknown;
	const namespace = uniqueNamespace();
	store( namespace, {
		actions: {
			trigger() {
				result = callback();
			},
		},
	} );
	const region =
		regionAttribute === null
			? ''
			: ` data-wp-router-region='${ regionAttribute }'`;
	const element = hydrateHtml(
		`<div data-wp-interactive="${ namespace }"${ region }><button data-wp-on--click="actions.trigger"></button></div>`
	);
	return {
		element,
		runInScope< T >( fn: () => T ): T {
			callback = fn;
			element.querySelector( 'button' )!.click();
			return result as T;
		},
	};
}

/**
 * Moves to `path` and dispatches the `popstate` event a back or forward
 * traversal within the current session produces.
 *
 * @param path The destination path.
 */
export function traverseTo( path: string ) {
	window.history.pushState( { wpInteractivityId: sessionId }, '', path );
	window.dispatchEvent(
		new PopStateEvent( 'popstate', { state: window.history.state } )
	);
}

/**
 * Waits for the frames in which the router ends a navigation that has already
 * started, and in which the directives react to that end.
 */
export async function nextFrames() {
	for ( let i = 0; i < 3; i++ ) {
		await new Promise< void >( ( resolve ) => afterNextFrame( resolve ) );
	}
}
