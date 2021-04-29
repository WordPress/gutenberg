/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { isTextField } from '@wordpress/dom';
import { ENTER, BACKSPACE, DELETE } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { SelectionStart } from '../../writing-flow';
import { store as blockEditorStore } from '../../../store';

/**
 * Adds block behaviour:
 *   - Removes the block on BACKSPACE.
 *   - Inserts a default block on ENTER.
 *   - Initiates selection start for multi-selection.
 *   - Disables dragging of block contents.
 *
 * @param {string} clientId Block client ID.
 */
export function useEventHandlers( clientId ) {
	const onSelectionStart = useContext( SelectionStart );
	const isSelected = useSelect(
		( select ) => select( blockEditorStore ).isBlockSelected( clientId ),
		[ clientId ]
	);
	const { getBlockRootClientId, getBlockIndex } = useSelect(
		blockEditorStore
	);
	const { insertDefaultBlock, removeBlock } = useDispatch( blockEditorStore );

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

				if ( keyCode === ENTER ) {
					insertDefaultBlock(
						{},
						getBlockRootClientId( clientId ),
						getBlockIndex( clientId ) + 1
					);
				} else {
					removeBlock( clientId );
				}
			}

			function onMouseLeave( { buttons } ) {
				// The primary button must be pressed to initiate selection.
				// See https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
				if ( buttons === 1 ) {
					onSelectionStart( clientId );
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
			node.addEventListener( 'mouseleave', onMouseLeave );
			node.addEventListener( 'dragstart', onDragStart );

			return () => {
				node.removeEventListener( 'mouseleave', onMouseLeave );
				node.removeEventListener( 'keydown', onKeyDown );
				node.removeEventListener( 'dragstart', onDragStart );
			};
		},
		[
			clientId,
			isSelected,
			getBlockRootClientId,
			getBlockIndex,
			onSelectionStart,
			insertDefaultBlock,
			removeBlock,
		]
	);
}
