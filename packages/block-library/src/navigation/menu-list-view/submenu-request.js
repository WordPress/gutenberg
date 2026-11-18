import { useSyncExternalStore } from '@wordpress/element';

/**
 * Connects "Create submenu" in an item's options menu to the popovers that
 * follow it: the choice of submenu, then, for a label-only one, its label.
 *
 * The options menu closes (and unmounts) as soon as an option is chosen, so
 * the popovers are rendered by the menu's top-level add button, which is
 * always there, and this tiny store tells it which item, and which step.
 *
 * @typedef {Object} SubmenuRequest
 * @property {string}    clientId        The item becoming a submenu.
 * @property {string}    step            'type' or 'label'.
 * @property {?Function} updateExpansion List view expansion setter.
 */
let request = null;
const listeners = new Set();

function subscribe( listener ) {
	listeners.add( listener );
	return () => listeners.delete( listener );
}

/**
 * @param {?SubmenuRequest} value The request, or null once handled.
 */
export function setSubmenuRequest( value ) {
	request = value;
	listeners.forEach( ( listener ) => listener() );
}

/**
 * @return {?SubmenuRequest} The request.
 */
export function useSubmenuRequest() {
	return useSyncExternalStore( subscribe, () => request );
}
