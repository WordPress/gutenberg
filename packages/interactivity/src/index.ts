if ( globalThis.SCRIPT_DEBUG ) {
	await import( 'preact/debug' );
}

/**
 * External dependencies
 */
import { h, cloneElement, render } from 'preact';
import { batch, effect } from '@preact/signals';

/**
 * Internal dependencies
 */
import registerDirectives, { routerRegions } from './directives';
import {
	initialVdom,
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
			initialVdom,
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

// Parses and populates the initial state and config. All the core directives
// are registered at this point as well.
populateServerData( parseServerData() );
registerDirectives();

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

// When the browser fires `popstate` for a history entry that was created in a
// different session (i.e., before a full page reload), force a reload so the
// server can render the correct content. Without this, the URL would change but
// the page content would remain stale because the interactivity router — which
// handles client-side navigations — might not be loaded yet.
window.addEventListener( 'popstate', ( event ) => {
	if ( event.state?.wpInteractivityId !== sessionId ) {
		window.location.reload();
	}
} );
