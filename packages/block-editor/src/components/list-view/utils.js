/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { focus } from '@wordpress/dom';

export const getBlockPositionDescription = ( position, siblingCount, level ) =>
	sprintf(
		/* translators: 1: The numerical position of the block. 2: The total number of blocks. 3. The level of nesting for the block. */
		__( 'Block %1$d of %2$d, Level %3$d.' ),
		position,
		siblingCount,
		level
	);

export const getBlockPropertiesDescription = ( blockInformation, isLocked ) =>
	[
		blockInformation?.positionLabel
			? `${ sprintf(
					// translators: %s: Position of selected block, e.g. "Sticky" or "Fixed".
					__( 'Position: %s' ),
					blockInformation.positionLabel
			  ) }.`
			: undefined,
		isLocked ? __( 'This block is locked.' ) : undefined,
	]
		.filter( Boolean )
		.join( ' ' );

/**
 * Returns true if the client ID occurs within the block selection or multi-selection,
 * or false otherwise.
 *
 * @param {string}          clientId               Block client ID.
 * @param {string|string[]} selectedBlockClientIds Selected block client ID, or an array of multi-selected blocks client IDs.
 *
 * @return {boolean} Whether the block is in multi-selection set.
 */
export const isClientIdSelected = ( clientId, selectedBlockClientIds ) =>
	Array.isArray( selectedBlockClientIds ) && selectedBlockClientIds.length
		? selectedBlockClientIds.indexOf( clientId ) !== -1
		: selectedBlockClientIds === clientId;

/**
 * From a start and end clientId of potentially different nesting levels,
 * return the nearest-depth ids that have a common level of depth in the
 * nesting hierarchy. For multiple block selection, this ensure that the
 * selection is always at the same nesting level, and not split across
 * separate levels.
 *
 * @param {string}   startId      The first id of a selection.
 * @param {string}   endId        The end id of a selection, usually one that has been clicked on.
 * @param {string[]} startParents An array of ancestor ids for the start id, in descending order.
 * @param {string[]} endParents   An array of ancestor ids for the end id, in descending order.
 * @return {Object} An object containing the start and end ids.
 */
export function getCommonDepthClientIds(
	startId,
	endId,
	startParents,
	endParents
) {
	const startPath = [ ...startParents, startId ];
	const endPath = [ ...endParents, endId ];
	const depth = Math.min( startPath.length, endPath.length ) - 1;
	const start = startPath[ depth ];
	const end = endPath[ depth ];

	return {
		start,
		end,
	};
}

/**
 * Shift focus to the list view item associated with a particular clientId.
 *
 * @typedef {import('@wordpress/element').RefObject} RefObject
 *
 * @param {string}       focusClientId   The client ID of the block to focus.
 * @param {?HTMLElement} treeGridElement The container element to search within.
 */
export function focusListItem( focusClientId, treeGridElement ) {
	const getFocusElement = () => {
		const row = treeGridElement?.querySelector(
			`[role=row][data-block="${ focusClientId }"]`
		);
		if ( ! row ) {
			return null;
		}
		// Focus the first focusable in the row, which is the ListViewBlockSelectButton.
		return focus.focusable.find( row )[ 0 ];
	};

	let focusElement = getFocusElement();
	if ( focusElement ) {
		focusElement.focus();
	} else {
		// The element hasn't been painted yet. Defer focusing on the next frame.
		// This could happen when all blocks have been deleted and the default block
		// hasn't been added to the editor yet.
		window.requestAnimationFrame( () => {
			focusElement = getFocusElement();

			// Ignore if the element still doesn't exist.
			if ( focusElement ) {
				focusElement.focus();
			}
		} );
	}
}

