import { useRefEffect } from '@wordpress/compose';

export function useScrollIntoView( { isSelected }: { isSelected?: boolean } ) {
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
							// Read when scrolling: subscribing would cost
							// every block a media query listener.
							node.scrollIntoView( {
								behavior: defaultView.matchMedia(
									'(prefers-reduced-motion: reduce)'
								).matches
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
