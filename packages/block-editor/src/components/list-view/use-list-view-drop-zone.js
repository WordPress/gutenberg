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
function getListViewDropTarget( blocksData, position ) {
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
			targetRect: candidateRect,
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
		targetRect: candidateRect,
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
	const [ source, setSource ] = useState();
	const { rootClientId: targetRootClientId, blockIndex: targetBlockIndex } =
		target || {};

	const onBlockDrop = useOnBlockDrop( targetRootClientId, targetBlockIndex );

	const draggedBlockClientIds = getDraggedBlockClientIds();

	const throttled = useThrottle(
		useCallback(
			( event, currentTarget ) => {
				const position = { x: event.clientX, y: event.clientY };
				const isBlockDrag = !! draggedBlockClientIds?.length;
				const sourceRootClientId = getBlockRootClientId(
					draggedBlockClientIds?.[ 0 ]
				);

				const blockElements = Array.from(
					currentTarget.querySelectorAll( '[data-block]' )
				);

				const blocksData = blockElements.map( ( blockElement ) => {
					const clientId = blockElement.dataset.block;
					const rootClientId = getBlockRootClientId( clientId );

					return {
						clientId,
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

				if ( ! source ) {
					setSource( {
						srcClientIds: draggedBlockClientIds,
						srcRootClientId: sourceRootClientId,
					} );
				}
			},
			[
				canInsertBlocks,
				draggedBlockClientIds,
				getBlockCount,
				getBlockIndex,
				getBlockRootClientId,
				source,
			]
		),
		200
	);

	const handleDropOutsideListView = useCallback(
		( event ) => {
			const { clientX } = event;
			const { x: targetX, width } = target?.targetRect || {};

			// If the mouse is outside the horizontal area of the list view
			// determined by the rect representing the last block that was
			// hovered, return early. This ensure the drop is only
			// triggered when the user is dragging to the top or bottom of
			// the list view.
			if ( clientX < targetX || clientX > targetX + width ) {
				return;
			}

			// Note: this is currently only handling moving blocks.
			// We might need to (somehow) check that we're not attempting to insert here.
			const transferData = {
				type: 'block',
				srcClientIds: source?.srcClientIds || [],
				srcRootClientId: source?.srcRootClientId,
			};

			// Construct a fake event for the drop handler.
			// This is needed because the `dragEnd` event doesn't contain the required data.
			const constructedEvent = {};
			constructedEvent.dataTransfer = new window.DataTransfer();
			constructedEvent.dataTransfer.setData(
				'wp-blocks',
				JSON.stringify( transferData )
			);

			onBlockDrop( constructedEvent );
		},
		[ onBlockDrop, source, target ]
	);

	const ref = useDropZone( {
		onDrop: onBlockDrop,
		onDragOver( event ) {
			// `currentTarget` is only available while the event is being
			// handled, so get it now and pass it to the thottled function.
			// https://developer.mozilla.org/en-US/docs/Web/API/Event/currentTarget
			throttled( event, event.currentTarget );
		},
		onDragEnd( event ) {
			if (
				event.dataTransfer?.dropEffect &&
				event.dataTransfer.dropEffect !== 'none'
			) {
				// If the drop effect is not none, then the drop was not cancelled.
				// Determine whether or not to allow a drop to occur.
				// This allows for a fuzzier drop target at the beginning and
				// end of the block list.
				handleDropOutsideListView( event );
			}

			throttled.cancel();
			setSource( null );
			setTarget( null );
		},
	} );

	return { ref, target };
}
