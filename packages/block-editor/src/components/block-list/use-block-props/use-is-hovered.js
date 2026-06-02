/**
 * WordPress dependencies
 */
import { privateApis as composePrivateApis } from '@wordpress/compose';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

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
	return useCallback(
		( node ) => {
			if ( ! node || ! isEnabled ) {
				return;
			}

			function listener( event ) {
				if ( event.defaultPrevented ) {
					return;
				}
				event.preventDefault();
				node.classList.toggle(
					'is-hovered',
					event.type === 'mouseover'
				);
			}

			const unsubscribeOut = subscribeDelegatedListener(
				node,
				'mouseout',
				listener
			);
			const unsubscribeOver = subscribeDelegatedListener(
				node,
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
