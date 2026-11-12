import { __, sprintf } from '@wordpress/i18n';
import { focus } from '@wordpress/dom';
import type { DragDisplacementOptions, ListViewDisplacement } from './types';

// Must match the row height in `style.scss`; the windowing math relies on it.
// See: https://github.com/WordPress/gutenberg/pull/35230 for additional context.
export const BLOCK_LIST_ITEM_HEIGHT = 32;

export const getBlockPositionDescription = (
	position: number,
	siblingCount: number,
	level: number
) =>
	sprintf(
		/* translators: 1: The numerical position of the block. 2: The total number of blocks. 3. The level of nesting for the block. */
		__( 'Block %1$d of %2$d, Level %3$d.' ),
		position,
		siblingCount,
		level
	);

export const getBlockPropertiesDescription = (
	positionLabel: string | null | undefined,
	isLocked: boolean
) =>
	[
		positionLabel
			? `${ sprintf(
					// translators: %s: Position of selected block, e.g. "Sticky" or "Fixed".
					__( 'Position: %s' ),
					positionLabel
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
 * @param clientId               Block client ID.
 * @param selectedBlockClientIds Selected block client ID, or an array of multi-selected blocks client IDs.
 *
 * @return Whether the block is in multi-selection set.
 */
export const isClientIdSelected = (
	clientId: string,
	selectedBlockClientIds: string | string[]
): boolean =>
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
 * @param startId      The first id of a selection.
 * @param endId        The end id of a selection, usually one that has been clicked on.
 * @param startParents An array of ancestor ids for the start id, in descending order.
 * @param endParents   An array of ancestor ids for the end id, in descending order.
 * @return An object containing the start and end ids.
 */
export function getCommonDepthClientIds(
	startId: string,
	endId: string,
	startParents: string[],
	endParents: string[]
): { start: string; end: string } {
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
 * @param focusClientId   The client ID of the block to focus.
 * @param treeGridElement The container element to search within.
 * @param signal          Optional signal to stop waiting for the row and leave focus alone.
 */
export function focusListItem(
	focusClientId: string,
	treeGridElement: HTMLElement | null | undefined,
	signal?: AbortSignal
): Promise< void > | undefined {
	if ( ! treeGridElement ) {
		return;
	}

	const selector = `[role=row][data-block="${ focusClientId }"]`;

	return new Promise< Element | null >( ( resolve ) => {
		if ( treeGridElement.querySelector( selector ) ) {
			return resolve( treeGridElement.querySelector( selector ) );
		}

		let timer: ReturnType< typeof setTimeout > | null = null;
		// Wait for the element to be added to the DOM.
		const observer = new window.MutationObserver( () => {
			if ( treeGridElement.querySelector( selector ) ) {
				// `clearTimeout` ignores `null`.
				clearTimeout( timer as ReturnType< typeof setTimeout > );
				observer.disconnect();
				resolve( treeGridElement.querySelector( selector ) );
			}
		} );

		observer.observe( treeGridElement, {
			childList: true,
			subtree: true,
		} );

		signal?.addEventListener(
			'abort',
			() => {
				// `clearTimeout` ignores `null`.
				clearTimeout( timer as ReturnType< typeof setTimeout > );
				observer.disconnect();
				resolve( null );
			},
			{ once: true }
		);

		// Stop trying after 3 seconds.
		timer = setTimeout( () => {
			observer.disconnect();
			resolve( null );
		}, 3000 );
	} ).then( ( element ) => {
		if ( signal?.aborted ) {
			return;
		}

		if ( element && element.isConnected ) {
			// Focus the first focusable in the row, which is the ListViewBlockSelectButton.
			focus.focusable.find( element )?.[ 0 ]?.focus();
		}
	} );
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
 * @param props                        Named parameters.
 * @param props.blockIndexes           The indexes of all the blocks in the list view, keyed by clientId.
 * @param props.blockDropTargetIndex   The index of the block that the user is dropping to.
 * @param props.blockDropPosition      The position relative to the block that the user is dropping to.
 * @param props.clientId               The client id for the current block.
 * @param props.firstDraggedBlockIndex The index of the first dragged block.
 * @param props.isDragged              Whether the current block is being dragged. Dragged blocks skip displacement.
 * @return An object containing the `displacement`, `isAfterDraggedBlocks` and `isNesting` values.
 */
export function getDragDisplacementValues( {
	blockIndexes,
	blockDropTargetIndex,
	blockDropPosition,
	clientId,
	firstDraggedBlockIndex,
	isDragged,
}: DragDisplacementOptions ) {
	let displacement: ListViewDisplacement | undefined;
	let isNesting: boolean | undefined;
	let isAfterDraggedBlocks: boolean | undefined;

	if ( ! isDragged ) {
		isNesting = false;
		const thisBlockIndex = blockIndexes[ clientId ];
		// A missing index compares false.
		isAfterDraggedBlocks =
			( thisBlockIndex as number ) > ( firstDraggedBlockIndex as number );

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
