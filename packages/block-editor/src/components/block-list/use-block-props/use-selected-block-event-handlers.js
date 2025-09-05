/**
 * WordPress dependencies
 */
import { isTextField } from '@wordpress/dom';
import { ENTER, BACKSPACE, DELETE } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { createRoot } from '@wordpress/element';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import BlockDraggableChip from '../../../components/block-draggable/draggable-chip';

/**
 * Adds block behaviour:
 *   - Removes the block on BACKSPACE.
 *   - Inserts a default block on ENTER.
 *   - Disables dragging of block contents.
 *
 * @param {string} clientId Block client ID.
 */
export function useEventHandlers( { clientId, isSelected } ) {
	const { getBlockType } = useSelect( blocksStore );
	const { getBlockRootClientId, isZoomOut, hasMultiSelection, getBlockName } =
		unlock( useSelect( blockEditorStore ) );
	const {
		insertAfterBlock,
		removeBlock,
		resetZoomLevel,
		startDraggingBlocks,
		stopDraggingBlocks,
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

				if ( keyCode === ENTER && isZoomOut() ) {
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
				if (
					node !== event.target ||
					node.isContentEditable ||
					node.ownerDocument.activeElement !== node ||
					hasMultiSelection()
				) {
					event.preventDefault();
					return;
				}
				const data = JSON.stringify( {
					type: 'block',
					srcClientIds: [ clientId ],
					srcRootClientId: getBlockRootClientId( clientId ),
				} );
				event.dataTransfer.effectAllowed = 'move'; // remove "+" cursor
				event.dataTransfer.clearData();
				event.dataTransfer.setData( 'wp-blocks', data );
				const { ownerDocument } = node;
				const { defaultView } = ownerDocument;
				const selection = defaultView.getSelection();
				selection.removeAllRanges();

				const domNode = document.createElement( 'div' );
				const root = createRoot( domNode );
				root.render(
					<BlockDraggableChip
						icon={ getBlockType( getBlockName( clientId ) ).icon }
					/>
				);
				document.body.appendChild( domNode );
				domNode.style.position = 'absolute';
				domNode.style.top = '0';
				domNode.style.left = '0';
				domNode.style.zIndex = '1000';
				domNode.style.pointerEvents = 'none';

				// Setting the drag chip as the drag image actually works, but
				// the behaviour is slightly different in every browser. In
				// Safari, it animates, in Firefox it's slightly transparent...
				// So we set a fake drag image and have to reposition it
				// ourselves.
				const dragElement = ownerDocument.createElement( 'div' );
				// Chrome will show a globe icon if the drag element does not
				// have dimensions.
				dragElement.style.width = '1px';
				dragElement.style.height = '1px';
				dragElement.style.position = 'fixed';
				dragElement.style.visibility = 'hidden';
				ownerDocument.body.appendChild( dragElement );
				event.dataTransfer.setDragImage( dragElement, 0, 0 );

				let offset = { x: 0, y: 0 };

				if ( document !== ownerDocument ) {
					const frame = defaultView.frameElement;
					if ( frame ) {
						const rect = frame.getBoundingClientRect();
						offset = { x: rect.left, y: rect.top };
					}
				}

				// chip handle offset
				offset.x -= 58;

				function over( e ) {
					domNode.style.transform = `translate( ${
						e.clientX + offset.x
					}px, ${ e.clientY + offset.y }px )`;
				}

				over( event );

				function end() {
					ownerDocument.removeEventListener( 'dragover', over );
					ownerDocument.removeEventListener( 'dragend', end );
					domNode.remove();
					dragElement.remove();
					stopDraggingBlocks();
					document.body.classList.remove(
						'is-dragging-components-draggable'
					);
					ownerDocument.documentElement.classList.remove(
						'is-dragging'
					);
				}

				ownerDocument.addEventListener( 'dragover', over );
				ownerDocument.addEventListener( 'dragend', end );
				ownerDocument.addEventListener( 'drop', end );

				startDraggingBlocks( [ clientId ] );
				// Important because it hides the block toolbar.
				document.body.classList.add(
					'is-dragging-components-draggable'
				);
				ownerDocument.documentElement.classList.add( 'is-dragging' );
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
			insertAfterBlock,
			removeBlock,
			isZoomOut,
			resetZoomLevel,
			hasMultiSelection,
			startDraggingBlocks,
			stopDraggingBlocks,
		]
	);
}
