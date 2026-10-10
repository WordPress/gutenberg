import { useCallback, useMemo } from '@wordpress/element';
import { useDispatch, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { getGridRowResizeUpdates } from './get-grid-row-updates';

/**
 * Returns functions for adding or removing rows at the top or bottom edge of
 * a grid, in the selected style state. Rows added or removed at the top move
 * every block in the grid by the same number of rows. The whole change is one
 * block update, so it is one undo step.
 *
 * @param {string} gridClientId Client ID of the grid.
 *
 * @return {{getRowCount: (edge: 'top'|'bottom', rowDelta: number) => number, resizeRows: (edge: 'top'|'bottom', rowDelta: number) => void}} `getRowCount` gives the row count a resize would lead to, and `resizeRows` applies it.
 */
export function useResizeGridRows( gridClientId ) {
	const registry = useRegistry();
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const getResize = useCallback(
		( edge, rowDelta ) => {
			const {
				getBlockAttributes,
				getBlockOrder,
				getSelectedBlockStyleState,
			} = unlock( registry.select( blockEditorStore ) );
			return getGridRowResizeUpdates( {
				gridClientId,
				gridAttributes: getBlockAttributes( gridClientId ),
				children: getBlockOrder( gridClientId ).map( ( clientId ) => ( {
					clientId,
					style: getBlockAttributes( clientId )?.style,
				} ) ),
				edge,
				rowDelta,
				selectedState: getSelectedBlockStyleState( gridClientId ),
			} );
		},
		[ registry, gridClientId ]
	);

	const resizeRows = useCallback(
		( edge, rowDelta ) => {
			if ( ! rowDelta ) {
				return;
			}
			const { updates } = getResize( edge, rowDelta );
			if ( ! updates ) {
				return;
			}
			updateBlockAttributes(
				Object.keys( updates ),
				updates,
				/* uniqueByBlock: */ true
			);
		},
		[ getResize, updateBlockAttributes ]
	);

	return useMemo(
		() => ( {
			getRowCount: ( edge, rowDelta ) =>
				getResize( edge, rowDelta ).rowCount,
			resizeRows,
		} ),
		[ getResize, resizeRows ]
	);
}
