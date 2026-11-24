import {
	useRefEffect,
	privateApis as composePrivateApis,
} from '@wordpress/compose';
import { unlock } from '../../../lock-unlock';
import { isBlockElementOutsideFields } from '../../../utils/dom';

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
					// An inner block handled it: that block is hovered now.
					if ( event.type === 'mouseover' ) {
						clearTimeout( timeoutId );
						node.classList.remove(
							'is-hovered',
							'is-hovered-draggable'
						);
					}
					return;
				}
				event.preventDefault();
				// Moving to another element of this block keeps the outline.
				if (
					event.type === 'mouseout' &&
					node.contains( event.relatedTarget )
				) {
					return;
				}
				const isHovered = event.type === 'mouseover';
				node.classList.toggle( 'is-hovered', isHovered );
				clearTimeout( timeoutId );
				if ( ! isHovered ) {
					node.classList.remove( 'is-hovered-draggable' );
					return;
				}
				// Over editable content the cursor is a text cursor, not
				// the grab cursor, so no drag would start there. The
				// editability check can force a style recalculation, so it
				// runs once the pointer rests, which also keeps the
				// outline from flashing on blocks it merely passes over.
				// The block's own element is only editable inside an
				// editing host, and a press on it still drags the block.
				const { target } = event;
				timeoutId = setTimeout( () => {
					node.classList.toggle(
						'is-hovered-draggable',
						! target.isContentEditable ||
							isBlockElementOutsideFields( target )
					);
				}, 100 );
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
