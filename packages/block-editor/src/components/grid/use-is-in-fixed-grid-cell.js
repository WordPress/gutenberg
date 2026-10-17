import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { getStyleForState } from '../../hooks/block-style-state';
import { hasFixedGridCells } from '../../layouts/grid';

/**
 * Checks whether a block sits directly in a grid cell with a fixed size, in
 * the viewport whose styles are being edited.
 *
 * @param {(store: Object) => Object} select   The data registry's `select`.
 * @param {string}                    clientId The block's client ID.
 * @return {boolean} Whether the block is in a grid cell with a fixed size.
 */
export function isInFixedGridCell( select, clientId ) {
	const { getBlockRootClientId, getBlockAttributes, getStyleStateViewport } =
		unlock( select( blockEditorStore ) );
	const parentId = getBlockRootClientId( clientId );
	const { layout, style } =
		( parentId && getBlockAttributes( parentId ) ) || {};
	if ( layout?.type !== 'grid' ) {
		return false;
	}
	const viewport = getStyleStateViewport();
	const viewportLayout =
		viewport === 'default'
			? undefined
			: getStyleForState( style, { viewport, pseudo: 'default' } )
					?.layout;
	return hasFixedGridCells( { ...layout, ...viewportLayout } );
}

/**
 * Checks whether a block sits directly in a grid cell with a fixed size, in
 * the viewport whose styles are being edited. Blocks fill such cells, so the
 * cell decides their size, and blocks can hide the size controls that would
 * have no effect there.
 *
 * @param {string} clientId The block's client ID.
 * @return {boolean} Whether the block is in a grid cell with a fixed size.
 */
export function useIsInFixedGridCell( clientId ) {
	return useSelect(
		( select ) => isInFixedGridCell( select, clientId ),
		[ clientId ]
	);
}
