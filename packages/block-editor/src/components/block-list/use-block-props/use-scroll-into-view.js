/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';

export function useScrollIntoView( { isSelected } ) {
	return useRefEffect(
		( node ) => {
			if ( isSelected ) {
				const { ownerDocument } = node;
				const { defaultView } = ownerDocument;
				if ( ! defaultView ) {
					return;
				}
				const observer = new defaultView.IntersectionObserver(
					( entries ) => {
						// Once observing starts, we always get an initial
						// entry with the intersecting state.
						if ( ! entries[ 0 ].isIntersecting ) {
							node.scrollIntoView();
							observer.disconnect();
						}
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
