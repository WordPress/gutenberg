import {
	useRefEffect,
	privateApis as composePrivateApis,
} from '@wordpress/compose';
import { unlock } from '../../../lock-unlock';
import { isEditingBlock } from './use-selected-block-event-handlers';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

/**
 * Adds `is-hovered` class when the block is hovered and in navigation or
 * outline mode.
 *
 * @param options           Options object.
 * @param options.isEnabled Whether to enable hover detection.
 *
 * @return Ref callback.
 */
export function useIsHovered( {
	isEnabled = true,
}: { isEnabled?: boolean } = {} ) {
	return useRefEffect< HTMLElement >(
		( node ) => {
			if ( ! isEnabled ) {
				return;
			}

			let timeoutId: ReturnType< typeof setTimeout > | undefined;

			function listener( event: MouseEvent ) {
				if ( event.defaultPrevented ) {
					return;
				}
				event.preventDefault();
				const isHovered = event.type === 'mouseover';
				node.classList.toggle( 'is-hovered', isHovered );
				clearTimeout( timeoutId );
				if ( ! isHovered ) {
					node.classList.remove(
						'is-hovered-draggable',
						'is-hovered-drag-anywhere'
					);
					return;
				}
				// Over editable content the cursor is a text cursor, not
				// the grab cursor, so no drag would start there. The
				// editability check can force a style recalculation, so it
				// runs once the pointer rests, which also keeps the
				// outline from flashing on blocks it merely passes over.
				// Mouse events target elements.
				const target = event.target as HTMLElement;
				timeoutId = setTimeout( () => {
					// With drag from anywhere, the block drags from its text
					// too, until the caret is in it.
					const isDragAnywhere =
						!! window.__experimentalBlockDragFromAnywhere &&
						target.isContentEditable &&
						target.closest( '[data-block]' ) === node &&
						! isEditingBlock( node );
					node.classList.toggle(
						'is-hovered-draggable',
						! target.isContentEditable || isDragAnywhere
					);
					node.classList.toggle(
						'is-hovered-drag-anywhere',
						isDragAnywhere
					);
				}, 100 );
			}

			// Once the caret is in the block, its text selects again, so
			// the drag affordance goes.
			function onFocusIn() {
				if (
					node.classList.contains( 'is-hovered-drag-anywhere' ) &&
					isEditingBlock( node )
				) {
					node.classList.remove(
						'is-hovered-draggable',
						'is-hovered-drag-anywhere'
					);
				}
			}
			node.addEventListener( 'focusin', onFocusIn );
			// While a text block is selected, focus is on the writing flow
			// wrapper rather than in the block, so a click that puts the caret
			// in the block is checked too.
			node.addEventListener( 'click', onFocusIn );

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
				node.removeEventListener( 'focusin', onFocusIn );
				node.removeEventListener( 'click', onFocusIn );

				// Remove classes in case they linger.
				clearTimeout( timeoutId );
				node.classList.remove( 'is-hovered' );
				node.classList.remove(
					'is-hovered-draggable',
					'is-hovered-drag-anywhere'
				);
			};
		},
		[ isEnabled ]
	);
}
