/**
 * WordPress dependencies
 */
import { useCallback, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { IntersectionObserver } from '../';

export function useIntersectionObserver() {
	const observer = useContext( IntersectionObserver );
	return useCallback(
		( node ) => {
			if ( ! node ) {
				return;
			}
			if ( observer ) {
				observer.observe( node );
				return () => {
					observer.unobserve( node );
				};
			}
		},
		[ observer ]
	);
}
