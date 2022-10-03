/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import {
	useThrottle,
	__experimentalUseDropZone as useDropZone,
} from '@wordpress/compose';
import { isRTL } from '@wordpress/i18n';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import useOnBlockDrop from '../use-on-block-drop';
import {
	getDistanceToNearestEdge,
	isPointContainedByRect,
} from '../../utils/math';
import { store as blockEditorStore } from '../../store';

/** @typedef {import('../../utils/math').WPPoint} WPPoint */
/** @typedef {import('../use-on-block-drop/types').WPDropOperation} WPDropOperation */

/**
 * The orientation of a block list.
 *
 * @typedef {'horizontal'|'vertical'|undefined} WPBlockListOrientation
 */

/**
 * The insert position when dropping a block.
 *
 * @typedef {'before'|'after'} WPInsertPosition
 */

/**
 * Given a list of block DOM elements finds the index that a block should be dropped
 * at.
 *
 * @param {Element[]}              elements    Array of DOM elements that represent each block in a block list.
 * @param {WPPoint}                position    The position of the item being dragged.
 * @param {WPBlockListOrientation} orientation The orientation of a block list.
 *
 * @return {[number|undefined, WPInsertPosition]} The block index and the position that's closest to the drag position.
 */
export function getNearestBlockIndex( elements, position, orientation ) {
	const allowedEdges =
		orientation === 'horizontal'
			? [ 'left', 'right' ]
			: [ 'top', 'bottom' ];

	const isRightToLeft = isRTL();

	let candidateIndex;
	let candidatePosition = 'after';
	let candidateDistance;

	elements.forEach( ( element, index ) => {
		const rect = element.getBoundingClientRect();

		let [ distance, edge ] = getDistanceToNearestEdge(
			position,
			rect,
			allowedEdges
		);
		// Prioritize the element if the point is inside of it.
		if ( isPointContainedByRect( position, rect ) ) {
			distance = 0;
		}

		if ( candidateDistance === undefined || distance < candidateDistance ) {
			// Where the dropped block will be inserted on the nearest block.
			candidatePosition =
				edge === 'bottom' ||
				( ! isRightToLeft && edge === 'right' ) ||
				( isRightToLeft && edge === 'left' )
					? 'after'
					: 'before';

			// Update the currently known best candidate.
			candidateDistance = distance;
			candidateIndex = index;
		}
	} );

	return [ candidateIndex, candidatePosition ];
}

/**
 * Get the drop target index and operation based on the the blocks and the nearst block index.
 *
 * @param {number|undefined} nearestIndex   The nearest block index calculated by getNearestBlockIndex.
 * @param {WPInsertPosition} insertPosition Whether to insert before or after the nearestIndex.
 * @param {WPBlock[]}        blocks         The blocks list.
 * @return {[number, WPDropOperation]} The drop target.
 */
export function getDropTargetIndexAndOperation(
	nearestIndex,
	insertPosition,
	blocks
) {
	const adjacentIndex =
		nearestIndex + ( insertPosition === 'after' ? 1 : -1 );
	const nearestBlock = blocks[ nearestIndex ];
	const adjacentBlock = blocks[ adjacentIndex ];
	const isNearestBlockUnmodifiedDefaultBlock =
		!! nearestBlock && isUnmodifiedDefaultBlock( nearestBlock );
	const isAdjacentBlockUnmodifiedDefaultBlock =
		!! adjacentBlock && isUnmodifiedDefaultBlock( adjacentBlock );

	// If both blocks are not unmodified default blocks then just insert between them.
	if (
		! isNearestBlockUnmodifiedDefaultBlock &&
		! isAdjacentBlockUnmodifiedDefaultBlock
	) {
		// If the user is dropping to the trailing edge of the block
		// add 1 to the index to represent dragging after.
		const insertionIndex =
			insertPosition === 'after' ? nearestIndex + 1 : nearestIndex;
		return [ insertionIndex, 'insert' ];
	}

	// Otherwise, replace the nearest unmodified default block.
	return [
		isNearestBlockUnmodifiedDefaultBlock ? nearestIndex : adjacentIndex,
		'replace',
	];
}

/**
 * @typedef  {Object} WPBlockDropZoneConfig
 * @property {string} rootClientId The root client id for the block list.
 */

/**
 * A React hook that can be used to make a block list handle drag and drop.
 *
 * @param {WPBlockDropZoneConfig} dropZoneConfig configuration data for the drop zone.
 */
export default function useBlockDropZone( {
	// An undefined value represents a top-level block. Default to an empty
	// string for this so that `targetRootClientId` can be easily compared to
	// values returned by the `getRootBlockClientId` selector, which also uses
	// an empty string to represent top-level blocks.
	rootClientId: targetRootClientId = '',
} = {} ) {
	const [ dropTarget, setDropTarget ] = useState( {
		index: null,
		operation: 'insert',
	} );

	const isDisabled = useSelect(
		( select ) => {
			const {
				getTemplateLock,
				__unstableIsWithinBlockOverlay,
				__unstableHasActiveBlockOverlayActive,
			} = select( blockEditorStore );
			const templateLock = getTemplateLock( targetRootClientId );
			return (
				[ 'all', 'contentOnly' ].some(
					( lock ) => lock === templateLock
				) ||
				__unstableHasActiveBlockOverlayActive( targetRootClientId ) ||
				__unstableIsWithinBlockOverlay( targetRootClientId )
			);
		},
		[ targetRootClientId ]
	);

	const { getBlockListSettings, getBlocks } = useSelect( blockEditorStore );
	const { showInsertionPoint, hideInsertionPoint } =
		useDispatch( blockEditorStore );

	const onBlockDrop = useOnBlockDrop( targetRootClientId, dropTarget.index, {
		operation: dropTarget.operation,
	} );
	const throttled = useThrottle(
		useCallback(
			( event, currentTarget ) => {
				const blockElements = Array.from(
					currentTarget.children
				).filter(
					// Ensure the element is a block. It should have the `wp-block` class.
					( element ) => element.classList.contains( 'wp-block' )
				);
				// The second value in the tuple is only needed afterwards but we don't want to recalculate it.
				// eslint-disable-next-line @wordpress/no-unused-vars-before-return
				const [ nearestBlockIndex, insertPosition ] =
					getNearestBlockIndex(
						blockElements,
						{ x: event.clientX, y: event.clientY },
						getBlockListSettings( targetRootClientId )?.orientation
					);

				// The block list is empty, don't show the insertion point but still allow dropping.
				if ( nearestBlockIndex === undefined ) {
					setDropTarget( {
						index: 0,
						operation: 'insert',
					} );
					return;
				}

				const blocks = getBlocks( targetRootClientId );
				const [ targetIndex, operation ] =
					getDropTargetIndexAndOperation(
						nearestBlockIndex,
						insertPosition,
						blocks
					);

				setDropTarget( {
					index: targetIndex,
					operation,
				} );
				showInsertionPoint( targetRootClientId, targetIndex, {
					operation,
				} );
			},
			[ targetRootClientId ]
		),
		200
	);

	return useDropZone( {
		isDisabled,
		onDrop: onBlockDrop,
		onDragOver( event ) {
			// `currentTarget` is only available while the event is being
			// handled, so get it now and pass it to the thottled function.
			// https://developer.mozilla.org/en-US/docs/Web/API/Event/currentTarget
			throttled( event, event.currentTarget );
		},
		onDragLeave() {
			throttled.cancel();
			hideInsertionPoint();
		},
		onDragEnd() {
			throttled.cancel();
			hideInsertionPoint();
		},
	} );
}
