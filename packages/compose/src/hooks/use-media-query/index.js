/**
 * WordPress dependencies
 */
import { useCallback, useSyncExternalStore } from '@wordpress/element';

/**
 * A new MediaQueryList object for the media query
 *
 * @param {string} [query] Media Query.
 * @return {MediaQueryList|null} A new object for the media query
 */
function getMediaQueryList( query ) {
	if (
		!! query &&
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function'
	) {
		return window.matchMedia( query );
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
	const subscribe = useCallback(
		/** @type {(onStoreChange: () => void) => () => void} */
		( onStoreChange ) => {
			const mediaQueryList = getMediaQueryList( query );
			if ( ! mediaQueryList ) {
				return () => {};
			}

			mediaQueryList.addEventListener( 'change', onStoreChange );
			return () => {
				mediaQueryList.removeEventListener( 'change', onStoreChange );
			};
		},
		[ query ]
	);

	const matches = useSyncExternalStore(
		subscribe,
		() => {
			const mediaQueryList = getMediaQueryList( query );
			return mediaQueryList?.matches ?? false;
		},
		() => undefined
	);

	return !! ( query && matches );
}
