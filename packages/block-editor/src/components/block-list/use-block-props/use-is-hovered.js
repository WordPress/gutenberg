/**
 * WordPress dependencies
 */
import {
	useRefEffect,
	privateApis as composePrivateApis,
} from '@wordpress/compose';

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
	return useRefEffect(
		( node ) => {
			if ( ! isEnabled ) {
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
