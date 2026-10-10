import { useCallback } from '@wordpress/element';
import { useDispatch, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { getUpdatedChildLayoutStyle } from '../../hooks/layout-child';
import { getGridGrowthUpdate } from './get-grid-row-updates';
import {
	getUnstackedMobileUpdates,
	isGridStackedOnMobile,
} from './mobile-stacking';

/**
 * A change to a grid item: child layout values to merge into the selected
 * state, or a function that gets the item's style, the selected state and the
 * grid's attributes, and returns the item's new style.
 *
 * @typedef {Object|((style: Object|undefined, selectedState: Object, gridAttributes: Object) => Object)} GridChildChange
 */

/**
 * Gets the block updates for a change to a grid item in the selected style
 * state.
 *
 * Editing a grid item on mobile while its grid is stacked first gives the grid
 * its own mobile layout, matching the stack, so that the edit has an effect
 * and nothing else moves. A manual grid also grows in the selected state when
 * the item ends up past its last row.
 *
 * @param {Object}                                        options
 * @param {string}                                        options.clientId       Client ID of the grid item.
 * @param {Object|undefined}                              options.style          The grid item's style attribute.
 * @param {GridChildChange}                               options.change         The change to make.
 * @param {Object}                                        options.selectedState  Selected block style state.
 * @param {string}                                        options.gridClientId   Client ID of the grid.
 * @param {Object|undefined}                              options.gridAttributes The grid's attributes.
 * @param {Array<{clientId: string, attributes: Object}>} options.children       The grid's items, in block order.
 *
 * @return {Object<string, Object>} Attributes to update, keyed by client ID.
 */
export function getGridChildUpdates( {
	clientId,
	style,
	change,
	selectedState,
	gridClientId,
	gridAttributes,
	children,
} ) {
	let updates = {};
	if (
		selectedState?.viewport === '@mobile' &&
		isGridStackedOnMobile( gridAttributes?.layout, gridAttributes?.style )
	) {
		updates = getUnstackedMobileUpdates( {
			gridClientId,
			gridAttributes,
			children,
		} );
	}
	// The grid as it is after any unstacking.
	const updatedGridAttributes = {
		...gridAttributes,
		...updates[ gridClientId ],
	};

	const childStyle = updates[ clientId ]?.style ?? style;
	updates[ clientId ] = {
		style:
			typeof change === 'function'
				? change( childStyle, selectedState, updatedGridAttributes )
				: getUpdatedChildLayoutStyle(
						childStyle,
						change,
						selectedState
					),
	};

	// A block placed or resized past the last row of a manual grid grows the
	// grid in the selected state.
	if (
		updatedGridAttributes?.layout?.isManualPlacement &&
		window.__experimentalEnableGridInteractivity
	) {
		const gridUpdate = getGridGrowthUpdate( {
			gridAttributes: updatedGridAttributes,
			childStyle: updates[ clientId ].style,
			selectedState,
		} );
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
 * one block update, so it is one undo step.
 *
 * @return {(clientId: string, change: GridChildChange, gridClientId?: string) => void} Updates a grid item. `gridClientId` defaults to the item's parent, and is needed for a block being dropped into the grid from elsewhere.
 */
export function useUpdateGridChildLayout() {
	const registry = useRegistry();
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	return useCallback(
		( clientId, change, gridClientId ) => {
			const {
				getBlockAttributes,
				getBlockOrder,
				getBlockRootClientId,
				getSelectedBlockStyleState,
			} = unlock( registry.select( blockEditorStore ) );
			const targetGridClientId =
				gridClientId ?? getBlockRootClientId( clientId );
			const updates = getGridChildUpdates( {
				clientId,
				style: getBlockAttributes( clientId )?.style,
				change,
				selectedState: getSelectedBlockStyleState( clientId ),
				gridClientId: targetGridClientId,
				gridAttributes: getBlockAttributes( targetGridClientId ),
				children: getBlockOrder( targetGridClientId ).map(
					( childClientId ) => ( {
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
		},
		[ registry, updateBlockAttributes ]
	);
}
