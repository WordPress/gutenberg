import { useCallback, useMemo } from '@wordpress/element';
import { useDispatch, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { getUpdatedChildLayoutStyle } from '../../hooks/layout-child';
import { hasViewportBlockStyleState } from '../../hooks/block-style-state';
import { getGridRowResize } from './get-grid-row-resize';

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
			const selectedState = getSelectedBlockStyleState( gridClientId );
			const viewport = hasViewportBlockStyleState( selectedState )
				? selectedState.viewport
				: null;
			const getEffectiveLayout = ( layout, style ) => ( {
				...layout,
				...( viewport ? style?.[ viewport ]?.layout : undefined ),
			} );

			const gridAttributes = getBlockAttributes( gridClientId );
			const children = getBlockOrder( gridClientId ).map(
				( clientId ) => {
					const style = getBlockAttributes( clientId )?.style;
					return {
						clientId,
						style,
						layout: getEffectiveLayout( style?.layout, style ),
					};
				}
			);
			return {
				selectedState,
				viewport,
				gridAttributes,
				children,
				...getGridRowResize( {
					rowCount: getEffectiveLayout(
						gridAttributes?.layout,
						gridAttributes?.style
					).rowCount,
					children: children.map( ( { layout } ) => layout ),
					edge,
					rowDelta,
				} ),
			};
		},
		[ registry, gridClientId ]
	);

	const resizeRows = useCallback(
		( edge, rowDelta ) => {
			if ( ! rowDelta ) {
				return;
			}
			const {
				selectedState,
				viewport,
				gridAttributes,
				children,
				rowCount,
				rowShift,
			} = getResize( edge, rowDelta );

			const updates = {
				[ gridClientId ]: viewport
					? {
							style: getUpdatedChildLayoutStyle(
								gridAttributes?.style,
								{ rowCount },
								selectedState
							),
						}
					: { layout: { ...gridAttributes?.layout, rowCount } },
			};
			if ( rowShift ) {
				for ( const { clientId, style, layout } of children ) {
					if ( ! layout.rowStart ) {
						continue;
					}
					updates[ clientId ] = {
						style: getUpdatedChildLayoutStyle(
							style,
							{ rowStart: layout.rowStart + rowShift },
							selectedState
						),
					};
				}
			}
			updateBlockAttributes(
				Object.keys( updates ),
				updates,
				/* uniqueByBlock: */ true
			);
		},
		[ getResize, updateBlockAttributes, gridClientId ]
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
