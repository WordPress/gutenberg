import { useCallback } from '@wordpress/element';
import { useDispatch, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import { GRID_PLACEMENT_KEYS, getGridItemBox } from './free-placement';
import {
	DEFAULT_BLOCK_STYLE_STATE,
	getUpdatedChildLayoutStyle,
	hasViewportBlockStyleState,
} from '../../hooks/block-style-state';
import { isGridStackedOnMobile } from './mobile-stacking';
import { getComputedCSS, isGridElementWithFixedCells } from './utils';
import { getColumnCountChangeUpdates } from './remap-grid-placements';
import type { GridPlacement } from './free-placement';

type GridLayout = Record< string, any >;

/**
 * Returns a function that changes the number of columns of a manual grid
 * whose cells have a fixed size, keeping every block where it is on screen,
 * at the same size. The grid gets as many rows as keep it about as tall, and
 * each block gets the cells that contain it and its box inside them. Grids
 * that don't qualify are left to the caller.
 *
 * Editing the default state also updates the blocks' places in viewports
 * that use its column and row counts. The grid is only measured as it is
 * shown, so every state is worked out from that width.
 *
 * @param clientId The grid's client ID.
 *
 * @return A function that takes the grid's layout in the selected state, the new column count and the layout's `onChange`, and returns whether it made the change.
 */
export function useChangeGridColumnCount( clientId?: string ) {
	const registry = useRegistry();
	const gridElement = useBlockElement( clientId ?? '' ) as HTMLElement | null;
	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	return useCallback(
		(
			layout: GridLayout,
			newColumnCount: number | undefined,
			onChange: ( layout: GridLayout ) => void
		): boolean => {
			const { columnCount, rowCount } = layout;
			if (
				! clientId ||
				! window.__experimentalEnableGridInteractivity ||
				! layout.isManualPlacement ||
				! gridElement ||
				! isGridElementWithFixedCells( gridElement ) ||
				! columnCount ||
				! rowCount ||
				! newColumnCount ||
				newColumnCount === columnCount
			) {
				return false;
			}

			const getPixels = ( property: string ) =>
				parseFloat( getComputedCSS( gridElement, property ) ) || 0;
			const horizontalPadding =
				getPixels( 'padding-left' ) + getPixels( 'padding-right' );
			const width = gridElement.clientWidth - horizontalPadding;
			if ( width <= 0 ) {
				return false;
			}
			const columnGap = getPixels( 'column-gap' );
			const rowGap = getPixels( 'row-gap' );
			// The grid's aspect ratio sizes its border box when it has
			// `box-sizing: border-box`, as Group blocks do, so its padding and
			// borders are part of the size it takes from its width.
			const isBorderBox =
				getComputedCSS( gridElement, 'box-sizing' ) === 'border-box';
			const aspectWidth = isBorderBox
				? width +
					horizontalPadding +
					getPixels( 'border-left-width' ) +
					getPixels( 'border-right-width' )
				: width;
			const heightOffset = isBorderBox
				? getPixels( 'padding-top' ) +
					getPixels( 'padding-bottom' ) +
					getPixels( 'border-top-width' ) +
					getPixels( 'border-bottom-width' )
				: 0;
			const {
				getBlockAttributes,
				getBlockOrder,
				getSelectedBlockStyleState,
			} = registry.select( blockEditorStore ) as any;
			const selectedState = getSelectedBlockStyleState( clientId );
			const gridAttributes = getBlockAttributes( clientId ) ?? {};
			const children: Array< { clientId: string; style: any } > =
				getBlockOrder( clientId ).map( ( childClientId: string ) => ( {
					clientId: childClientId,
					style: getBlockAttributes( childClientId )?.style,
				} ) );

			// The states whose places change: the selected one, and from the
			// default state, the viewports that use its counts.
			const states = [ { state: selectedState, isOwnPlacement: false } ];
			if ( ! hasViewportBlockStyleState( selectedState ) ) {
				for ( const viewport of Object.keys(
					gridAttributes.style ?? {}
				).filter( ( key ) => key.startsWith( '@' ) ) ) {
					const viewportLayout =
						gridAttributes.style[ viewport ]?.layout ?? {};
					const isStacked =
						viewport === '@mobile' &&
						isGridStackedOnMobile(
							gridAttributes.layout,
							gridAttributes.style
						);
					if (
						viewportLayout.columnCount === undefined &&
						viewportLayout.rowCount === undefined &&
						! isStacked
					) {
						states.push( {
							state: {
								viewport,
								pseudo: DEFAULT_BLOCK_STYLE_STATE.pseudo,
							},
							isOwnPlacement: true,
						} );
					}
				}
			}

			const childStyles: Record< string, any > = {};
			let newRowCount = rowCount;
			states.forEach( ( { state, isOwnPlacement }, index ) => {
				const placements: Record< string, GridPlacement > = {};
				for ( const child of children ) {
					const baseLayout = child.style?.layout ?? {};
					const viewportLayout = hasViewportBlockStyleState( state )
						? child.style?.[ state.viewport ]?.layout
						: undefined;
					const ownsPlacement = GRID_PLACEMENT_KEYS.some( ( key ) =>
						Object.hasOwn( viewportLayout ?? {}, key )
					);
					// Viewports that use the default place follow it.
					if ( isOwnPlacement && ! ownsPlacement ) {
						continue;
					}
					placements[ child.clientId ] = {
						...baseLayout,
						...viewportLayout,
						box: getGridItemBox( baseLayout, viewportLayout ),
					};
				}
				const result = getColumnCountChangeUpdates( {
					width,
					aspectWidth,
					heightOffset,
					columnGap,
					rowGap,
					columnCount,
					rowCount,
					newColumnCount,
					placements,
				} );
				// The default or selected state sets the grid's row count, which
				// the viewports that follow it share.
				if ( index === 0 ) {
					newRowCount = result.rowCount;
				}
				for ( const [ childClientId, placement ] of Object.entries(
					result.placements
				) ) {
					const style =
						childStyles[ childClientId ] ??
						children.find(
							( child ) => child.clientId === childClientId
						)?.style;
					childStyles[ childClientId ] = getUpdatedChildLayoutStyle(
						style,
						{ ...placement, box: placement.box },
						state
					);
				}
			} );

			onChange( {
				...layout,
				columnCount: newColumnCount,
				rowCount: newRowCount,
			} );
			const childClientIds = Object.keys( childStyles );
			if ( childClientIds.length ) {
				__unstableMarkNextChangeAsNotPersistent();
				updateBlockAttributes(
					childClientIds,
					Object.fromEntries(
						childClientIds.map( ( childClientId ) => [
							childClientId,
							{ style: childStyles[ childClientId ] },
						] )
					),
					/* uniqueByBlock: */ true
				);
			}
			return true;
		},
		[
			clientId,
			gridElement,
			registry,
			updateBlockAttributes,
			__unstableMarkNextChangeAsNotPersistent,
		]
	);
}
