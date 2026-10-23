import { useCallback } from '@wordpress/element';
import { useDispatch, useRegistry } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { getUpdatedChildLayoutStyle } from '../../hooks/block-style-state';
import { getGridGrowthUpdate } from './get-grid-row-updates';
import {
	getUnstackedMobileUpdates,
	isGridStackedOnMobile,
} from './mobile-stacking';
import type {
	GridBlockAttributes,
	GridBlockStyle,
	GridChild,
	GridStyleLayout,
} from './mobile-stacking';
import type { BlockStyleState } from '../../hooks/types';

/**
 * A function that gets a grid item's style, the selected state and the grid's
 * attributes, and returns the item's new style.
 */
export type GridChildStyleChange = (
	style: GridBlockStyle | undefined,
	selectedState: BlockStyleState,
	gridAttributes: GridBlockAttributes
) => GridBlockStyle;

/**
 * A change to a grid item: child layout values to merge into the selected
 * state, or a function that returns the item's new style.
 */
export type GridChildChange = GridStyleLayout | GridChildStyleChange;

/**
 * Returns whether an edit in the selected style state turns stacking off for
 * the grid: any edit to a grid item on mobile while its grid is stacked does.
 *
 * @param selectedState  Selected block style state.
 * @param gridAttributes The grid's attributes.
 *
 * @return Whether the edit turns stacking off.
 */
function isUnstackingEdit(
	selectedState: BlockStyleState,
	gridAttributes: GridBlockAttributes | null | undefined
): boolean {
	return (
		selectedState?.viewport === '@mobile' &&
		isGridStackedOnMobile( gridAttributes?.layout, gridAttributes?.style )
	);
}

/**
 * Gets the block updates for a change to a grid item in the selected style
 * state.
 *
 * Editing a grid item on mobile while its grid is stacked first gives the grid
 * its own mobile layout, matching the stack, so that the edit has an effect
 * and nothing else moves. A manual grid also grows in the selected state when
 * the item ends up past its last row.
 *
 * @param options
 * @param options.clientId       Client ID of the grid item.
 * @param options.style          The grid item's style attribute.
 * @param options.change         The change to make.
 * @param options.selectedState  Selected block style state.
 * @param options.gridClientId   Client ID of the grid.
 * @param options.gridAttributes The grid's attributes.
 * @param options.children       The grid's items, in block order.
 *
 * @return Attributes to update, keyed by client ID.
 */
export function getGridChildUpdates( {
	clientId,
	style,
	change,
	selectedState,
	gridClientId,
	gridAttributes,
	children,
}: {
	clientId: string;
	style: GridBlockStyle | undefined;
	change: GridChildChange;
	selectedState: BlockStyleState;
	gridClientId: string;
	gridAttributes: GridBlockAttributes | null | undefined;
	children: GridChild[];
} ): Record< string, GridBlockAttributes > {
	let updates: Record< string, GridBlockAttributes > = {};
	if ( isUnstackingEdit( selectedState, gridAttributes ) ) {
		updates = getUnstackedMobileUpdates( {
			gridClientId,
			gridAttributes,
			children,
		} );
	}
	// The grid as it is after any unstacking.
	const updatedGridAttributes: GridBlockAttributes = {
		...gridAttributes,
		...updates[ gridClientId ],
	};

	const childStyle = updates[ clientId ]?.style ?? style;
	updates[ clientId ] = {
		style:
			typeof change === 'function'
				? change( childStyle, selectedState, updatedGridAttributes )
				: ( getUpdatedChildLayoutStyle(
						childStyle,
						change,
						selectedState
					) as GridBlockStyle | undefined ),
	};

	// A block placed or resized past the last row of a manual grid grows the
	// grid in the selected state.
	if (
		updatedGridAttributes?.layout?.isManualPlacement &&
		window.__experimentalEnableGridInteractivity
	) {
		// The row helpers type the same attributes a little differently.
		type GrowthOptions = Parameters< typeof getGridGrowthUpdate >[ 0 ];
		const gridUpdate = getGridGrowthUpdate( {
			gridAttributes:
				updatedGridAttributes as GrowthOptions[ 'gridAttributes' ],
			childStyle: updates[ clientId ]
				.style as GrowthOptions[ 'childStyle' ],
			selectedState,
		} ) as GridBlockAttributes | undefined;
		if ( gridUpdate ) {
			updates[ gridClientId ] = {
				...updates[ gridClientId ],
				...gridUpdate,
			};
		}
	}

	return updates;
}

/**
 * Returns a function that changes the placement or size of a grid item in
 * the selected style state, through `getGridChildUpdates`. The whole change is
 * one block update, so it is one undo step. When the change turns stacking
 * off for the grid, a snackbar says so, since the grid's other blocks keep
 * their place but are no longer stacked.
 *
 * @return Updates a grid item. `gridClientId` defaults to the item's parent, and is needed for a block being dropped into the grid from elsewhere.
 */
export function useUpdateGridChildLayout(): (
	clientId: string,
	change: GridChildChange,
	gridClientId?: string
) => void {
	const registry = useRegistry();
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { createInfoNotice } = useDispatch( noticesStore );

	return useCallback(
		(
			clientId: string,
			change: GridChildChange,
			gridClientId?: string
		) => {
			const {
				getBlockAttributes,
				getBlockOrder,
				getBlockRootClientId,
				getSelectedBlockStyleState,
			} = unlock( registry.select( blockEditorStore ) );
			// A grid item's parent is its grid.
			const targetGridClientId = ( gridClientId ??
				getBlockRootClientId( clientId ) ) as string;
			const selectedState = getSelectedBlockStyleState( clientId );
			const gridAttributes = getBlockAttributes( targetGridClientId );
			const updates = getGridChildUpdates( {
				clientId,
				style: getBlockAttributes( clientId )?.style,
				change,
				selectedState,
				gridClientId: targetGridClientId,
				gridAttributes,
				children: getBlockOrder( targetGridClientId ).map(
					( childClientId: string ) => ( {
						clientId: childClientId,
						attributes: getBlockAttributes( childClientId ),
					} )
				),
			} );
			updateBlockAttributes(
				Object.keys( updates ),
				updates,
				/* uniqueByBlock: */ true
			);
			if ( isUnstackingEdit( selectedState, gridAttributes ) ) {
				createInfoNotice(
					__( 'Stack on mobile turned off for this grid.' ),
					{
						type: 'snackbar',
						id: 'block-editor/grid-unstacked-on-mobile',
					}
				);
			}
		},
		[ registry, updateBlockAttributes, createInfoNotice ]
	);
}
