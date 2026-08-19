import {
	useRefEffect,
	privateApis as composePrivateApis,
} from '@wordpress/compose';
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

			let timeoutId;

			function listener( event ) {
				if ( event.defaultPrevented ) {
					return;
				}
				event.preventDefault();
				const isHovered = event.type === 'mouseover';
				node.classList.toggle( 'is-hovered', isHovered );
				// Over editable content the cursor is a text cursor, not
				// the grab cursor, so no drag would start there. The
				// delay keeps the outline from flashing on every block
				// the pointer merely passes over.
				if (
					isHovered &&
					! event.target.closest( '[contenteditable="true"]' )
				) {
					timeoutId ??= setTimeout( () => {
						node.classList.add( 'is-hovered-draggable' );
					}, 100 );
				} else {
					clearTimeout( timeoutId );
					timeoutId = undefined;
					node.classList.remove( 'is-hovered-draggable' );
				}
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

				// Remove classes in case they linger.
				clearTimeout( timeoutId );
				node.classList.remove( 'is-hovered' );
				node.classList.remove( 'is-hovered-draggable' );
			};
		},
		[ isEnabled ]
	);
}