/**
 * Get values for the block that flag whether the block should be displaced up or down,
 * whether the block is being nested, and whether the block appears after the dragged
 * blocks. These values are used to determine the class names to apply to the block.
 * The list view rows are displaced visually via CSS rules. Displacement rules:
 * - `normal`: no displacement — used to apply a translateY of `0` so that the block
 *  appears in its original position, and moves to that position smoothly when dragging
 *  outside of the list view area.
 * - `up`: the block should be displaced up, creating room beneath the block for the drop indicator.
 * - `down`: the block should be displaced down, creating room above the block for the drop indicator.
 *
 * @param {Object}                props
 * @param {Object}                props.blockIndexes           The indexes of all the blocks in the list view, keyed by clientId.
 * @param {number|null|undefined} props.blockDropTargetIndex   The index of the block that the user is dropping to.
 * @param {?string}               props.blockDropPosition      The position relative to the block that the user is dropping to.
 * @param {string}                props.clientId               The client id for the current block.
 * @param {?number}               props.firstDraggedBlockIndex The index of the first dragged block.
 * @param {?boolean}              props.isDragged              Whether the current block is being dragged. Dragged blocks skip displacement.
 * @return {Object} An object containing the `displacement`, `isAfterDraggedBlocks` and `isNesting` values.
 */
export function getDragDisplacementValues( {
	blockIndexes,
	blockDropTargetIndex,
	blockDropPosition,
	clientId,
	firstDraggedBlockIndex,
	isDragged,
} ) {
	let displacement;
	let isNesting;
	let isAfterDraggedBlocks;

	if ( ! isDragged ) {
		isNesting = false;
		const thisBlockIndex = blockIndexes[ clientId ];
		isAfterDraggedBlocks = thisBlockIndex > firstDraggedBlockIndex;

		// Determine where to displace the position of the current block, relative
		// to the blocks being dragged (in their original position) and the drop target
		// (the position where a user is currently dragging the blocks to).
		if (
			blockDropTargetIndex !== undefined &&
			blockDropTargetIndex !== null &&
			firstDraggedBlockIndex !== undefined
		) {
			// If the block is being dragged and there is a valid drop target,
			// determine if the block being rendered should be displaced up or down.

			if ( thisBlockIndex !== undefined ) {
				if (
					thisBlockIndex >= firstDraggedBlockIndex &&
					thisBlockIndex < blockDropTargetIndex
				) {
					// If the current block appears after the set of dragged blocks
					// (in their original position), but is before the drop target,
					// then the current block should be displaced up.
					displacement = 'up';
				} else if (
					thisBlockIndex < firstDraggedBlockIndex &&
					thisBlockIndex >= blockDropTargetIndex
				) {
					// If the current block appears before the set of dragged blocks
					// (in their original position), but is after the drop target,
					// then the current block should be displaced down.
					displacement = 'down';
				} else {
					displacement = 'normal';
				}
				isNesting =
					typeof blockDropTargetIndex === 'number' &&
					blockDropTargetIndex - 1 === thisBlockIndex &&
					blockDropPosition === 'inside';
			}
		} else if (
			blockDropTargetIndex === null &&
			firstDraggedBlockIndex !== undefined
		) {
			// A `null` value for `blockDropTargetIndex` indicates that the
			// drop target is outside of the valid areas within the list view.
			// In this case, the drag is still active, but as there is no
			// valid drop target, we should remove the gap indicating where
			// the block would be inserted.
			if (
				thisBlockIndex !== undefined &&
				thisBlockIndex >= firstDraggedBlockIndex
			) {
				displacement = 'up';
			} else {
				displacement = 'normal';
			}
		} else if (
			blockDropTargetIndex !== undefined &&
			blockDropTargetIndex !== null &&
			firstDraggedBlockIndex === undefined
		) {
			// If the blockdrop target is defined, but there are no dragged blocks,
			// then the block should be displaced relative to the drop target.
			if ( thisBlockIndex !== undefined ) {
				if ( thisBlockIndex < blockDropTargetIndex ) {
					displacement = 'normal';
				} else {
					displacement = 'down';
				}
			}
		} else if ( blockDropTargetIndex === null ) {
			displacement = 'normal';
		}
	}

	return {
		displacement,
		isNesting,
		isAfterDraggedBlocks,
	};
}
