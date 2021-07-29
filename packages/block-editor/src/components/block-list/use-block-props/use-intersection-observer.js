/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { IntersectionObserver } from '../';

export function useIntersectionObserver() {
	const observer = useContext( IntersectionObserver );
	return useRefEffect(
		( node ) => {
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
