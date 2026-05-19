/**
 * WordPress dependencies
 */
import { useRefEffect, subscribeSharedListener } from '@wordpress/compose';

/**
 * Adds `is-hovered` class when the block is hovered and in navigation or
 * outline mode.
 *
 * @param {Object}  options                  Options object.
 * @param {boolean} [options.isEnabled=true] Whether to enable hover detection.
 *
 * @return {Function} Ref callback.
 */
export function useIsHovered( { isEnabled = true } = {} ) {
	return useRefEffect(
		( node ) => {
			if ( ! isEnabled ) {
				return;
			}

			function listener( event ) {
				if ( event.defaultPrevented ) {
					return;
				}
				if ( ! node.contains( event.target ) ) {
					return;
				}
				event.preventDefault();
				node.classList.toggle(
					'is-hovered',
					event.type === 'mouseover'
				);
			}

			const unsubscribeOut = subscribeSharedListener(
				node.ownerDocument,
				'mouseout',
				listener
			);
			const unsubscribeOver = subscribeSharedListener(
				node.ownerDocument,
				'mouseover',
				listener
			);

			return () => {
				unsubscribeOut();
				unsubscribeOver();

				// Remove class in case it lingers.
				node.classList.remove( 'is-hovered' );
			};
		},
		[ isEnabled ]
	);
}
