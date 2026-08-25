if ( globalThis.SCRIPT_DEBUG ) {
	await import( 'preact/debug' );
}
import { h, cloneElement, render } from 'preact';
import { batch, effect } from '@preact/signals';
import './directives'; // Registers all the core directives.
import { routerRegions } from './directives/router-region';
import {
	initialVdomPromise,
	hydrateRegions,
	getRegionRootFragment,
} from './hydration';
import { toVdom } from './vdom';
import { directive } from './hooks';
import { getNamespace } from './namespaces';
import { parseServerData, populateServerData } from './store';
import { proxifyState } from './proxies';
import {
	deepReadOnly,
	navigationSignal,
	onDOMReady,
	sessionId,
	warn,
} from './utils';

export {
	store,
	getConfig,
	getServerState,
	type AsyncAction,
	type TypeYield,
} from './store';
export { getContext, getServerContext, getElement } from './scopes';
export {
	withScope,
	useWatch,
	useInit,
	useEffect,
	useLayoutEffect,
	useCallback,
	useMemo,
	splitTask,
	withSyncEvent,
} from './utils';

export { useState, useRef } from 'preact/hooks';

/**
 * Subscribes to changes in any signal accessed inside the callback, re-running
 * the callback whenever those signals change. Returns a cleanup function to
 * stop watching.
 *
 * @example
 * ```js
 * const unwatch = watch( () => {
 *   console.log( state.counter );
 * } );
 *
 * // Later, to stop watching:
 * unwatch();
 * ```
 */
export const watch = effect;

const requiredConsent =
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.';

export const privateApis = (
	lock: 'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
): any => {
	if ( lock === requiredConsent ) {
		return {
			getRegionRootFragment,
			initialVdomPromise,
			toVdom,
			directive,
			getNamespace,
			h,
			cloneElement,
			render,
			proxifyState,
			parseServerData,
			populateServerData,
			batch,
			routerRegions,
			deepReadOnly,
			navigationSignal,
			sessionId,
			warn,
		};
	}

	throw new Error( 'Forbidden access.' );
};

// Parses and populates the initial state and config.
populateServerData( parseServerData() );

// Hydrates all interactive regions when `DOMContentLoaded` is dispatched, or as
// soon as the `@wordpress/interactivity` module is evaluated in the case that
// the event was already dispatched. This ensures synchronous modules had the
// opportunity to register their stores before hydration takes place. For
// asynchronous modules, or modules importing this module asynchronously, this
// cannot be guaranteed.
onDOMReady( hydrateRegions );

// Tag the current history entry with the session ID so that, within the same
// session, all entries share the same ID and back/forward works normally.
window.history.replaceState(
	{ ...window.history.state, wpInteractivityId: sessionId },
	''
);

// When the browser fires `popstate` for a history entry that was created by
// the Interactivity API in a different session (i.e., before a full page
// reload), force a reload so the server can render the correct content.
// Without this, the URL would change but the page content would remain stale
// because the interactivity router — which handles client-side navigations —
// might not be loaded yet.
//
// Entries without a `wpInteractivityId` must NOT trigger a reload:
//
// - Some `popstate` events (e.g., anchor/fragment navigations like clicking
//   `<a href="#section">`) have `null` state. These are same-document
//   navigations and the browser should just scroll to the target element as
//   normal.
// - Entries with a state object but no `wpInteractivityId` were created by
//   third-party code using the History API (e.g., an embedded app saving its
//   state to the URL with `pushState`/`replaceState`). That code is
//   responsible for handling its own entries.
//   See https://github.com/WordPress/gutenberg/issues/60455.
window.addEventListener( 'popstate', ( event ) => {
	if (
		event.state?.wpInteractivityId &&
		event.state.wpInteractivityId !== sessionId
	) {
		window.location.reload();
	}
} );
