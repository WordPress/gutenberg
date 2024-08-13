/**
 * WordPress dependencies
 */
import { useReducedMotion, useRefEffect } from '@wordpress/compose';

export function useScrollIntoView( { isSelected } ) {
	const prefersReducedMotion = useReducedMotion();
	return useRefEffect(
		( node ) => {
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
