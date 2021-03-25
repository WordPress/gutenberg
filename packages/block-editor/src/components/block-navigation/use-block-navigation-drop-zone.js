/**
 * WordPress dependencies
 */
import { __unstableUseDropZone as useDropZone } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getDistanceToNearestEdge } from '../../utils/math';
import useOnBlockDrop from '../use-on-block-drop';
import { store as blockEditorStore } from '../../store';

/** @typedef {import('../../utils/math').WPPoint} WPPoint */
/** @typedef {import('@wordpress/element').RefObject} RefObject */

/**
 * The type of a drag event.
 *
 * @typedef {'default'|'file'|'html'} WPDragEventType
 */

/**
 * An array representing data for blocks in the DOM used by drag and drop.
 *
 * @typedef {Object} WPBlockNavigationDropZoneBlocks
 * @property {string}  clientId                        The client id for the block.
 * @property {string}  rootClientId                    The root client id for the block.
 * @property {number}  blockIndex                      The block's index.
 * @property {Element} element                         The DOM element representing the block.
 * @property {number}  innerBlockCount                 The number of inner blocks the block has.
 * @property {boolean} isDraggedBlock                  Whether the block is currently being dragged.
 * @property {boolean} canInsertDraggedBlocksAsSibling Whether the dragged block can be a sibling of this block.
 * @property {boolean} canInsertDraggedBlocksAsChild   Whether the dragged block can be a child of this block.
 */

/**
 * An object containing details of a drop target.
 *
 * @typedef {Object} WPBlockNavigationDropZoneTarget
 * @property {string}                   blockIndex   The insertion index.
 * @property {string}                   rootClientId The root client id for the block.
 * @property {string|undefined}         clientId     The client id for the block.
 * @property {'top'|'bottom'|'inside'}  dropPosition The position relative to the block that the user is dropping to.
 *                                                   'inside' refers to nesting as an inner block.
 */

/**
 * A react hook that returns data about blocks used for computing where a user
 * can drop to when dragging and dropping blocks.
 *
 * @param {Object}          ref           A React ref of a containing element for block navigation.
 * @param {WPPoint}         position      The current drag position.
 * @param {WPDragEventType} dragEventType The drag event type.
 *
 * @return {RefObject<WPBlockNavigationDropZoneBlocks>} A React ref containing the blocks data.
 */
function useDropTargetBlocksData( ref, position, dragEventType ) {
	const {
		getBlockRootClientId,
		getBlockIndex,
		getBlockCount,
		getDraggedBlockClientIds,
		canInsertBlocks,
	} = useSelect( ( select ) => {
		const selectors = select( blockEditorStore );
		return {
			canInsertBlocks: selectors.canInsertBlocks,
			getBlockRootClientId: selectors.getBlockRootClientId,
			getBlockIndex: selectors.getBlockIndex,
			getBlockCount: selectors.getBlockCount,
			getDraggedBlockClientIds: selectors.getDraggedBlockClientIds,
		};
	}, [] );
	const blocksData = useRef();

	// Compute data about blocks only when the user
	// starts dragging, as determined by `hasPosition`.
	const hasPosition = !! position;

	useEffect( () => {
		if ( ! ref.current || ! hasPosition ) {
			return;
		}

		const isBlockDrag = dragEventType === 'default';

		const draggedBlockClientIds = isBlockDrag
			? getDraggedBlockClientIds()
			: undefined;

		const blockElements = Array.from(
			ref.current.querySelectorAll( '[data-block]' )
		);

		blocksData.current = blockElements.map( ( blockElement ) => {
			const clientId = blockElement.dataset.block;
			const rootClientId = getBlockRootClientId( clientId );

			return {
				clientId,
				rootClientId,
				blockIndex: getBlockIndex( clientId, rootClientId ),
				element: blockElement,
				isDraggedBlock: isBlockDrag
					? draggedBlockClientIds.includes( clientId )
					: false,
				innerBlockCount: getBlockCount( clientId ),
				canInsertDraggedBlocksAsSibling: isBlockDrag
					? canInsertBlocks( draggedBlockClientIds, rootClientId )
					: true,
				canInsertDraggedBlocksAsChild: isBlockDrag
					? canInsertBlocks( draggedBlockClientIds, clientId )
					: true,
			};
		} );
	}, [
		// `ref` shouldn't actually change during a drag operation, but
		// is specified for completeness as it's used within the hook.
		ref,
		hasPosition,
		dragEventType,
		canInsertBlocks,
		getBlockCount,
		getBlockIndex,
		getBlockRootClientId,
		getDraggedBlockClientIds,
	] );

	return blocksData;
}

/**
 * Is the point contained by the rectangle.
 *
 * @param {WPPoint} point The point.
 * @param {DOMRect} rect  The rectangle.
 *
 * @return {boolean} True if the point is contained by the rectangle, false otherwise.
 */
function isPointContainedByRect( point, rect ) {
	return (
		rect.left <= point.x &&
		rect.right >= point.x &&
		rect.top <= point.y &&
		rect.bottom >= point.y
	);
}

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
 * @param {WPBlockNavigationDropZoneBlocks} blocksData Data about the blocks in block navigation.
 * @param {WPPoint} position The point representing the cursor position when dragging.
 *
 * @return {WPBlockNavigationDropZoneTarget} An object containing data about the drop target.
 */
function getBlockNavigationDropTarget( blocksData, position ) {
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
				candidateRect = previousBlockData.element.getBoundingClientRect();
			} else {
				candidateBlockData = blockData;
				candidateEdge = edge;
				candidateRect = rect;
			}

			// If the mouse position is within the block, break early
			// as the user would intend to drop either before or after
			// this block.
			//
			// This solves an issue where some rows in the block navigation
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
	// If the block already has inner blocks, this should always be treated
	// as nesting since the next block in the tree will be the first child.
	if (
		isDraggingBelow &&
		candidateBlockData.canInsertDraggedBlocksAsChild &&
		( candidateBlockData.innerBlockCount > 0 ||
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
 * A react hook for implementing a drop zone in block navigation.
 *
 * @param {Object} ref A React ref of a containing element for block navigation.
 *
 * @return {WPBlockNavigationDropZoneTarget} The drop target.
 */
export default function useBlockNavigationDropZone( ref ) {
	const [ target = {}, setTarget ] = useState();
	const {
		rootClientId: targetRootClientId,
		blockIndex: targetBlockIndex,
	} = target;

	const dropEventHandlers = useOnBlockDrop(
		targetRootClientId,
		targetBlockIndex
	);

	const { position, type: dragEventType } = useDropZone( {
		element: ref,
		withPosition: true,
		...dropEventHandlers,
	} );

	const blocksData = useDropTargetBlocksData( ref, position, dragEventType );

	// Calculate the drop target based on the drag position.
	useEffect( () => {
		if ( position ) {
			const newTarget = getBlockNavigationDropTarget(
				blocksData.current,
				position
			);

			if ( newTarget ) {
				setTarget( newTarget );
			}
		}
	}, [ blocksData, position ] );

	if ( position ) {
		return target;
	}
}
