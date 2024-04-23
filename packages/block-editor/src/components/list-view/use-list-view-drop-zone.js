/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useCallback, useEffect } from '@wordpress/element';
import {
	useThrottle,
	__experimentalUseDropZone as useDropZone,
	usePrevious,
} from '@wordpress/compose';
import { isRTL } from '@wordpress/i18n';

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
 * An object representing data for blocks in the DOM used by drag and drop.
 *
 * @typedef {Object} WPListViewDropZoneBlock
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
 * An array representing data for blocks in the DOM used by drag and drop.
 *
 * @typedef {WPListViewDropZoneBlock[]} WPListViewDropZoneBlocks
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

// When the indentation level, the corresponding left margin in `style.scss`
// must be updated as well to ensure the drop zone is aligned with the indentation.
export const NESTING_LEVEL_INDENTATION = 24;

/**
 * Determines whether the user is positioning the dragged block to be
 * moved up to a parent level.
 *
 * Determined based on nesting level indentation of the current block.
 *
 * @param {WPPoint} point        The point representing the cursor position when dragging.
 * @param {DOMRect} rect         The rectangle.
 * @param {number}  nestingLevel The nesting level of the block.
 * @param {boolean} rtl          Whether the editor is in RTL mode.
 * @return {boolean} Whether the gesture is an upward gesture.
 */
function isUpGesture( point, rect, nestingLevel = 1, rtl = false ) {
	// If the block is nested, and the user is dragging to the bottom
	// left of the block (or bottom right in RTL languages), then it is an upward gesture.
	const blockIndentPosition = rtl
		? rect.right - nestingLevel * NESTING_LEVEL_INDENTATION
		: rect.left + nestingLevel * NESTING_LEVEL_INDENTATION;
	return rtl ? point.x > blockIndentPosition : point.x < blockIndentPosition;
}

/**
 * Returns how many nesting levels up the user is attempting to drag to.
 *
 * The relative parent level is calculated based on how far
 * the cursor is from the provided nesting level (e.g. of a candidate block
 * that the user is hovering over). The nesting level is considered "desired"
 * because it is not guaranteed that the user will be able to drag to the desired level.
 *
 * The returned integer can be used to access an ascending array
 * of parent blocks, where the first item is the block the user
 * is hovering over, and the last item is the root block.
 *
 * @param {WPPoint} point        The point representing the cursor position when dragging.
 * @param {DOMRect} rect         The rectangle.
 * @param {number}  nestingLevel The nesting level of the block.
 * @param {boolean} rtl          Whether the editor is in RTL mode.
 * @return {number} The desired relative parent level.
 */
function getDesiredRelativeParentLevel(
	point,
	rect,
	nestingLevel = 1,
	rtl = false
) {
	// In RTL languages, the block indent position is from the right edge of the block.
	// In LTR languages, the block indent position is from the left edge of the block.
	const blockIndentPosition = rtl
		? rect.right - nestingLevel * NESTING_LEVEL_INDENTATION
		: rect.left + nestingLevel * NESTING_LEVEL_INDENTATION;

	const distanceBetweenPointAndBlockIndentPosition = rtl
		? blockIndentPosition - point.x
		: point.x - blockIndentPosition;

	const desiredParentLevel = Math.round(
		distanceBetweenPointAndBlockIndentPosition / NESTING_LEVEL_INDENTATION
	);

	return Math.abs( desiredParentLevel );
}

/**
 * Returns an array of the parent blocks of the block the user is dropping to.
 *
 * @param {WPListViewDropZoneBlock}  candidateBlockData The block the user is dropping to.
 * @param {WPListViewDropZoneBlocks} blocksData         Data about the blocks in list view.
 * @return {WPListViewDropZoneBlocks} An array of block parents, including the block the user is dropping to.
 */
function getCandidateBlockParents( candidateBlockData, blocksData ) {
	const candidateBlockParents = [];
	let currentBlockData = candidateBlockData;

	while ( currentBlockData ) {
		candidateBlockParents.push( { ...currentBlockData } );
		currentBlockData = blocksData.find(
			( blockData ) =>
				blockData.clientId === currentBlockData.rootClientId
		);
	}

	return candidateBlockParents;
}

/**
 * Given a list of blocks data and a block index, return the next non-dragged
 * block. This is used to determine the block that the user is dropping to,
 * while ignoring the dragged block.
 *
 * @param {WPListViewDropZoneBlocks} blocksData Data about the blocks in list view.
 * @param {number}                   index      The index to begin searching from.
 * @return {WPListViewDropZoneBlock | undefined} The next non-dragged block.
 */
function getNextNonDraggedBlock( blocksData, index ) {
	const nextBlockData = blocksData[ index + 1 ];
	if ( nextBlockData && nextBlockData.isDraggedBlock ) {
		return getNextNonDraggedBlock( blocksData, index + 1 );
	}

	return nextBlockData;
}

