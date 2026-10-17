import { getUpdatedChildLayoutStyle } from '../../hooks/layout-child';
import {
	DEFAULT_BLOCK_STYLE_STATE,
	getStyleForState,
	hasViewportBlockStyleState,
} from '../../hooks/block-style-state';
import { getGridRowResize } from './get-grid-row-resize';

/**
 * Gets the layout a block has in a style state: its default layout with the
 * overrides of the state's viewport on top. Reads where
 * `getUpdatedChildLayoutStyle` writes.
 *
 * @param {Object|undefined} layout        The block's default layout.
 * @param {Object|undefined} style         The block's style attribute.
 * @param {Object}           selectedState Selected block style state.
 *
 * @return {Object} The layout in the selected state.
 */
export function getLayoutForState( layout, style, selectedState ) {
	if ( ! hasViewportBlockStyleState( selectedState ) ) {
		return { ...layout };
	}
	return {
		...layout,
		...getStyleForState( style, {
			viewport: selectedState.viewport,
			pseudo: DEFAULT_BLOCK_STYLE_STATE.pseudo,
		} )?.layout,
	};
}

/**
 * Gets the attributes that set a grid's row count in a style state: the
 * `layout` attribute in the default state, or the viewport's layout override.
 *
 * @param {Object} gridAttributes The grid's attributes.
 * @param {number} rowCount       The new row count.
 * @param {Object} selectedState  Selected block style state.
 *
 * @return {Object} Attributes to update on the grid.
 */
export function getGridRowCountUpdate(
	gridAttributes,
	rowCount,
	selectedState
) {
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
 * @param {Object}           options
 * @param {Object}           options.gridAttributes The grid's attributes.
 * @param {Object|undefined} options.childStyle     The block's new style attribute.
 * @param {Object}           options.selectedState  Selected block style state.
 *
 * @return {Object|undefined} Attributes to update on the grid, or `undefined` when the block fits.
 */
export function getGridGrowthUpdate( {
	gridAttributes,
	childStyle,
	selectedState,
} ) {
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
	const rowEnd = rowStart + rowSpan - 1;
	if ( ! rowStart || ! rowCount || rowEnd <= rowCount ) {
		return undefined;
	}
	return getGridRowCountUpdate( gridAttributes, rowEnd, selectedState );
}

/**
 * Gets the block updates that add or remove rows at the top or bottom edge of
 * a grid in a style state. Rows added or removed at the top move every block
 * in the grid by the same number of rows.
 *
 * @param {Object}                                               options
 * @param {string}                                               options.gridClientId   Client ID of the grid.
 * @param {Object}                                               options.gridAttributes The grid's attributes.
 * @param {Array<{clientId: string, style: (Object|undefined)}>} options.children       The grid's blocks.
 * @param {'top'|'bottom'}                                       options.edge           The edge being dragged.
 * @param {number}                                               options.rowDelta       Rows to add, or remove when negative.
 * @param {Object}                                               options.selectedState  Selected block style state.
 *
 * @return {{rowCount: number, updates: (Object|null)}} The new row count, and the attributes to update by client ID, or `null` when nothing changes.
 */
export function getGridRowResizeUpdates( {
	gridClientId,
	gridAttributes,
	children,
	edge,
	rowDelta,
	selectedState,
} ) {
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

	const updates = {
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
