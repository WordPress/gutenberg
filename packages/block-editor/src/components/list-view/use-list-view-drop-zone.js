/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import {
	useThrottle,
	__experimentalUseDropZone as useDropZone,
} from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	getDistanceToNearestEdge,
	isPointContainedByRect,
} from '../../utils/math';
import useOnBlockDrop from '../use-on-block-drop';
import { store as blockEditorStore } from '../../store';

/** @typedef {import('../../utils/math').WPPoint} WPPoint */

/**
 * The type of a drag event.
 *
 * @typedef {'default'|'file'|'html'} WPDragEventType
 */

/**
 * An array representing data for blocks in the DOM used by drag and drop.
 *
 * @typedef {Object} WPListViewDropZoneBlocks
 * @property {string}  clientId                        The client id for the block.
 * @property {string}  rootClientId                    The root client id for the block.
 * @property {number}  blockIndex                      The block's index.
 * @property {Element} element                         The DOM element representing the block.
 * @property {number}  innerBlockCount                 The number of inner blocks the block has.
 * @property {boolean} isDraggedBlock                  Whether the block is currently being dragged.
 * @property {boolean} isExpanded                      Whether the block is expanded in the UI.
 * @property {boolean} canInsertDraggedBlocksAsSibling Whether the dragged block can be a sibling of this block.
 * @property {boolean} canInsertDraggedBlocksAsChild   Whether the dragged block can be a child of this block.
 */

/**
 * An object containing details of a drop target.
 *
 * @typedef {Object} WPListViewDropZoneTarget
 * @property {string}                  blockIndex   The insertion index.
 * @property {string}                  rootClientId The root client id for the block.
 * @property {string|undefined}        clientId     The client id for the block.
 * @property {'top'|'bottom'|'inside'} dropPosition The position relative to the block that the user is dropping to.
 *                                                  'inside' refers to nesting as an inner block.
 */

/**
 * Determines whether the user positioning the dragged block to nest as an
 * inner block.
 *
 * Presently this is determined by whether the cursor is on the right hand side
 * of the block.
 *
 * @param {WPPoint} point The point representing the cursor position when dragging.
 * @param {DOMRect} rect  The rectangle.
 */
function isNestingGesture( point, rect ) {
	const blockCenterX = rect.left + rect.width / 2;
	return point.x > blockCenterX;
}

// Block navigation is always a vertical list, so only allow dropping
// to the above or below a block.
const ALLOWED_DROP_EDGES = [ 'top', 'bottom' ];

/**
 * Given blocks data and the cursor position, compute the drop target.
 *
 * @param {WPListViewDropZoneBlocks} blocksData Data about the blocks in list view.
 * @param {WPPoint}                  position   The point representing the cursor position when dragging.
 *
 * @return {WPListViewDropZoneTarget | undefined} An object containing data about the drop target.
 */
