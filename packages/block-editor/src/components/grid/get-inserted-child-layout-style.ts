import {
	DEFAULT_BLOCK_STYLE_STATE,
	getStyleForState,
	hasViewportBlockStyleState,
	setStyleForState,
} from '../../hooks/block-style-state';
import type { BlockStyle, BlockStyleState } from '../../hooks/types';

/** A range of grid cells, such as a `GridRect`. */
interface Placement {
	columnStart: number;
	rowStart: number;
	columnSpan: number;
	rowSpan: number;
}

/** The parts of a grid's `layout` attribute that set its size. */
interface GridLayout {
	type?: string;
	columnCount?: number | null;
	rowCount?: number | null;
}

const PLACEMENT_KEYS = [ 'columnStart', 'rowStart', 'columnSpan', 'rowSpan' ];

/**
 * Gets the layout values that place a block in a range of cells. Spans of one
 * cell are left out, so that they remove any span the block had.
 *
 * @param rect The cells, as a `GridRect`.
 *
 * @return The `columnStart`, `rowStart`, `columnSpan` and `rowSpan` layout values.
 */
function getPlacement( rect: Placement ): Partial< Placement > {
	return {
		columnStart: rect.columnStart,
		rowStart: rect.rowStart,
		columnSpan: rect.columnSpan > 1 ? rect.columnSpan : undefined,
		rowSpan: rect.rowSpan > 1 ? rect.rowSpan : undefined,
	};
}

/**
 * Shrinks and moves a range of cells along one axis of a grid so that it
 * fits in the grid's number of tracks, if the grid has one.
 *
 * @param start Index of the first track, starting at 1.
 * @param span  Number of tracks.
 * @param count Number of tracks in the grid.
 *
 * @return The start and span that fit.
 */
function clampToTracks(
	start: number,
	span: number,
	count?: number | null
): [ number, number ] {
	if ( ! count ) {
		return [ start, span ];
	}
	const clampedSpan = Math.min( span, count );
	return [ Math.min( start, count - clampedSpan + 1 ), clampedSpan ];
}

/**
 * Gets the style of a block inserted into a range of cells of a manual grid.
 *
 * The block always gets a placement in the default style state, so that the
 * grid doesn't place it in a cell of its own choosing. That placement is the
 * range of cells, fitted to the grid's own column and row count. When a
 * viewport style state is selected, the range of cells, as drawn, is also the
 * block's placement in that viewport. Any placement the block had in other
 * viewports is removed, so that the block is where it was drawn everywhere.
 * The rest of the block's style is kept.
 *
 * @param style         The inserted block's style attribute.
 * @param rect          The cells to cover, as a `GridRect`.
 * @param selectedState Selected block style state.
 * @param gridLayout    The grid's `layout` attribute.
 *
 * @return The updated style attribute.
 */
export function getInsertedChildLayoutStyle(
	style: BlockStyle | undefined,
	rect: Placement,
	selectedState: BlockStyleState,
	gridLayout: GridLayout | undefined
): BlockStyle | undefined {
	const [ columnStart, columnSpan ] = clampToTracks(
		rect.columnStart,
		rect.columnSpan,
		gridLayout?.columnCount
	);
	const [ rowStart, rowSpan ] = clampToTracks(
		rect.rowStart,
		rect.rowSpan,
		gridLayout?.rowCount
	);
	const newStyle: BlockStyle = {
		...style,
		layout: {
			// Style attributes are not validated against a schema.
			...( style?.layout as BlockStyle | undefined ),
			...getPlacement( { columnStart, rowStart, columnSpan, rowSpan } ),
		},
	};

	// Viewport style states are the keys that start with `@`.
	for ( const [ key, entry ] of Object.entries( newStyle ) ) {
		const value = entry as BlockStyle | null | undefined;
		if ( key.startsWith( '@' ) && value?.layout ) {
			const layout: BlockStyle = { ...( value.layout as BlockStyle ) };
			for ( const placementKey of PLACEMENT_KEYS ) {
				delete layout[ placementKey ];
			}
			newStyle[ key ] = { ...value, layout };
		}
	}

	let updatedStyle = setStyleForState(
		style,
		DEFAULT_BLOCK_STYLE_STATE,
		newStyle
	);
	if ( hasViewportBlockStyleState( selectedState ) ) {
		const layoutState = {
			viewport: selectedState.viewport,
			pseudo: DEFAULT_BLOCK_STYLE_STATE.pseudo,
		};
		const stateStyle = getStyleForState( updatedStyle, layoutState );
		updatedStyle = setStyleForState( updatedStyle, layoutState, {
			...stateStyle,
			layout: {
				...( stateStyle?.layout as BlockStyle | undefined ),
				...getPlacement( rect ),
			},
		} );
	}
	return updatedStyle;
}
