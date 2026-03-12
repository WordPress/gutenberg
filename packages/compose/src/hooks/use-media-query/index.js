/**
 * WordPress dependencies
 */
import { useContext, useMemo, useSyncExternalStore } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { WindowContext } from '../..';

const matchMediaCache = new Map();

/**
 * A new MediaQueryList object for the media query
 *
 * @param {Window} win     Window.
 * @param {string} [query] Media Query.
 * @return {MediaQueryList|null} A new object for the media query
 */
function getMediaQueryList( win, query ) {
	if ( ! query ) {
		return null;
	}

	let match = matchMediaCache.get( query );

	// if ( match ) {
	// 	return match;
	// }

	if ( typeof win !== 'undefined' && typeof win.matchMedia === 'function' ) {
		match = win.matchMedia( query );
		matchMediaCache.set( query, match );
		return match;
	}

	return null;
}

/**
 * Runs a media query and returns its value when it changes.
 *
 * @param {string} [query] Media Query.
 * @return {boolean} return value of the media query.
 */
export default function useMediaQuery( query ) {
	const win = useContext( WindowContext );

	if ( ! win ) {
		throw new TypeError( win );
	}

	const source = useMemo( () => {
		const mediaQueryList = getMediaQueryList( win, query );

		return {
			/** @type {(onStoreChange: () => void) => () => void} */
			subscribe( onStoreChange ) {
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
