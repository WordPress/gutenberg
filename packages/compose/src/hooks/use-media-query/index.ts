/**
 * WordPress dependencies
 */
import { useMemo, useSyncExternalStore } from '@wordpress/element';

type MQLCache = Map< string, MediaQueryList >;

const perWindowCache = new WeakMap< Window, MQLCache >();

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
	const source = useMemo( () => {
		const mediaQueryList = getMediaQueryList( view, query );

		return {
			subscribe( onStoreChange: any ) {
				if ( ! mediaQueryList ) {
					return () => {};
				}

				// Avoid a fatal error when browsers don't support `addEventListener` on MediaQueryList.
				mediaQueryList.addEventListener?.( 'change', onStoreChange );
				return () => {
					mediaQueryList.removeEventListener?.(
						'change',
						onStoreChange
					);
				};
			},
			getValue() {
				return mediaQueryList?.matches ?? false;
			},
		};
	}, [ view, query ] );

	return useSyncExternalStore(
		source.subscribe,
		source.getValue,
		() => false
	);
}
