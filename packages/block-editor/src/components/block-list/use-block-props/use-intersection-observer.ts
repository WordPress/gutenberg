import { useRefEffect } from '@wordpress/compose';
import { useContext } from '@wordpress/element';
import { IntersectionObserver } from '../';

export function useIntersectionObserver() {
	const observer = useContext( IntersectionObserver );
	return useRefEffect< HTMLElement >(
		( node ) => {
			if ( observer ) {
				observer.observe( node );
				return () => {
					observer.unobserve( node );
				};
			}
			return undefined;
		},
		[ observer ]
	);
}