export function getListViewDropTarget( blocksData, position ) {
	let candidateEdge;
	let candidateBlockData;
	let candidateDistance;
	let candidateRect;

	for ( const blockData of blocksData ) {
		if ( blockData.isDraggedBlock ) {
			continue;
		}

		const rect = blockData.element.getBoundingClientRect();
		const [ distance, edge ] = getDistanceToNearestEdge(
			position,
			rect,
			ALLOWED_DROP_EDGES
		);

		const isCursorWithinBlock = isPointContainedByRect( position, rect );
		if (
			candidateDistance === undefined ||
			distance < candidateDistance ||
			isCursorWithinBlock
		) {
			candidateDistance = distance;

			const index = blocksData.indexOf( blockData );
			const previousBlockData = blocksData[ index - 1 ];

			// If dragging near the top of a block and the preceding block
			// is at the same level, use the preceding block as the candidate
			// instead, as later it makes determining a nesting drop easier.
			if (
				edge === 'top' &&
				previousBlockData &&
				previousBlockData.rootClientId === blockData.rootClientId &&
				! previousBlockData.isDraggedBlock
			) {
				candidateBlockData = previousBlockData;
				candidateEdge = 'bottom';
				candidateRect =
					previousBlockData.element.getBoundingClientRect();
			} else {
				candidateBlockData = blockData;
				candidateEdge = edge;
				candidateRect = rect;
			}

			// If the mouse position is within the block, break early
			// as the user would intend to drop either before or after
			// this block.
			//
			// This solves an issue where some rows in the list view
			// tree overlap slightly due to sub-pixel rendering.
			if ( isCursorWithinBlock ) {
				break;
			}
		}
	}

	if ( ! candidateBlockData ) {
		return;
	}

	const isDraggingBelow = candidateEdge === 'bottom';

	// If the user is dragging towards the bottom of the block check whether
	// they might be trying to nest the block as a child.
	// If the block already has inner blocks, and is expanded, this should be treated
	// as nesting since the next block in the tree will be the first child.
	// However, if the block is collapsed, dragging beneath the block should
	// still be allowed, as the next visible block in the tree will be a sibling.
	if (
		isDraggingBelow &&
		candidateBlockData.canInsertDraggedBlocksAsChild &&
		( ( candidateBlockData.innerBlockCount > 0 &&
			candidateBlockData.isExpanded ) ||
			isNestingGesture( position, candidateRect ) )
	) {
		return {
			rootClientId: candidateBlockData.clientId,
			blockIndex: 0,
			dropPosition: 'inside',
		};
	}

	// If dropping as a sibling, but block cannot be inserted in
	// this context, return early.
	if ( ! candidateBlockData.canInsertDraggedBlocksAsSibling ) {
		return;
	}

	const offset = isDraggingBelow ? 1 : 0;
	return {
		rootClientId: candidateBlockData.rootClientId,
		clientId: candidateBlockData.clientId,
		blockIndex: candidateBlockData.blockIndex + offset,
		dropPosition: candidateEdge,
	};
}

/**
 * A react hook for implementing a drop zone in list view.
 *
 * @return {WPListViewDropZoneTarget} The drop target.
 */
export default function useListViewDropZone() {
	const {
		getBlockRootClientId,
		getBlockIndex,
		getBlockCount,
		getDraggedBlockClientIds,
		canInsertBlocks,
	} = useSelect( blockEditorStore );
	const [ target, setTarget ] = useState();
	const { rootClientId: targetRootClientId, blockIndex: targetBlockIndex } =
		target || {};

	const onBlockDrop = useOnBlockDrop( targetRootClientId, targetBlockIndex );

	const draggedBlockClientIds = getDraggedBlockClientIds();
	const throttled = useThrottle(
		useCallback(
			( event, currentTarget ) => {
				const position = { x: event.clientX, y: event.clientY };
				const isBlockDrag = !! draggedBlockClientIds?.length;

				const blockElements = Array.from(
					currentTarget.querySelectorAll( '[data-block]' )
				);

				const blocksData = blockElements.map( ( blockElement ) => {
					const clientId = blockElement.dataset.block;
					const isExpanded = blockElement.dataset.expanded === 'true';
					const rootClientId = getBlockRootClientId( clientId );

					return {
						clientId,
						isExpanded,
						rootClientId,
						blockIndex: getBlockIndex( clientId ),
						element: blockElement,
						isDraggedBlock: isBlockDrag
							? draggedBlockClientIds.includes( clientId )
							: false,
						innerBlockCount: getBlockCount( clientId ),
						canInsertDraggedBlocksAsSibling: isBlockDrag
							? canInsertBlocks(
									draggedBlockClientIds,
									rootClientId
							  )
							: true,
						canInsertDraggedBlocksAsChild: isBlockDrag
							? canInsertBlocks( draggedBlockClientIds, clientId )
							: true,
					};
				} );

				const newTarget = getListViewDropTarget( blocksData, position );

				if ( newTarget ) {
					setTarget( newTarget );
				}
			},
			[ draggedBlockClientIds ]
		),
		200
	);

	const ref = useDropZone( {
		onDrop: onBlockDrop,
		onDragOver( event ) {
			// `currentTarget` is only available while the event is being
			// handled, so get it now and pass it to the thottled function.
			// https://developer.mozilla.org/en-US/docs/Web/API/Event/currentTarget
			throttled( event, event.currentTarget );
		},
		onDragEnd() {
			throttled.cancel();
			setTarget( null );
		},
	} );

	return { ref, target };
}
