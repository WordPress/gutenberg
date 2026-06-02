/**
 * WordPress dependencies
 */
import { useReducedMotion } from '@wordpress/compose';
import { useCallback } from '@wordpress/element';

export function useScrollIntoView( { isSelected } ) {
	const prefersReducedMotion = useReducedMotion();
	return useCallback(
		( node ) => {
			if ( ! node ) {
				return;
			}
			if ( isSelected ) {
				const { ownerDocument } = node;
				const { defaultView } = ownerDocument;
				if ( ! defaultView.IntersectionObserver ) {
					return;
				}
				const observer = new defaultView.IntersectionObserver(
					( entries ) => {
						// Once observing starts, we always get an initial
						// entry with the intersecting state.
						if ( ! entries[ 0 ].isIntersecting ) {
							node.scrollIntoView( {
								behavior: prefersReducedMotion
									? 'instant'
									: 'smooth',
							} );
						}
						observer.disconnect();
					}
				);
				observer.observe( node );
				return () => {
					observer.disconnect();
				};
			}
		},
		[ isSelected ]
	);
}
