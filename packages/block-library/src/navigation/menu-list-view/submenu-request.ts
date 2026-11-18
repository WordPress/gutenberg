import { useSyncExternalStore } from '@wordpress/element';

/**
 * Connects "Create submenu" in an item's options menu to the popovers that
 * follow it: the choice of submenu, then, for a label-only one, its label.
 *
 * The options menu closes (and unmounts) as soon as an option is chosen, so
 * the popovers are rendered by the menu's top-level add button, which is
 * always there, and this tiny store tells it which item, and which step.
 */
export interface SubmenuRequest {
	/** The item becoming a submenu. */
	clientId: string;
	/** 'type' or 'label'. */
	step: 'type' | 'label';
	/** List view expansion setter. */
	updateExpansion?: ( ( ...args: any[] ) => void ) | null;
}

let request: SubmenuRequest | null = null;
const listeners = new Set< () => void >();

function subscribe( listener: () => void ) {
	listeners.add( listener );
	return () => listeners.delete( listener );
}

/**
 * @param value The request, or null once handled.
 */
export function setSubmenuRequest( value: SubmenuRequest | null ) {
	request = value;
	listeners.forEach( ( listener ) => listener() );
}

/**
 * @return The request.
 */
export function useSubmenuRequest(): SubmenuRequest | null {
	return useSyncExternalStore( subscribe, () => request );
}
