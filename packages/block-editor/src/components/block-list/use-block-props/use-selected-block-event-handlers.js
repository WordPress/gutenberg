/**
 * WordPress dependencies
 */
import { isTextField } from '@wordpress/dom';
import { ENTER, BACKSPACE, DELETE } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

/**
 * Adds block behaviour:
 *   - Removes the block on BACKSPACE.
 *   - Inserts a default block on ENTER.
 *   - Disables dragging of block contents.
 *
 * @param {string} clientId Block client ID.
 */
export function useEventHandlers( { clientId, isSelected } ) {
	const {
		getBlockRootClientId,
		getBlockIndex,
		isZoomOut,
		__unstableGetEditorMode,
	} = unlock( useSelect( blockEditorStore ) );
	const {
		insertAfterBlock,
		removeBlock,
		__unstableSetEditorMode,
		resetZoomLevel,
	} = unlock( useDispatch( blockEditorStore ) );

	return useRefEffect(
		( node ) => {
			if ( ! isSelected ) {
				return;
			}

			/**
			 * Interprets keydown event intent to remove or insert after block if
			 * key event occurs on wrapper node. This can occur when the block has
			 * no text fields of its own, particularly after initial insertion, to
			 * allow for easy deletion and continuous writing flow to add additional
			 * content.
			 *
			 * @param {KeyboardEvent} event Keydown event.
			 */
			function onKeyDown( event ) {
				const { keyCode, target } = event;

				if (
					keyCode !== ENTER &&
					keyCode !== BACKSPACE &&
					keyCode !== DELETE
				) {
					return;
				}

				if ( target !== node || isTextField( target ) ) {
					return;
				}

				event.preventDefault();

				if (
					keyCode === ENTER &&
					__unstableGetEditorMode() === 'zoom-out' &&
					isZoomOut()
				) {
					__unstableSetEditorMode( 'edit' );
					resetZoomLevel();
				} else if ( keyCode === ENTER ) {
					insertAfterBlock( clientId );
				} else {
					removeBlock( clientId );
				}
			}

			/**
			 * Prevents default dragging behavior within a block. To do: we must
			 * handle this in the future and clean up the drag target.
			 *
			 * @param {DragEvent} event Drag event.
			 */
			function onDragStart( event ) {
				event.preventDefault();
			}

			node.addEventListener( 'keydown', onKeyDown );
			node.addEventListener( 'dragstart', onDragStart );

			return () => {
				node.removeEventListener( 'keydown', onKeyDown );
				node.removeEventListener( 'dragstart', onDragStart );
			};
		},
		[
			clientId,
			isSelected,
			getBlockRootClientId,
			getBlockIndex,
			insertAfterBlock,
			removeBlock,
			__unstableGetEditorMode,
			__unstableSetEditorMode,
			isZoomOut,
			resetZoomLevel,
		]
	);
}
