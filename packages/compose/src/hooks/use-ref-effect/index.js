/**
 * WordPress dependencies
 */
import { useCallback, useRef } from '@wordpress/element';

/**
 * Effect-like ref callback.
 *
 * @param {Function} calllback    Callback with ref as argument.
 * @param {Array}    dependencies Dependencies of the callback.
 *
 * @return {Function} Ref callback.
 */
export default function useRefEffect( calllback, dependencies ) {
	const cleanup = useRef();
	return useCallback( ( node ) => {
		if ( node ) {
			cleanup.current = calllback( node );
		} else {
			cleanup.current();
		}
	}, dependencies );
}
