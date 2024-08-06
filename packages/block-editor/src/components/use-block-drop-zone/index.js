/**
 * WordPress dependencies
 */
import { useDispatch, useSelect, useRegistry } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import {
	useThrottle,
	__experimentalUseDropZone as useDropZone,
} from '@wordpress/compose';
import { isRTL } from '@wordpress/i18n';
import {
	isUnmodifiedDefaultBlock as getIsUnmodifiedDefaultBlock,
	store as blocksStore,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import useOnBlockDrop from '../use-on-block-drop';
import {
	getDistanceToNearestEdge,
	isPointContainedByRect,
	isPointWithinTopAndBottomBoundariesOfRect,
} from '../../utils/math';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const THRESHOLD_DISTANCE = 30;
const MINIMUM_HEIGHT_FOR_THRESHOLD = 120;
const MINIMUM_WIDTH_FOR_THRESHOLD = 120;

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
 * @param {Object}                 options     Additional options.
 * @return {[number, WPDropOperation]} The drop target position.
 */
export function getDropTargetPosition(
	blocksData,
	position,
	orientation = 'vertical',
	options = {}
) {
	const allowedEdges =
		orientation === 'horizontal'
			? [ 'left', 'right' ]
			: [ 'top', 'bottom' ];

	let nearestIndex = 0;
	let insertPosition = 'before';
	let minDistance = Infinity;
	let targetBlockIndex = null;
	let nearestSide = 'right';

	const {
		dropZoneElement,
		parentBlockOrientation,
		rootBlockIndex = 0,
	} = options;

	// Allow before/after when dragging over the top/bottom edges of the drop zone.
	if ( dropZoneElement && parentBlockOrientation !== 'horizontal' ) {
		const rect = dropZoneElement.getBoundingClientRect();
		const [ distance, edge ] = getDistanceToNearestEdge( position, rect, [
			'top',
			'bottom',
		] );

		// If dragging over the top or bottom of the drop zone, insert the block
		// before or after the parent block. This only applies to blocks that use
		// a drop zone element, typically container blocks such as Group or Cover.
		if (
			rect.height > MINIMUM_HEIGHT_FOR_THRESHOLD &&
			distance < THRESHOLD_DISTANCE
		) {
			if ( edge === 'top' ) {
				return [ rootBlockIndex, 'before' ];
			}
			if ( edge === 'bottom' ) {
				return [ rootBlockIndex + 1, 'after' ];
			}
		}
	}

	const isRightToLeft = isRTL();

	// Allow before/after when dragging over the left/right edges of the drop zone.
	if ( dropZoneElement && parentBlockOrientation === 'horizontal' ) {
		const rect = dropZoneElement.getBoundingClientRect();
		const [ distance, edge ] = getDistanceToNearestEdge( position, rect, [
			'left',
			'right',
		] );

		// If dragging over the left or right of the drop zone, insert the block
		// before or after the parent block. This only applies to blocks that use
		// a drop zone element, typically container blocks such as Group.
		if (
			rect.width > MINIMUM_WIDTH_FOR_THRESHOLD &&
			distance < THRESHOLD_DISTANCE
		) {
			if (
				( isRightToLeft && edge === 'right' ) ||
				( ! isRightToLeft && edge === 'left' )
			) {
				return [ rootBlockIndex, 'before' ];
			}
			if (
				( isRightToLeft && edge === 'left' ) ||
				( ! isRightToLeft && edge === 'right' )
			) {
				return [ rootBlockIndex + 1, 'after' ];
			}
		}
	}

	blocksData.forEach(
		( {
			isUnmodifiedDefaultBlock,
			getBoundingClientRect,
			blockIndex,
			blockOrientation,
		} ) => {
			const rect = getBoundingClientRect();

			let [ distance, edge ] = getDistanceToNearestEdge(
				position,
				rect,
				allowedEdges
			);
			// If the the point is close to a side, prioritize that side.
			const [ sideDistance, sideEdge ] = getDistanceToNearestEdge(
				position,
				rect,
				[ 'left', 'right' ]
			);

			const isPointInsideRect = isPointContainedByRect( position, rect );

			// Prioritize the element if the point is inside of an unmodified default block.
			if ( isUnmodifiedDefaultBlock && isPointInsideRect ) {
				distance = 0;
			} else if (
				orientation === 'vertical' &&
				blockOrientation !== 'horizontal' &&
				( ( isPointInsideRect && sideDistance < THRESHOLD_DISTANCE ) ||
					( ! isPointInsideRect &&
						isPointWithinTopAndBottomBoundariesOfRect(
							position,
							rect
						) ) )
			) {
				/**
				 * This condition should only apply when the layout is vertical (otherwise there's
				 * no need to create a Row) and dropzones should only activate when the block is
				 * either within and close to the sides of the target block or on its outer sides.
				 */
				targetBlockIndex = blockIndex;
				nearestSide = sideEdge;
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

	// If the target index is set then group with the block at that index.
	if ( targetBlockIndex !== null ) {
		return [ targetBlockIndex, 'group', nearestSide ];
	}
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
 * Check if the dragged blocks can be dropped on the target.
 * @param {Function} getBlockType
 * @param {Object[]} allowedBlocks
 * @param {string[]} draggedBlockNames
 * @param {string}   targetBlockName
 * @return {boolean} Whether the dragged blocks can be dropped on the target.
 */
export function isDropTargetValid(
	getBlockType,
	allowedBlocks,
	draggedBlockNames,
	targetBlockName
) {
	// At root level allowedBlocks is undefined and all blocks are allowed.
	// Otherwise, check if all dragged blocks are allowed.
	let areBlocksAllowed = true;
	if ( allowedBlocks ) {
		const allowedBlockNames = allowedBlocks?.map( ( { name } ) => name );

		areBlocksAllowed = draggedBlockNames.every( ( name ) =>
			allowedBlockNames?.includes( name )
		);
	}

	// Work out if dragged blocks have an allowed parent and if so
	// check target block matches the allowed parent.
	const draggedBlockTypes = draggedBlockNames.map( ( name ) =>
		getBlockType( name )
	);
	const targetMatchesDraggedBlockParents = draggedBlockTypes.every(
		( block ) => {
			const [ allowedParentName ] = block?.parent || [];
			if ( ! allowedParentName ) {
				return true;
			}

			return allowedParentName === targetBlockName;
		}
	);

	return areBlocksAllowed && targetMatchesDraggedBlockParents;
}

/**
 * @typedef  {Object} WPBlockDropZoneConfig
 * @property {?HTMLElement} dropZoneElement Optional element to be used as the drop zone.
 * @property {string}       rootClientId    The root client id for the block list.
 */

/**
 * A React hook that can be used to make a block list handle drag and drop.
 *
 * @param {WPBlockDropZoneConfig} dropZoneConfig configuration data for the drop zone.
 */
export default function useBlockDropZone( {
	dropZoneElement,
	// An undefined value represents a top-level block. Default to an empty
	// string for this so that `targetRootClientId` can be easily compared to
	// values returned by the `getRootBlockClientId` selector, which also uses
	// an empty string to represent top-level blocks.
	rootClientId: targetRootClientId = '',
	parentClientId: parentBlockClientId = '',
	isDisabled = false,
} = {} ) {
	const registry = useRegistry();
	const [ dropTarget, setDropTarget ] = useState( {
		index: null,
		operation: 'insert',
	} );

	const { getBlockType, getBlockVariations, getGroupingBlockName } =
		useSelect( blocksStore );
	const {
		canInsertBlockType,
		getBlockListSettings,
		getBlocks,
		getBlockIndex,
		getDraggedBlockClientIds,
		getBlockNamesByClientId,
		getAllowedBlocks,
		isDragging,
		isGroupable,
	} = unlock( useSelect( blockEditorStore ) );
	const {
		showInsertionPoint,
		hideInsertionPoint,
		startDragging,
		stopDragging,
	} = unlock( useDispatch( blockEditorStore ) );

	const onBlockDrop = useOnBlockDrop(
		dropTarget.operation === 'before' || dropTarget.operation === 'after'
			? parentBlockClientId
			: targetRootClientId,
		dropTarget.index,
		{
			operation: dropTarget.operation,
			nearestSide: dropTarget.nearestSide,
		}
	);
	const throttled = useThrottle(
		useCallback(
			( event, ownerDocument ) => {
				if ( ! isDragging() ) {
					// When dragging from the desktop, no drag start event is fired.
					// So, ensure that the drag state is set when the user drags over a drop zone.
					startDragging();
				}
				const allowedBlocks = getAllowedBlocks( targetRootClientId );
				const targetBlockName = getBlockNamesByClientId( [
					targetRootClientId,
				] )[ 0 ];
				const draggedBlockNames = getBlockNamesByClientId(
					getDraggedBlockClientIds()
				);
				const isBlockDroppingAllowed = isDropTargetValid(
					getBlockType,
					allowedBlocks,
					draggedBlockNames,
					targetBlockName
				);
				if ( ! isBlockDroppingAllowed ) {
					return;
				}

				const blocks = getBlocks( targetRootClientId );

				// The block list is empty, don't show the insertion point but still allow dropping.
				if ( blocks.length === 0 ) {
					registry.batch( () => {
						setDropTarget( {
							index: 0,
							operation: 'insert',
						} );
						showInsertionPoint( targetRootClientId, 0, {
							operation: 'insert',
						} );
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
						blockOrientation:
							getBlockListSettings( clientId )?.orientation,
					};
				} );

				const dropTargetPosition = getDropTargetPosition(
					blocksData,
					{ x: event.clientX, y: event.clientY },
					getBlockListSettings( targetRootClientId )?.orientation,
					{
						dropZoneElement,
						parentBlockClientId,
						parentBlockOrientation: parentBlockClientId
							? getBlockListSettings( parentBlockClientId )
									?.orientation
							: undefined,
						rootBlockIndex: getBlockIndex( targetRootClientId ),
					}
				);

				const [ targetIndex, operation, nearestSide ] =
					dropTargetPosition;

				if ( operation === 'group' ) {
					const targetBlock = blocks[ targetIndex ];
					const areAllImages = [
						targetBlock.name,
						...draggedBlockNames,
					].every( ( name ) => name === 'core/image' );
					const canInsertGalleryBlock = canInsertBlockType(
						'core/gallery',
						targetRootClientId
					);
					const areGroupableBlocks = isGroupable( [
						targetBlock.clientId,
						getDraggedBlockClientIds(),
					] );
					const groupBlockVariations = getBlockVariations(
						getGroupingBlockName(),
						'block'
					);
					const canInsertRow =
						groupBlockVariations &&
						groupBlockVariations.find(
							( { name } ) => name === 'group-row'
						);

					// If the dragged blocks and the target block are all images,
					// check if it is creatable either a Row variation or a Gallery block.
					if (
						areAllImages &&
						! canInsertGalleryBlock &&
						( ! areGroupableBlocks || ! canInsertRow )
					) {
						return;
					}
					// If the dragged blocks and the target block are not all images,
					// check if it is creatable a Row variation.
					if (
						! areAllImages &&
						( ! areGroupableBlocks || ! canInsertRow )
					) {
						return;
					}
				}

				registry.batch( () => {
					setDropTarget( {
						index: targetIndex,
						operation,
						nearestSide,
					} );

					const insertionPointClientId = [
						'before',
						'after',
					].includes( operation )
						? parentBlockClientId
						: targetRootClientId;

					showInsertionPoint( insertionPointClientId, targetIndex, {
						operation,
						nearestSide,
					} );
				} );
			},
			[
				getAllowedBlocks,
				targetRootClientId,
				getBlockNamesByClientId,
				getDraggedBlockClientIds,
				getBlockType,
				getBlocks,
				getBlockListSettings,
				dropZoneElement,
				parentBlockClientId,
				getBlockIndex,
				registry,
				showInsertionPoint,
				isDragging,
				startDragging,
				canInsertBlockType,
				getBlockVariations,
				getGroupingBlockName,
				isGroupable,
			]
		),
		200
	);

	return useDropZone( {
		dropZoneElement,
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
			stopDragging();
			hideInsertionPoint();
		},
	} );
}
