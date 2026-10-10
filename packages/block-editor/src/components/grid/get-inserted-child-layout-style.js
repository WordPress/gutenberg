import {
	DEFAULT_BLOCK_STYLE_STATE,
	getStyleForState,
	hasViewportBlockStyleState,
	setStyleForState,
} from '../../hooks/block-style-state';

const PLACEMENT_KEYS = [ 'columnStart', 'rowStart', 'columnSpan', 'rowSpan' ];

/**
 * Gets the layout values that place a block in a range of cells. Spans of one
 * cell are left out, so that they remove any span the block had.
 *
 * @param {Object} rect The cells, as a `GridRect`.
 *
 * @return {Object} The `columnStart`, `rowStart`, `columnSpan` and `rowSpan` layout values.
 */
function getPlacement( rect ) {
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
 * @param {number}  start Index of the first track, starting at 1.
 * @param {number}  span  Number of tracks.
 * @param {?number} count Number of tracks in the grid.
 *
 * @return {[number, number]} The start and span that fit.
 */
function clampToTracks( start, span, count ) {
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
 * @param {Object|undefined} style         The inserted block's style attribute.
 * @param {Object}           rect          The cells to cover, as a `GridRect`.
 * @param {Object}           selectedState Selected block style state.
 * @param {Object}           gridLayout    The grid's `layout` attribute.
 *
 * @return {Object|undefined} The updated style attribute.
 */
export function getInsertedChildLayoutStyle(
	style,
	rect,
	selectedState,
	gridLayout
) {
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
	const newStyle = {
		...style,
		layout: {
			...style?.layout,
			...getPlacement( { columnStart, rowStart, columnSpan, rowSpan } ),
		},
	};

	// Viewport style states are the keys that start with `@`.
	for ( const [ key, value ] of Object.entries( newStyle ) ) {
		if ( key.startsWith( '@' ) && value?.layout ) {
			const layout = { ...value.layout };
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
				...stateStyle?.layout,
				...getPlacement( rect ),
			},
		} );
	}
	return updatedStyle;
}