/**
 * Determines whether the user positioning the dragged block to nest as an
 * inner block.
 *
 * Determined based on nesting level indentation of the current block, plus
 * the indentation of the next level of nesting. The vertical position of the
 * cursor must also be within the block.
 *
 * @param {WPPoint} point        The point representing the cursor position when dragging.
 * @param {DOMRect} rect         The rectangle.
 * @param {number}  nestingLevel The nesting level of the block.
 * @param {boolean} rtl          Whether the editor is in RTL mode.
 */
function isNestingGesture( point, rect, nestingLevel = 1, rtl = false ) {
	const blockIndentPosition = rtl
		? rect.right - nestingLevel * NESTING_LEVEL_INDENTATION
		: rect.left + nestingLevel * NESTING_LEVEL_INDENTATION;

	const isNestingHorizontalGesture = rtl
		? point.x < blockIndentPosition - NESTING_LEVEL_INDENTATION
		: point.x > blockIndentPosition + NESTING_LEVEL_INDENTATION;

	return isNestingHorizontalGesture && point.y < rect.bottom;
}

// Block navigation is always a vertical list, so only allow dropping
// to the above or below a block.
const ALLOWED_DROP_EDGES = [ 'top', 'bottom' ];

/**
 * Given blocks data and the cursor position, compute the drop target.
 *
 * @param {WPListViewDropZoneBlocks} blocksData Data about the blocks in list view.
 * @param {WPPoint}                  position   The point representing the cursor position when dragging.
 * @param {boolean}                  rtl        Whether the editor is in RTL mode.
 *
 * @return {WPListViewDropZoneTarget | undefined} An object containing data about the drop target.
 */
