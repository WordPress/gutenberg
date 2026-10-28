import { useReducedMotion, useRefEffect } from '@wordpress/compose';

export function useScrollIntoView( { isSelected }: { isSelected?: boolean } ) {
	const prefersReducedMotion = useReducedMotion();
	return useRefEffect< HTMLElement >(
		( node ) => {
			if ( isSelected ) {
				const { ownerDocument } = node;
				// A rendered block's document has a window.
				const defaultView = ownerDocument.defaultView!;
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
			return undefined;
		},
		[ isSelected ]
	);
}
