/**
 * External dependencies
 */
import {
	runOnJS,
	useDerivedValue,
	useSharedValue,
} from 'react-native-reanimated';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useBlockListContext } from '../block-list/block-list-context';
import { getDistanceToNearestEdge } from '../../utils/math';
import useOnBlockDrop from '../use-on-block-drop';

const UPDATE_TARGET_BLOCK_INDEX_THRESHOLD = 20; // In pixels

/** @typedef {import('../../utils/math').WPPoint} WPPoint */

/**
 * The orientation of a block list.
 *
 * @typedef {'horizontal'|'vertical'|undefined} WPBlockListOrientation
 */

/**
 * Given a list of blocks layouts finds the index that a block should be dropped at.
 *
 * @param {Object}                 blocksLayouts Blocks layouts object.
 * @param {WPPoint}                position      The position of the item being dragged.
 * @param {WPBlockListOrientation} orientation   The orientation of a block list.
 * @param {boolean}                isRTL         Check if current locale is RTL.
 *
 * @return {number|undefined} The block index that's closest to the drag position.
 */
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

	// Only enabled for root level blocks.
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

/**
 * @typedef  {Object} WPBlockDropZoneConfig
 * @property {string} rootClientId The root client id for the block list.
 */

/**
 * A React hook that can be used to make a block list handle drag and drop.
 *
 * @param {WPBlockDropZoneConfig} dropZoneConfig configuration data for the drop zone.
 *
 * @return {Object} An object that contains `targetBlockIndex` and the event
 * handlers `onBlockDragOver`, `onBlockDragEnd` and `onBlockDrop`.
 */
export default function useBlockDropZone( {
	// An undefined value represents a top-level block. Default to an empty
	// string for this so that `targetRootClientId` can be easily compared to
	// values returned by the `getRootBlockClientId` selector, which also uses
	// an empty string to represent top-level blocks.
	rootClientId: targetRootClientId = '',
} = {} ) {
	const targetBlockIndex = useSharedValue( null );
	const dragPosition = {
		x: useSharedValue( 0 ),
		y: useSharedValue( 0 ),
	};
	const prevDragPosition = {
		x: useSharedValue( 0 ),
		y: useSharedValue( 0 ),
	};

	const { getBlockListSettings, getSettings } = useSelect( blockEditorStore );
	const { blocksLayouts, getBlockLayoutsOrderedByYCoord } =
		useBlockListContext();

	const getSortedBlocksLayouts = useCallback( () => {
		return getBlockLayoutsOrderedByYCoord( blocksLayouts.current );
		// We use the value of `blocksLayouts` as the dependency.
	}, [ blocksLayouts.current ] );

	const isRTL = getSettings().isRTL;

	const onBlockDrop = useOnBlockDrop();

	const updateTargetBlockIndex = useCallback(
		( event ) => {
			const sortedBlockLayouts = getSortedBlocksLayouts();

			const targetIndex = getNearestBlockIndex(
				sortedBlockLayouts,
				{ x: event.x, y: event.y },
				getBlockListSettings( targetRootClientId )?.orientation,
				isRTL
			);
			if ( targetIndex !== null ) {
				targetBlockIndex.value = targetIndex ?? 0;
			}
		},
		[
			getSortedBlocksLayouts,
			getBlockListSettings,
			targetRootClientId,
			isRTL,
			targetBlockIndex,
		]
	);

	useDerivedValue( () => {
		const x = dragPosition.x.value;
		const y = dragPosition.y.value;
		const prevX = prevDragPosition.x.value;
		const prevY = prevDragPosition.y.value;
		// `updateTargetBlockIndex` performs expensive calculations, so we throttle
		// the call using a offset threshold based on the dragging position.
		if (
			Math.abs( x - prevX ) >= UPDATE_TARGET_BLOCK_INDEX_THRESHOLD ||
			Math.abs( y - prevY ) >= UPDATE_TARGET_BLOCK_INDEX_THRESHOLD
		) {
			runOnJS( updateTargetBlockIndex )( { x, y } );
			prevDragPosition.x.value = x;
			prevDragPosition.y.value = y;
			return true;
		}
		return false;
	} );

	return {
		onBlockDragOver( { x, y } ) {
			dragPosition.x.value = x;
			dragPosition.y.value = y;
		},
		onBlockDragOverWorklet( { x, y } ) {
			'worklet';
			dragPosition.x.value = x;
			dragPosition.y.value = y;
		},
		onBlockDragEnd() {
			targetBlockIndex.value = null;
		},
		onBlockDrop: ( event ) => {
			if ( targetBlockIndex.value !== null ) {
				onBlockDrop( {
					...event,
					targetRootClientId,
					targetBlockIndex: targetBlockIndex.value,
				} );
			}
		},
		targetBlockIndex,
	};
}
