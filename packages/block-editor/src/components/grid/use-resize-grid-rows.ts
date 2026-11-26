import { useCallback, useMemo } from '@wordpress/element';
import { useDispatch, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { getGridRowResizeUpdates } from './get-grid-row-updates';
import type { GridEdge } from './get-grid-row-resize';

/**
 * Functions for adding or removing rows at an edge of a grid.
 */
interface ResizeGridRows {
	/**
	 * Gives the row count a resize would lead to.
	 */
	getRowCount: ( edge: GridEdge, rowDelta: number ) => number;
	/**
	 * Applies a resize, and gives the new row count, or `undefined` when
	 * nothing changes.
	 */
	resizeRows: ( edge: GridEdge, rowDelta: number ) => number | undefined;
}

/**
 * Returns functions for adding or removing rows at the top or bottom edge of
 * a grid, in the selected style state. Rows added or removed at the top move
 * every block in the grid by the same number of rows. The whole change is one
 * block update, so it is one undo step.
 *
 * @param gridClientId Client ID of the grid.
 *
 * @return `getRowCount` gives the row count a resize would lead to, and `resizeRows` applies it and gives the new row count.
 */
export function useResizeGridRows( gridClientId: string ): ResizeGridRows {
	const registry = useRegistry();
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const getResize = useCallback(
		( edge: GridEdge, rowDelta: number ) => {
			const {
				getBlockAttributes,
				getBlockOrder,
				getSelectedBlockStyleState,
			} = unlock( registry.select( blockEditorStore ) );
			return getGridRowResizeUpdates( {
				gridClientId,
				gridAttributes: getBlockAttributes( gridClientId ),
				children: getBlockOrder( gridClientId ).map(
					( clientId: string ) => ( {
						clientId,
						style: getBlockAttributes( clientId )?.style,
					} )
				),
				edge,
				rowDelta,
				selectedState: getSelectedBlockStyleState( gridClientId ),
			} );
		},
		[ registry, gridClientId ]
	);

	const resizeRows = useCallback(
		( edge: GridEdge, rowDelta: number ) => {
			if ( ! rowDelta ) {
				return undefined;
			}
			const { rowCount, updates } = getResize( edge, rowDelta );
			if ( ! updates ) {
				return undefined;
			}
			updateBlockAttributes(
				Object.keys( updates ),
				updates,
				/* uniqueByBlock: */ true
			);
			return rowCount;
		},
		[ getResize, updateBlockAttributes ]
	);

	return useMemo(
		() => ( {
			getRowCount: ( edge: GridEdge, rowDelta: number ) =>
				getResize( edge, rowDelta ).rowCount,
			resizeRows,
		} ),
		[ getResize, resizeRows ]
	);
}
