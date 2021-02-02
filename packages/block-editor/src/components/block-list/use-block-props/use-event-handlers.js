/**
 * WordPress dependencies
 */
import { useContext, useCallback } from '@wordpress/element';
import { isTextField } from '@wordpress/dom';
import { ENTER, BACKSPACE, DELETE } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { isInsideRootBlock } from '../../../utils/dom';
import { SelectionStart } from '../../writing-flow';

/** @typedef {import('@wordpress/element').RefObject} RefObject */

/**
 * Adds block behaviour:
 *   - Selects the block if it receives focus.
 *   - Removes the block on BACKSPACE.
 *   - Inserts a default block on ENTER.
 *   - Initiates selection start for multi-selection.
 *   - Disables dragging of block contents.
 *
 * @param {RefObject} ref React ref with the block element.
 * @param {string}    clientId Block client ID.
 */
export function useEventHandlers( ref, clientId ) {
	// TODO some blocks pass their own reference to `useBlockProps` - How to handle this..
	const onSelectionStart = useContext( SelectionStart );
	const { isSelected, rootClientId, index } = useSelect(
		( select ) => {
			const {
				isBlockSelected,
				getBlockRootClientId,
				getBlockIndex,
			} = select( 'core/block-editor' );

			return {
				isSelected: isBlockSelected( clientId ),
				rootClientId: getBlockRootClientId( clientId ),
				index: getBlockIndex( clientId ),
			};
		},
		[ clientId ]
	);
	const { insertDefaultBlock, removeBlock, selectBlock } = useDispatch(
		'core/block-editor'
	);

	return useCallback(
		( node ) => {
			/**
			 * Marks the block as selected when focused and not already
			 * selected. This specifically handles the case where block does not
			 * set focus on its own (via `setFocus`), typically if there is no
			 * focusable input in the block.
			 *
			 * @param {FocusEvent} event Focus event.
			 */
			function onFocus( event ) {
				// If an inner block is focussed, that block is resposible for
				// setting the selected block.
				if ( ! isInsideRootBlock( node, event.target ) ) {
					return;
				}

				selectBlock( clientId );
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
					insertDefaultBlock( {}, rootClientId, index + 1 );
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

			// Make sure to cleanup any events/references added to the last instance.
			if ( ref.current ) {
				ref.current.removeEventListener( 'focusin', onFocus );
				ref.current.removeEventListener( 'mouseleave', onMouseLeave );
				ref.current.removeEventListener( 'keydown', onKeyDown );
				ref.current.removeEventListener( 'dragstart', onDragStart );
			}
			if ( ! node ) return;
			if ( ! isSelected ) {
				node.addEventListener( 'focusin', onFocus );
			}

			node.addEventListener( 'keydown', onKeyDown );
			node.addEventListener( 'mouseleave', onMouseLeave );
			node.addEventListener( 'dragstart', onDragStart );

			// Save a reference to the node to be used when unmounting.
			ref.current = node;
		},
		[
			isSelected,
			rootClientId,
			index,
			onSelectionStart,
			insertDefaultBlock,
			removeBlock,
			selectBlock,
		]
	);
}