export function getListViewDropTarget( blocksData, position, rtl = false ) {
	let candidateEdge;
	let candidateBlockData;
	let candidateDistance;
	let candidateRect;
	let candidateBlockIndex;

	for ( let i = 0; i < blocksData.length; i++ ) {
		const blockData = blocksData[ i ];
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
				candidateBlockIndex = index - 1;
			} else {
				candidateBlockData = blockData;
				candidateEdge = edge;
				candidateRect = rect;
				candidateBlockIndex = index;
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

	const candidateBlockParents = getCandidateBlockParents(
		candidateBlockData,
		blocksData
	);

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
			isNestingGesture(
				position,
				candidateRect,
				candidateBlockParents.length,
				rtl
			) )
	) {
		// If the block is expanded, insert the block as the first child.
		// Otherwise, for collapsed blocks, insert the block as the last child.
		const newBlockIndex = candidateBlockData.isExpanded
			? 0
			: candidateBlockData.innerBlockCount || 0;

		return {
			rootClientId: candidateBlockData.clientId,
			clientId: candidateBlockData.clientId,
			blockIndex: newBlockIndex,
			dropPosition: 'inside',
		};
	}

	// If the user is dragging towards the bottom of the block check whether
	// they might be trying to move the block to be at a parent level.
	if (
		isDraggingBelow &&
		candidateBlockData.rootClientId &&
		isUpGesture(
			position,
			candidateRect,
			candidateBlockParents.length,
			rtl
		)
	) {
		const nextBlock = getNextNonDraggedBlock(
			blocksData,
			candidateBlockIndex
		);
		const currentLevel = candidateBlockData.nestingLevel;
		const nextLevel = nextBlock ? nextBlock.nestingLevel : 1;

		if ( currentLevel && nextLevel ) {
			// Determine the desired relative level of the block to be dropped.
			const desiredRelativeLevel = getDesiredRelativeParentLevel(
				position,
				candidateRect,
				candidateBlockParents.length,
				rtl
			);

			const targetParentIndex = Math.max(
				Math.min( desiredRelativeLevel, currentLevel - nextLevel ),
				0
			);

			if ( candidateBlockParents[ targetParentIndex ] ) {
				// Default to the block index of the candidate block.
				let newBlockIndex = candidateBlockData.blockIndex;

				// If the next block is at the same level, use that as the default
				// block index. This ensures that the block is dropped in the correct
				// position when dragging to the bottom of a block.
				if (
					candidateBlockParents[ targetParentIndex ].nestingLevel ===
					nextBlock?.nestingLevel
				) {
					newBlockIndex = nextBlock?.blockIndex;
				} else {
					// Otherwise, search from the current block index back
					// to find the last block index within the same target parent.
					for ( let i = candidateBlockIndex; i >= 0; i-- ) {
						const blockData = blocksData[ i ];
						if (
							blockData.rootClientId ===
							candidateBlockParents[ targetParentIndex ]
								.rootClientId
						) {
							newBlockIndex = blockData.blockIndex + 1;
							break;
						}
					}
				}

				return {
					rootClientId:
						candidateBlockParents[ targetParentIndex ].rootClientId,
					clientId: candidateBlockData.clientId,
					blockIndex: newBlockIndex,
					dropPosition: candidateEdge,
				};
			}
		}
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

// Throttle options need to be defined outside of the hook to avoid
// re-creating the object on every render. This is due to a limitation
// of the `useThrottle` hook, where the options object is included
// in the dependency array for memoization.
const EXPAND_THROTTLE_OPTIONS = {
	leading: false, // Don't call the function immediately on the first call.
	trailing: true, // Do call the function on the last call.
};

/**
 * A react hook for implementing a drop zone in list view.
 *
 * @param {Object}       props                    Named parameters.
 * @param {?HTMLElement} [props.dropZoneElement]  Optional element to be used as the drop zone.
 * @param {Object}       [props.expandedState]    The expanded state of the blocks in the list view.
 * @param {Function}     [props.setExpandedState] Function to set the expanded state of a list of block clientIds.
 *
 * @return {WPListViewDropZoneTarget} The drop target.
 */
export default function useListViewDropZone( {
	dropZoneElement,
	expandedState,
	setExpandedState,
} ) {
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

	const rtl = isRTL();

	const previousRootClientId = usePrevious( targetRootClientId );

	const maybeExpandBlock = useCallback(
		( _expandedState, _target ) => {
			// If the user is attempting to drop a block inside a collapsed block,
			// that is, using a nesting gesture flagged by 'inside' dropPosition,
			// expand the block within the list view, if it isn't already.
			const { rootClientId } = _target || {};
			if ( ! rootClientId ) {
				return;
			}
			if (
				_target?.dropPosition === 'inside' &&
				! _expandedState[ rootClientId ]
			) {
				setExpandedState( {
					type: 'expand',
					clientIds: [ rootClientId ],
				} );
			}
		},
		[ setExpandedState ]
	);

	// Throttle the maybeExpandBlock function to avoid expanding the block
	// too quickly when the user is dragging over the block. This is to
	// avoid expanding the block when the user is just passing over it.
	const throttledMaybeExpandBlock = useThrottle(
		maybeExpandBlock,
		500,
		EXPAND_THROTTLE_OPTIONS
	);

	useEffect( () => {
		if (
			target?.dropPosition !== 'inside' ||
			previousRootClientId !== target?.rootClientId
		) {
			throttledMaybeExpandBlock.cancel();
			return;
		}
		throttledMaybeExpandBlock( expandedState, target );
	}, [
		expandedState,
		previousRootClientId,
		target,
		throttledMaybeExpandBlock,
	] );

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
					const isDraggedBlock =
						blockElement.classList.contains( 'is-dragging' );

					// Get nesting level from `aria-level` attribute because Firefox does not support `element.ariaLevel`.
					const nestingLevel = parseInt(
						blockElement.getAttribute( 'aria-level' ),
						10
					);
					const rootClientId = getBlockRootClientId( clientId );

					return {
						clientId,
						isExpanded,
						rootClientId,
						blockIndex: getBlockIndex( clientId ),
						element: blockElement,
						nestingLevel: nestingLevel || undefined,
						isDraggedBlock: isBlockDrag ? isDraggedBlock : false,
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

				const newTarget = getListViewDropTarget(
					blocksData,
					position,
					rtl
				);

				if ( newTarget ) {
					setTarget( newTarget );
				}
			},
			[
				canInsertBlocks,
				draggedBlockClientIds,
				getBlockCount,
				getBlockIndex,
				getBlockRootClientId,
				rtl,
			]
		),
		50
	);

	const ref = useDropZone( {
		dropZoneElement,
		onDrop( event ) {
			throttled.cancel();
			if ( target ) {
				onBlockDrop( event );
			}
			// Use `undefined` value to indicate that the drag has concluded.
			// This allows styling rules that are active only when a user is
			// dragging to be removed.
			setTarget( undefined );
		},
		onDragLeave() {
			throttled.cancel();
			// Use `null` value to indicate that the drop target is not valid,
			// but that the drag is still active. This allows for styling rules
			// that are active only when a user drags outside of the list view.
			setTarget( null );
		},
		onDragOver( event ) {
			// `currentTarget` is only available while the event is being
			// handled, so get it now and pass it to the thottled function.
			// https://developer.mozilla.org/en-US/docs/Web/API/Event/currentTarget
			throttled( event, event.currentTarget );
		},
		onDragEnd() {
			throttled.cancel();
			// Use `undefined` value to indicate that the drag has concluded.
			// This allows styling rules that are active only when a user is
			// dragging to be removed.
			setTarget( undefined );
		},
	} );

	return { ref, target };
}
