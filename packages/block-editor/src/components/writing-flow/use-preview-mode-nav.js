/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { TAB, UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * In preview mode, handles Tab and arrow key navigation to move only between
 * block elements, skipping all other focusable content.
 *
 * @return {Function} Ref callback.
 */
export function usePreviewModeNav() {
	const isPreviewMode = useSelect(
		( select ) => select( blockEditorStore ).getSettings().isPreviewMode,
		[]
	);

	return useRefEffect(
		( node ) => {
			if ( ! isPreviewMode ) {
				return;
			}

			function onKeyDown( event ) {
				const { keyCode, shiftKey, target } = event;

				const isTab = keyCode === TAB;
				const isUp = keyCode === UP;
				const isDown = keyCode === DOWN;
				const isLeft = keyCode === LEFT;
				const isRight = keyCode === RIGHT;
				const isArrow = isUp || isDown || isLeft || isRight;

				if ( ! isTab && ! isArrow ) {
					return;
				}

				const isReverse = isTab ? shiftKey : isUp || isLeft;

				const blocks = Array.from(
					node.querySelectorAll( '[data-block]' )
				);

				if ( ! blocks.length ) {
					return;
				}

				const currentBlock = target.closest( '[data-block]' );
				const currentIndex = currentBlock
					? blocks.indexOf( currentBlock )
					: -1;

				let nextIndex;
				if ( isReverse ) {
					nextIndex =
						currentIndex <= 0
							? blocks.length - 1
							: currentIndex - 1;
				} else {
					nextIndex =
						currentIndex === -1 || currentIndex >= blocks.length - 1
							? 0
							: currentIndex + 1;
				}

				event.preventDefault();
				blocks[ nextIndex ].focus();
			}

			node.addEventListener( 'keydown', onKeyDown );
			return () => {
				node.removeEventListener( 'keydown', onKeyDown );
			};
		},
		[ isPreviewMode ]
	);
}
