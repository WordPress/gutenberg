import { useCallback } from '@wordpress/element';
import { useDispatch, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { getUpdatedChildLayoutStyle } from '../../hooks/layout-child';
import {
	getUnstackedMobileUpdates,
	isGridStackedOnMobile,
} from './mobile-stacking';

/**
 * Returns a function that changes the placement, size or rotation of a grid
 * item in the selected style state.
 *
 * Editing a grid item on mobile while its grid is stacked first gives the grid
 * its own mobile layout, matching the stack, so that the edit has an effect
 * and nothing else moves. The whole change is one block update, so it is one
 * undo step.
 *
 * @return {(clientId: string, layout: Object, gridClientId?: string) => void} Updates a grid item's child layout. `gridClientId` defaults to the item's parent, and is needed for a block being dropped into the grid from elsewhere.
 */
export function useUpdateGridChildLayout() {
	const registry = useRegistry();
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	return useCallback(
		( clientId, layout, gridClientId ) => {
			const {
				getBlockAttributes,
				getBlockOrder,
				getBlockRootClientId,
				getSelectedBlockStyleState,
			} = unlock( registry.select( blockEditorStore ) );
			const selectedState = getSelectedBlockStyleState( clientId );
			const targetGridClientId =
				gridClientId ?? getBlockRootClientId( clientId );
			const gridAttributes = getBlockAttributes( targetGridClientId );

			let updates = {};
			if (
				selectedState?.viewport === '@mobile' &&
				isGridStackedOnMobile(
					gridAttributes?.layout,
					gridAttributes?.style
				)
			) {
				updates = getUnstackedMobileUpdates( {
					gridClientId: targetGridClientId,
					gridAttributes,
					children: getBlockOrder( targetGridClientId ).map(
						( childClientId ) => ( {
							clientId: childClientId,
							attributes: getBlockAttributes( childClientId ),
						} )
					),
				} );
			}

			const style =
				updates[ clientId ]?.style ??
				getBlockAttributes( clientId )?.style;
			updates[ clientId ] = {
				style: getUpdatedChildLayoutStyle(
					style,
					layout,
					selectedState
				),
			};
			updateBlockAttributes(
				Object.keys( updates ),
				updates,
				/* uniqueByBlock: */ true
			);
		},
		[ registry, updateBlockAttributes ]
	);
}
