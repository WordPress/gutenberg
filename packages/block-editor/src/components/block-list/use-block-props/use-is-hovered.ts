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
			const { defaultView } = node.ownerDocument;
			if ( ! isEnabled || ! defaultView ) {
				return;
			}

			let timeoutId: ReturnType< typeof setTimeout > | undefined;
			let frameId = 0;

			const listener = ( event: MouseEvent ) => {
				if ( event.defaultPrevented ) {
					return;
				}
				event.preventDefault();
				defaultView.cancelAnimationFrame( frameId );
				if ( event.type === 'mouseout' ) {
					// Wait for a `mouseover` within the same block.
					frameId = defaultView.requestAnimationFrame( () => {
						clearTimeout( timeoutId );
						node.classList.remove(
							'is-hovered',
							'is-hovered-draggable'
						);
					} );
					return;
				}
				node.classList.add( 'is-hovered' );
				clearTimeout( timeoutId );
				// Over editable content the cursor is a text cursor, not
				// the grab cursor, so no drag would start there. The
				// editability check can force a style recalculation, so it
				// runs once the pointer rests, which also keeps the
				// outline from flashing on blocks it merely passes over.
				// Mouse events target elements.
				const target = event.target as HTMLElement;
				timeoutId = setTimeout( () => {
					node.classList.toggle(
						'is-hovered-draggable',
						! target.isContentEditable
					);
				}, 100 );
			};

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
				defaultView.cancelAnimationFrame( frameId );
				node.classList.remove( 'is-hovered' );
				node.classList.remove( 'is-hovered-draggable' );
			};
		},
		[ isEnabled ]
	);
}
