/**
 * WordPress dependencies
 */
import { useSyncExternalStore } from '@wordpress/element';

type MQLSubscriber = {
	subscribe: ( onStoreChange: () => void ) => () => void;
	getValue: () => boolean;
};

// One subscriber per (window, query). The underlying MediaQueryList lives
// inside the subscriber's closure; a single `change` listener fans out to
// every React consumer via an in-JS `Set` to avoid the per-consumer
// `addEventListener` cost (~85 ms during a large-post editor mount).
const perWindowCache = new WeakMap< Window, Map< string, MQLSubscriber > >();

const EMPTY_SUBSCRIBER: MQLSubscriber = {
	subscribe: () => () => {},
	getValue: () => false,
};

function getMQLSubscriber(
	view: Window | undefined,
	query?: string
): MQLSubscriber {
	if ( ! view || ! query || typeof view.matchMedia !== 'function' ) {
		return EMPTY_SUBSCRIBER;
	}

	let queryCache = perWindowCache.get( view );
	if ( ! queryCache ) {
		queryCache = new Map();
		perWindowCache.set( view, queryCache );
	}

	const cached = queryCache.get( query );
	if ( cached ) {
		return cached;
	}

	const mediaQueryList = view.matchMedia( query );
	const listeners = new Set< () => void >();
	const notify = () => {
		for ( const listener of listeners ) {
			listener();
		}
	};

	const subscriber: MQLSubscriber = {
		subscribe( onStoreChange ) {
			if ( listeners.size === 0 ) {
				// Avoid a fatal error when browsers don't support `addEventListener` on MediaQueryList.
				mediaQueryList.addEventListener?.( 'change', notify );
			}
			listeners.add( onStoreChange );
			return () => {
				listeners.delete( onStoreChange );
				if ( listeners.size === 0 ) {
					mediaQueryList.removeEventListener?.( 'change', notify );
				}
			};
		},
		getValue() {
			return mediaQueryList.matches;
		},
	};

	queryCache.set( query, subscriber );
	return subscriber;
}

/**
 * Runs a media query and returns its value when it changes.
 *
 * @param [query] Media Query.
 * @param [view]  Window instance, else default to global window
 * @return return value of the media query.
 */
export default function useMediaQuery(
	query?: string,
	// Resolve the default lazily so SSR (where `window` is undeclared) does not
	// throw a ReferenceError when this default expression is evaluated.
	view: Window | undefined = typeof window !== 'undefined'
		? window
		: undefined
): boolean {
	const source = getMQLSubscriber( view, query );

	return useSyncExternalStore(
		source.subscribe,
		source.getValue,
		() => false
	);
}
