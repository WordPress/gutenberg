if ( globalThis.SCRIPT_DEBUG ) {
	await import( 'preact/debug' );
}

/**
 * External dependencies
 */
import { h, cloneElement, render } from 'preact';
import { batch } from '@preact/signals';

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
import { deepReadOnly, navigationSignal, onDOMReady } from './utils';

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
