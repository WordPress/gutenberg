import {
	DEFAULT_BLOCK_STYLE_STATE,
	getStyleForState,
	getUpdatedChildLayoutStyle,
	hasViewportBlockStyleState,
} from '../../hooks/block-style-state';
import type { BlockStyle, BlockStyleState } from '../../hooks/types';
import type { Layout } from '../../layouts/types';
import { getGridRowResize } from './get-grid-row-resize';
import type { GridEdge, GridRowPlacement } from './get-grid-row-resize';

/**
 * A grid's or a grid block's layout, with the placement of the block.
 */
type GridLayout = Layout & GridRowPlacement;

/**
 * A block's `style` attribute, with the layout of the default state.
 */
type GridStyle = BlockStyle & { layout?: GridLayout };

/**
 * The attributes of a grid that set its layout.
 */
interface GridAttributes {
	layout?: Layout;
	style?: GridStyle;
	[ key: string ]: unknown;
}

/**
 * Attributes to update on a grid or on one of its blocks.
 */
export interface GridAttributesUpdate {
	layout?: Layout;
	style?: BlockStyle;
}

/**
 * Gets the layout a block has in a style state: its default layout with the
 * overrides of the state's viewport on top. Reads where
 * `getUpdatedChildLayoutStyle` writes.
 *
 * @param layout        The block's default layout.
 * @param style         The block's style attribute.
 * @param selectedState Selected block style state.
 *
 * @return The layout in the selected state.
 */
export function getLayoutForState(
	layout: GridLayout | undefined,
	style: BlockStyle | undefined,
	selectedState: BlockStyleState
): GridLayout {
	if ( ! hasViewportBlockStyleState( selectedState ) ) {
		return { ...layout };
	}
	return {
		...layout,
		// Style attributes are not validated against a schema.
		...( getStyleForState( style, {
			viewport: selectedState.viewport,
			pseudo: DEFAULT_BLOCK_STYLE_STATE.pseudo,
		} )?.layout as GridLayout | undefined ),
	};
}

/**
 * Gets the attributes that set a grid's row count in a style state: the
 * `layout` attribute in the default state, or the viewport's layout override.
 *
 * @param gridAttributes The grid's attributes.
 * @param rowCount       The new row count.
 * @param selectedState  Selected block style state.
 *
 * @return Attributes to update on the grid.
 */
export function getGridRowCountUpdate(
	gridAttributes: GridAttributes | undefined,
	rowCount: number,
	selectedState: BlockStyleState
): GridAttributesUpdate {
	if ( ! hasViewportBlockStyleState( selectedState ) ) {
		return { layout: { ...gridAttributes?.layout, rowCount } };
	}
	return {
		style: getUpdatedChildLayoutStyle(
			gridAttributes?.style,
			{ rowCount },
			selectedState
		),
	};
}

/**
 * Gets the attributes that grow a grid so that a block's layout fits in it in
 * a style state, for example after the block was resized past the last row.
 *
 * @param options
 * @param options.gridAttributes The grid's attributes.
 * @param options.childStyle     The block's new style attribute.
 * @param options.selectedState  Selected block style state.
 *
 * @return Attributes to update on the grid, or `undefined` when the block fits.
 */
export function getGridGrowthUpdate( {
	gridAttributes,
	childStyle,
	selectedState,
}: {
	gridAttributes: GridAttributes | undefined;
	childStyle: GridStyle | undefined;
	selectedState: BlockStyleState;
} ): GridAttributesUpdate | undefined {
	const { rowStart, rowSpan = 1 } = getLayoutForState(
		childStyle?.layout,
		childStyle,
		selectedState
	);
	const { rowCount } = getLayoutForState(
		gridAttributes?.layout,
		gridAttributes?.style,
		selectedState
	);
	if ( ! rowStart || ! rowCount ) {
		return undefined;
	}
	const rowEnd = rowStart + rowSpan - 1;
	if ( rowEnd <= rowCount ) {
		return undefined;
	}
	return getGridRowCountUpdate( gridAttributes, rowEnd, selectedState );
}

/**
 * Gets the block updates that add or remove rows at the top or bottom edge of
 * a grid in a style state. Rows added or removed at the top move every block
 * in the grid by the same number of rows.
 *
 * @param options
 * @param options.gridClientId   Client ID of the grid.
 * @param options.gridAttributes The grid's attributes.
 * @param options.children       The grid's blocks.
 * @param options.edge           The edge being dragged.
 * @param options.rowDelta       Rows to add, or remove when negative.
 * @param options.selectedState  Selected block style state.
 *
 * @return The new row count, and the attributes to update by client ID, or `null` when nothing changes.
 */
export function getGridRowResizeUpdates( {
	gridClientId,
	gridAttributes,
	children,
	edge,
	rowDelta,
	selectedState,
}: {
	gridClientId: string;
	gridAttributes: GridAttributes | undefined;
	children: Array< { clientId: string; style: GridStyle | undefined } >;
	edge: GridEdge;
	rowDelta: number;
	selectedState: BlockStyleState;
} ): {
	rowCount: number;
	updates: Record< string, GridAttributesUpdate > | null;
} {
	const childLayouts = children.map( ( { style } ) =>
		getLayoutForState( style?.layout, style, selectedState )
	);
	const currentRowCount = getLayoutForState(
		gridAttributes?.layout,
		gridAttributes?.style,
		selectedState
	).rowCount;
	const { rowCount, rowShift } = getGridRowResize( {
		rowCount: currentRowCount,
		children: childLayouts,
		edge,
		rowDelta,
	} );
	if ( ! rowShift && rowCount === currentRowCount ) {
		return { rowCount, updates: null };
	}

	const updates: Record< string, GridAttributesUpdate > = {
		[ gridClientId ]: getGridRowCountUpdate(
			gridAttributes,
			rowCount,
			selectedState
		),
	};
	if ( rowShift ) {
		children.forEach( ( { clientId, style }, index ) => {
			const { rowStart } = childLayouts[ index ];
			if ( ! rowStart ) {
				return;
			}
			updates[ clientId ] = {
				style: getUpdatedChildLayoutStyle(
					style,
					{ rowStart: rowStart + rowShift },
					selectedState
				),
			};
		} );
	}
	return { rowCount, updates };
}
