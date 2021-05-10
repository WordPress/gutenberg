/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';

/**
 * Allow scrolling "through" popovers over the canvas. This is only called for
 * as long as the pointer is over a popover. Do not use React events because it
 * will bubble through portals.
 *
 * @param {Object} scrollableRef
 */
export function usePopoverScroll( scrollableRef ) {
	return useRefEffect(
		( node ) => {
			if ( ! scrollableRef ) {
				return;
			}

			function onWheel( event ) {
				const { deltaX, deltaY } = event;
				scrollableRef.current.scrollBy( deltaX, deltaY );
			}
			node.addEventListener( 'wheel', onWheel );
			return () => {
				node.removeEventListener( 'wheel', onWheel );
			};
		},
		[ scrollableRef ]
	);
}
