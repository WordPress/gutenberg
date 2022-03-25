/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { useThrottle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useBlockListContext } from '../block-list/block-list-context';
import { getDistanceToNearestEdge } from '../../utils/math';

export function getNearestBlockIndex(
	blocksLayouts,
	position,
	orientation,
	isRTL
) {
	const allowedEdges =
		orientation === 'horizontal'
			? [ 'left', 'right' ]
			: [ 'top', 'bottom' ];

	const isRightToLeft = isRTL;

	let candidateIndex;
	let candidateDistance;

	// Only enabled for root level blocks
	blocksLayouts.forEach( ( element, index ) => {
		const { x, y, width, height } = element;
		const rect = {
			x: element.x,
			y: element.y,
			top: y,
			right: x + width,
			bottom: y + height,
			left: x,
			width,
			height,
		};
		const [ distance, edge ] = getDistanceToNearestEdge(
			position,
			rect,
			allowedEdges
		);

		if ( candidateDistance === undefined || distance < candidateDistance ) {
			// If the user is dropping to the trailing edge of the block
			// add 1 to the index to represent dragging after.
			// Take RTL languages into account where the left edge is
			// the trailing edge.
			const isTrailingEdge =
				edge === 'bottom' ||
				( ! isRightToLeft && edge === 'right' ) ||
				( isRightToLeft && edge === 'left' );
			const offset = isTrailingEdge ? 1 : 0;

			// Update the currently known best candidate.
			candidateDistance = distance;
			candidateIndex = index + offset;
		}
	} );
	return candidateIndex;
}

export default function useBlockDropZone( {
	// An undefined value represents a top-level block. Default to an empty
	// string for this so that `targetRootClientId` can be easily compared to
	// values returned by the `getRootBlockClientId` selector, which also uses
	// an empty string to represent top-level blocks.
	rootClientId: targetRootClientId = '',
} = {} ) {
	// eslint-disable-next-line no-unused-vars
	const [ targetBlockIndex, setTargetBlockIndex ] = useState( null );

	const { getBlockListSettings, getSettings } = useSelect( blockEditorStore );
	const { showInsertionPoint, hideInsertionPoint } = useDispatch(
		blockEditorStore
	);
	const {
		blocksLayouts,
		getBlockLayoutsOrderedByYCoord,
	} = useBlockListContext();

	const getSortedBlocksLayouts = useCallback( () => {
		return getBlockLayoutsOrderedByYCoord( blocksLayouts.current );
	}, [ blocksLayouts.current ] );

	const isRTL = getSettings().isRTL;

	//const onBlockDrop = useOnBlockDrop( targetRootClientId, targetBlockIndex );
	const throttled = useThrottle(
		useCallback(
			( event ) => {
				const sortedBlockLayouts = getSortedBlocksLayouts();

				const targetIndex = getNearestBlockIndex(
					sortedBlockLayouts,
					{ x: event.x, y: event.y },
					getBlockListSettings( targetRootClientId )?.orientation,
					isRTL
				);
				//setTargetBlockIndex( targetIndex === undefined ? 0 : targetIndex );
				if ( targetIndex !== null ) {
					showInsertionPoint( targetRootClientId, targetIndex );
				}
			},
			[ getSortedBlocksLayouts ]
		),
		200
	);

	return {
		onBlockDragOver( event ) {
			throttled( event );
		},
		onBlockDragEnd() {
			throttled.cancel();
			hideInsertionPoint();
			setTargetBlockIndex( null );
		},
	};
}
