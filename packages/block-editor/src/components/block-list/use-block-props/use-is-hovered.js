import {
	useRefEffect,
	privateApis as composePrivateApis,
} from '@wordpress/compose';
import { createContext, useContext } from '@wordpress/element';
import { unlock } from '../../../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

/**
 * Receives the client ID of the hovered block, or `null` when the pointer
 * leaves it. Hover is tracked in the DOM rather than the store so that
 * moving the pointer never re-renders blocks; this is the one outlet for
 * UI that needs to follow the hovered block.
 */
export const BlockHoverContext = createContext( null );

/**
 * Adds `is-hovered` class when the block is hovered and in navigation or
 * outline mode.
 *
 * @param {Object}  options                  Options object.
 * @param {string}  [options.clientId]       Client ID of the block.
 * @param {boolean} [options.isEnabled=true] Whether to enable hover detection.
 *
 * @return {Function} Ref callback.
 */
export function useIsHovered( { clientId, isEnabled = true } = {} ) {
	const onHoverChange = useContext( BlockHoverContext );

	return useRefEffect(
		( node ) => {
			if ( ! isEnabled ) {
				return;
			}

			let timeoutId;
			let isHovered = false;

			function listener( event ) {
				if ( event.defaultPrevented ) {
					return;
				}
				event.preventDefault();
				isHovered = event.type === 'mouseover';
				node.classList.toggle( 'is-hovered', isHovered );
				onHoverChange?.( isHovered ? clientId : null );
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
				const { target } = event;
				timeoutId = setTimeout( () => {
					node.classList.toggle(
						'is-hovered-draggable',
						! target.isContentEditable
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
				if ( isHovered ) {
					onHoverChange?.( null );
				}
			};
		},
		[ clientId, isEnabled, onHoverChange ]
	);
}
