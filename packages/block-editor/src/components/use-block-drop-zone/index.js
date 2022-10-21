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
import { isUnmodifiedDefaultBlock as getIsUnmodifiedDefaultBlock } from '@wordpress/blocks';

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
 * @typedef {Object} WPBlockData
 * @property {boolean}       isUnmodifiedDefaultBlock Is the block unmodified default block.
 * @property {() => DOMRect} getBoundingClientRect    Get the bounding client rect of the block.
 * @property {number}        blockIndex               The index of the block.
 */

/**
 * Get the drop target position from a given drop point and the orientation.
 *
 * @param {WPBlockData[]}          blocksData  The block data list.
 * @param {WPPoint}                position    The position of the item being dragged.
 * @param {WPBlockListOrientation} orientation The orientation of the block list.
 * @return {[number, WPDropOperation]} The drop target position.
 */
export function getDropTargetPosition(
	blocksData,
	position,
	orientation = 'vertical'
) {
	const allowedEdges =
		orientation === 'horizontal'
			? [ 'left', 'right' ]
			: [ 'top', 'bottom' ];

	const isRightToLeft = isRTL();

	let nearestIndex = 0;
	let insertPosition = 'before';
	let minDistance = Infinity;

	blocksData.forEach(
		( { isUnmodifiedDefaultBlock, getBoundingClientRect, blockIndex } ) => {
			const rect = getBoundingClientRect();

			let [ distance, edge ] = getDistanceToNearestEdge(
				position,
				rect,
				allowedEdges
			);
			// Prioritize the element if the point is inside of an unmodified default block.
			if (
				isUnmodifiedDefaultBlock &&
				isPointContainedByRect( position, rect )
			) {
				distance = 0;
			}

			if ( distance < minDistance ) {
				// Where the dropped block will be inserted on the nearest block.
				insertPosition =
					edge === 'bottom' ||
					( ! isRightToLeft && edge === 'right' ) ||
					( isRightToLeft && edge === 'left' )
						? 'after'
						: 'before';

				// Update the currently known best candidate.
				minDistance = distance;
				nearestIndex = blockIndex;
			}
		}
	);

	const adjacentIndex =
		nearestIndex + ( insertPosition === 'after' ? 1 : -1 );
	const isNearestBlockUnmodifiedDefaultBlock =
		!! blocksData[ nearestIndex ]?.isUnmodifiedDefaultBlock;
	const isAdjacentBlockUnmodifiedDefaultBlock =
		!! blocksData[ adjacentIndex ]?.isUnmodifiedDefaultBlock;

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

	const { getBlockListSettings, getBlocks, getBlockIndex } =
		useSelect( blockEditorStore );
	const { showInsertionPoint, hideInsertionPoint } =
		useDispatch( blockEditorStore );

	const onBlockDrop = useOnBlockDrop( targetRootClientId, dropTarget.index, {
		operation: dropTarget.operation,
	} );
	const throttled = useThrottle(
		useCallback(
			( event, ownerDocument ) => {
				const blocks = getBlocks( targetRootClientId );

				// The block list is empty, don't show the insertion point but still allow dropping.
				if ( blocks.length === 0 ) {
					setDropTarget( {
						index: 0,
						operation: 'insert',
					} );
					return;
				}

				const blocksData = blocks.map( ( block ) => {
					const clientId = block.clientId;

					return {
						isUnmodifiedDefaultBlock:
							getIsUnmodifiedDefaultBlock( block ),
						getBoundingClientRect: () =>
							ownerDocument
								.getElementById( `block-${ clientId }` )
								.getBoundingClientRect(),
						blockIndex: getBlockIndex( clientId ),
					};
				} );

				const [ targetIndex, operation ] = getDropTargetPosition(
					blocksData,
					{ x: event.clientX, y: event.clientY },
					getBlockListSettings( targetRootClientId )?.orientation
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
			throttled( event, event.currentTarget.ownerDocument );
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
