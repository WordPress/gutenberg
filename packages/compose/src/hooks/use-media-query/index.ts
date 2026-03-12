/**
 * WordPress dependencies
 */
import { useContext, useMemo, useSyncExternalStore } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { WindowContext } from '../../private-apis';

type MQLCache = Map< string, MediaQueryList >;

const perWindowCache = new WeakMap< Window, MQLCache >();

/**
 * A new MediaQueryList object for the media query
 *
 * @param win     Window.
 * @param [query] Media Query.
 */
function getMediaQueryList(
	win: Window,
	query?: string
): MediaQueryList | null {
	if ( ! query ) {
		return null;
	}

	const matchMediaCache: MQLCache = perWindowCache.get( win ) ?? new Map();

	if ( ! perWindowCache.has( win ) ) {
		perWindowCache.set( win, matchMediaCache );
	}

	let match = matchMediaCache.get( query );

	if ( match ) {
		return match;
	}

	if ( typeof win?.matchMedia === 'function' ) {
		match = win.matchMedia( query );
		matchMediaCache.set( query, match );
		return match;
	}

	return null;
}

/**
 * Runs a media query and returns its value when it changes.
 *
 * @param [query] Media Query.
 * @return return value of the media query.
 */
export default function useMediaQuery( query?: string ): boolean {
	const win = useContext( WindowContext );

	const source = useMemo( () => {
		const mediaQueryList = getMediaQueryList( win, query );

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
	}, [ win, query ] );

	return useSyncExternalStore(
		source.subscribe,
		source.getValue,
		() => false
	);
}
