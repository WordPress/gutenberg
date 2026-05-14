/**
 * WordPress dependencies
 */
import { useMemo, useSyncExternalStore } from '@wordpress/element';

type MQLCache = Map< string, MediaQueryList >;

type MQLSubscriber = {
	subscribe: ( onStoreChange: () => void ) => () => void;
	getValue: () => boolean;
};

const perWindowCache = new WeakMap< Window, MQLCache >();

// One subscriber object per MediaQueryList, with a single underlying
// `change` listener that fans out to all React consumers. Without this,
// every component that calls `useMediaQuery` registers its own listener
// on the (shared) MediaQueryList, which adds noticeable cost when many
// components mount at once (~85 ms during a large-post editor mount).
const subscriberCache = new WeakMap< MediaQueryList, MQLSubscriber >();

const EMPTY_SUBSCRIBER: MQLSubscriber = {
	subscribe: () => () => {},
	getValue: () => false,
};

/**
 * A new MediaQueryList object for the media query
 *
 * @param view    Window.
 * @param [query] Media Query.
 */
function getMediaQueryList(
	view: Window,
	query?: string
): MediaQueryList | null {
	if ( ! query ) {
		return null;
	}

	const matchMediaCache: MQLCache = perWindowCache.get( view ) ?? new Map();

	if ( ! perWindowCache.has( view ) ) {
		perWindowCache.set( view, matchMediaCache );
	}

	let match = matchMediaCache.get( query );

	if ( match ) {
		return match;
	}

	if ( typeof view?.matchMedia === 'function' ) {
		match = view.matchMedia( query );
		matchMediaCache.set( query, match );
		return match;
	}

	return null;
}

function getSubscriber( mediaQueryList: MediaQueryList ): MQLSubscriber {
	const cached = subscriberCache.get( mediaQueryList );
	if ( cached ) {
		return cached;
	}

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

	subscriberCache.set( mediaQueryList, subscriber );
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
	view: Window = window
): boolean {
	const source = useMemo< MQLSubscriber >( () => {
		const mediaQueryList = getMediaQueryList( view, query );
		return mediaQueryList
			? getSubscriber( mediaQueryList )
			: EMPTY_SUBSCRIBER;
	}, [ view, query ] );

	return useSyncExternalStore(
		source.subscribe,
		source.getValue,
		() => false
	);
}
