/**
 * WordPress dependencies
 */
import { ENTER, BACKSPACE, DELETE } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { getDefaultBlockName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

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
		canInsertBlockType,
		getNextBlockClientId,
		getBlockOrder,
		getBlockEditingMode,
	} = useSelect( blockEditorStore );
	const { insertAfterBlock, removeBlock, selectBlock } =
		useDispatch( blockEditorStore );

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

				if ( event.defaultPrevented ) {
					return;
				}

				if (
					keyCode !== ENTER &&
					keyCode !== BACKSPACE &&
					keyCode !== DELETE
				) {
					return;
				}

				if ( target !== node ) {
					return;
				}

				event.preventDefault();

				if ( keyCode === ENTER ) {
					const rootClientId = getBlockRootClientId( clientId );
					if (
						canInsertBlockType(
							getDefaultBlockName(),
							rootClientId
						)
					) {
						insertAfterBlock( clientId );
					} else {
						function getNextClientId( id ) {
							let nextClientId = null;

							while (
								typeof id === 'string' &&
								! ( nextClientId = getNextBlockClientId( id ) )
							) {
								id = getBlockRootClientId( id );
							}

							return nextClientId;
						}

						let nextClientId =
							getBlockOrder( clientId )[ 0 ] ??
							getNextClientId( clientId );

						while (
							nextClientId &&
							getBlockEditingMode( nextClientId ) === 'disabled'
						) {
							nextClientId = getNextClientId( nextClientId );
						}

						if ( nextClientId ) {
							selectBlock( nextClientId );
						}
					}
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
		]
	);
}
