import { useSelect } from '@wordpress/data';
import type { DataRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { getStyleForState } from '../../hooks/block-style-state';
import type { BlockStyle } from '../../hooks/types';
import { hasFixedGridCells } from '../../layouts/grid';
import { isGridStackedOnMobile } from './mobile-stacking';
import type { Layout } from '../../layouts/types';

/**
 * The attributes of a parent block that decide whether its grid cells have a
 * fixed size.
 */
interface GridParentAttributes {
	layout?: Layout;
	style?: BlockStyle;
}

/**
 * Checks whether a block sits directly in a grid cell with a fixed size, in
 * the viewport whose styles are being edited.
 *
 * @param select   The data registry's `select`.
 * @param clientId The block's client ID.
 * @return Whether the block is in a grid cell with a fixed size.
 */
export function isInFixedGridCell(
	select: DataRegistry[ 'select' ],
	clientId: string
): boolean {
	const { getBlockRootClientId, getBlockAttributes, getStyleStateViewport } =
		unlock( select( blockEditorStore ) );
	const parentId = getBlockRootClientId( clientId );
	// Block attributes are not validated against a schema.
	const { layout, style } = ( ( parentId &&
		getBlockAttributes( parentId ) ) ||
		{} ) as GridParentAttributes;
	if ( layout?.type !== 'grid' ) {
		return false;
	}
	const viewport = getStyleStateViewport();
	// Stacked grids size their blocks by their content on mobile.
	if ( viewport === '@mobile' && isGridStackedOnMobile( layout, style ) ) {
		return false;
	}
	const viewportLayout =
		viewport === 'default'
			? undefined
			: ( getStyleForState( style, { viewport, pseudo: 'default' } )
					?.layout as Layout | undefined );
	return hasFixedGridCells( { ...layout, ...viewportLayout } );
}

/**
 * Checks whether a block sits directly in a grid cell with a fixed size, in
 * the viewport whose styles are being edited. Blocks fill such cells, so the
 * cell decides their size, and blocks can hide the size controls that would
 * have no effect there.
 *
 * @param clientId The block's client ID.
 * @return Whether the block is in a grid cell with a fixed size.
 */
export function useIsInFixedGridCell( clientId: string ): boolean {
	return useSelect(
		( select ) => isInFixedGridCell( select, clientId ),
		[ clientId ]
	);
}
