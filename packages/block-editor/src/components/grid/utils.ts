import type {
	GridInfo,
	GridItemLayout,
	GridRectOptions,
	GridTrack,
} from './types';

export function range( start: number, length: number ) {
	return Array.from( { length }, ( _, i ) => start + i );
}

export class GridRect {
	declare columnStart: number;
	declare rowStart: number;
	declare columnEnd: number;
	declare rowEnd: number;

	constructor( {
		columnStart,
		rowStart,
		columnEnd,
		rowEnd,
		columnSpan,
		rowSpan,
	}: GridRectOptions = {} ) {
		this.columnStart = columnStart ?? 1;
		this.rowStart = rowStart ?? 1;
		if ( columnSpan !== undefined ) {
			this.columnEnd = this.columnStart + columnSpan - 1;
		} else {
			this.columnEnd = columnEnd ?? this.columnStart;
		}
		if ( rowSpan !== undefined ) {
			this.rowEnd = this.rowStart + rowSpan - 1;
		} else {
			this.rowEnd = rowEnd ?? this.rowStart;
		}
	}

	get columnSpan() {
		return this.columnEnd - this.columnStart + 1;
	}

	get rowSpan() {
		return this.rowEnd - this.rowStart + 1;
	}

	contains( column: number, row: number ) {
		return (
			column >= this.columnStart &&
			column <= this.columnEnd &&
			row >= this.rowStart &&
			row <= this.rowEnd
		);
	}

	containsRect( rect: GridRect ) {
		return (
			this.contains( rect.columnStart, rect.rowStart ) &&
			this.contains( rect.columnEnd, rect.rowEnd )
		);
	}

	intersectsRect( rect: GridRect ) {
		return (
			this.columnStart <= rect.columnEnd &&
			this.columnEnd >= rect.columnStart &&
			this.rowStart <= rect.rowEnd &&
			this.rowEnd >= rect.rowStart
		);
	}
}

/**
 * Reads an item's grid placement, defaulting omitted spans to one. Callers
 * validate the values according to their placement requirements.
 *
 * @param layout The item's layout attributes.
 *
 * @return Placement fields with defaults for omitted spans.
 */
export function getGridItemPlacement( layout?: GridItemLayout ) {
	const { columnStart, rowStart, columnSpan = 1, rowSpan = 1 } = layout ?? {};
	return { columnStart, rowStart, columnSpan, rowSpan };
}

/**
 * Gets the row count needed to contain a set of rectangles, respecting the
 * caller's minimum. The minimum can be the current count to only grow rows,
 * or a baseline to also allow automatically added rows to shrink.
 *
 * @param rects           Grid item rectangles.
 * @param minimumRowCount Minimum number of rows to retain.
 *
 * @return Required row count.
 */
export function getRequiredGridRowCount(
	rects: Iterable< GridRect >,
	minimumRowCount: number
): number {
	let bottomMostRow = -Infinity;
	for ( const rect of rects ) {
		bottomMostRow = Math.max( bottomMostRow, rect.rowEnd );
	}
	return Math.max( minimumRowCount, bottomMostRow );
}

export function getComputedCSS( element: Element, property: string ) {
	// The element is rendered in a window.
	return element.ownerDocument
		.defaultView!.getComputedStyle( element )
		.getPropertyValue( property );
}

interface GridMeasurement {
	columns: GridTrack[];
	rows: GridTrack[];
	bounds: DOMRect;
	scaleX: number;
	scaleY: number;
	isRightToLeft: boolean;
	inlineOffset: number;
	topOffset: number;
}

/**
 * Converts a computed `column-gap` or `row-gap` value to pixels. Lengths
 * compute to pixels, but percentages are preserved and `normal` is 0 in grids.
 *
 * @param gap         The computed gap value.
 * @param contentSize The size in pixels of the grid's content box along the
 *                    gap's axis, which percentages resolve against.
 *
 * @return The gap in pixels.
 */
function getGapInPixels( gap: string, contentSize: number ): number {
	const value = parseFloat( gap );
	if ( ! Number.isFinite( value ) ) {
		return 0;
	}
	return gap.trim().endsWith( '%' ) ? ( value * contentSize ) / 100 : value;
}

/**
 * Gets the start and end position in pixels of each track of a grid element
 * along one axis, from its computed grid-template-columns or
 * grid-template-rows and column-gap or row-gap.
 *
 * https://css-tricks.com/snippets/css/complete-guide-grid/#aa-grid-track
 *
 * @param gridElement                 The grid element.
 * @param axis                        Either 'column' or 'row'.
 * @param options                     Options.
 * @param options.collapseEmptyTracks Whether auto-fit gutters collapse.
 * @param options.computedStyle       A previously read style declaration.
 *
 * @return An array of objects with the start and end
 *         position in pixels of each grid track.
 */
export function getGridTracks(
	gridElement: HTMLElement,
	axis: 'column' | 'row',
	options: {
		collapseEmptyTracks?: boolean;
		computedStyle?: CSSStyleDeclaration;
	} = {}
): GridTrack[] {
	const isColumn = axis === 'column';
	const computedStyle =
		options.computedStyle ??
		gridElement.ownerDocument.defaultView!.getComputedStyle( gridElement );
	const padding = ( isColumn ? [ 'left', 'right' ] : [ 'top', 'bottom' ] )
		.map( ( side ) =>
			parseFloat( computedStyle.getPropertyValue( `padding-${ side }` ) )
		)
		.reduce( ( total, value ) => total + value, 0 );
	const contentSize =
		( isColumn ? gridElement.clientWidth : gridElement.clientHeight ) -
		padding;
	const gapInPixels = getGapInPixels(
		computedStyle.getPropertyValue( `${ axis }-gap` ),
		contentSize
	);
	const template = computedStyle.getPropertyValue(
		isColumn ? 'grid-template-columns' : 'grid-template-rows'
	);
	const sizes = template.split( ' ' ).map( ( size ) => parseFloat( size ) );

	const tracks: GridTrack[] = [];
	for ( const [ index, size ] of sizes.entries() ) {
		const previousTrack = tracks[ tracks.length - 1 ];
		const previousSize = sizes[ index - 1 ];
		// Empty auto-fit tracks and the gutters on either side collapse.
		// The caller opts in because an ordinary zero-width track keeps its gaps.
		const isGapCollapsed =
			options.collapseEmptyTracks && ( size === 0 || previousSize === 0 );
		const start = previousTrack
			? previousTrack.end + ( isGapCollapsed ? 0 : gapInPixels )
			: 0;
		const end = start + size;
		tracks.push( { start, end } );
	}
	return tracks;
}

/**
 * Measures the grid values shared while locating each of its children.
 *
 * @param gridElement             The grid element.
 * @param collapseEmptyColumnGaps Whether zero-width auto-fit columns have
 *                                collapsed gutters.
 *
 * @return The measurement, or undefined when the grid can't be measured.
 */
export function getGridMeasurement(
	gridElement: HTMLElement,
	collapseEmptyColumnGaps = false
): GridMeasurement | undefined {
	if ( ! gridElement.offsetWidth || ! gridElement.offsetHeight ) {
		return undefined;
	}
	const bounds = gridElement.getBoundingClientRect();
	const scaleX = bounds.width / gridElement.offsetWidth;
	const scaleY = bounds.height / gridElement.offsetHeight;
	if ( ! scaleX || ! scaleY ) {
		return undefined;
	}
	const computedStyle =
		gridElement.ownerDocument.defaultView!.getComputedStyle( gridElement );
	const inset = ( side: string ) =>
		parseFloat(
			computedStyle.getPropertyValue( `border-${ side }-width` )
		) + parseFloat( computedStyle.getPropertyValue( `padding-${ side }` ) );
	const isRightToLeft = computedStyle.direction === 'rtl';

	return {
		columns: getGridTracks( gridElement, 'column', {
			collapseEmptyTracks: collapseEmptyColumnGaps,
			computedStyle,
		} ),
		rows: getGridTracks( gridElement, 'row', { computedStyle } ),
		bounds,
		scaleX,
		scaleY,
		isRightToLeft,
		inlineOffset: inset( isRightToLeft ? 'right' : 'left' ),
		topOffset: inset( 'top' ),
	};
}

/**
 * Given an array of grid tracks and a position in pixels, gets the index of the closest track to
 * that position.
 *
 * https://css-tricks.com/snippets/css/complete-guide-grid/#aa-grid-track
 *
 * @param tracks   An array of objects with the start and end
 *                 position in pixels of each grid track.
 * @param position The position in pixels.
 * @param edge     The edge of the track to compare the
 *                 position to. Either 'start' or 'end'.
 *
 * @return The index of the closest track to the position. 0-based, unlike CSS grid which
 *         is 1-based.
 */
export function getClosestTrack(
	tracks: GridTrack[],
	position: number,
	edge: keyof GridTrack = 'start'
): number {
	return tracks.reduce(
		( closest, track, index ) =>
			Math.abs( track[ edge ] - position ) <
			Math.abs( tracks[ closest ][ edge ] - position )
				? index
				: closest,
		0
	);
}

/**
 * Gets the position in pixels of the track range covered by the given start
 * and end positions, as 1-based inclusive track indexes. Unlike
 * `getClosestTrack`, it includes every track the range overlaps.
 *
 * @param tracks An array of objects with the start and end
 *               position in pixels of each grid track.
 * @param start  The start position in pixels.
 * @param end    The end position in pixels.
 *
 * @return The first and last overlapped tracks, or undefined if none.
 */
export function getTrackRange(
	tracks: GridTrack[],
	start: number,
	end: number
): [ number, number ] | undefined {
	const first = tracks.findIndex( ( track ) => track.end > start + 0.1 );
	let last = tracks.length - 1;
	while ( last >= 0 && tracks[ last ].start >= end - 0.1 ) {
		last--;
	}
	if ( first < 0 || last < first ) {
		return undefined;
	}
	return [ first + 1, last + 1 ];
}

/**
 * Gets the bounds of a grid item relative to the start of its grid's tracks,
 * that is, inside the grid's border and padding. Accounts for CSS scaling and
 * right-to-left direction, so `left` is the inline start edge.
 *
 * @param gridElement The grid element.
 * @param element     The grid item element.
 * @param measurement A previously read grid measurement.
 *
 * @return The item's bounds, or undefined if the grid can't be measured.
 */
export function getRectInGrid(
	gridElement: HTMLElement,
	element: Element,
	measurement = getGridMeasurement( gridElement )
): { left: number; right: number; top: number; bottom: number } | undefined {
	if ( ! measurement ) {
		return undefined;
	}
	const bounds = element.getBoundingClientRect();
	return {
		left:
			( measurement.isRightToLeft
				? measurement.bounds.right - bounds.right
				: bounds.left - measurement.bounds.left ) /
				measurement.scaleX -
			measurement.inlineOffset,
		right:
			( measurement.isRightToLeft
				? measurement.bounds.right - bounds.left
				: bounds.right - measurement.bounds.left ) /
				measurement.scaleX -
			measurement.inlineOffset,
		top:
			( bounds.top - measurement.bounds.top ) / measurement.scaleY -
			measurement.topOffset,
		bottom:
			( bounds.bottom - measurement.bounds.top ) / measurement.scaleY -
			measurement.topOffset,
	};
}

export function getGridRect( gridElement: HTMLElement, rect: DOMRect ) {
	const gridColumnTracks = getGridTracks( gridElement, 'column' );
	const gridRowTracks = getGridTracks( gridElement, 'row' );
	const columnStart = getClosestTrack( gridColumnTracks, rect.left ) + 1;
	const rowStart = getClosestTrack( gridRowTracks, rect.top ) + 1;
	const columnEnd =
		getClosestTrack( gridColumnTracks, rect.right, 'end' ) + 1;
	const rowEnd = getClosestTrack( gridRowTracks, rect.bottom, 'end' ) + 1;
	return new GridRect( {
		columnStart,
		columnEnd,
		rowStart,
		rowEnd,
	} );
}

export function getGridItemRect( gridItemElement: HTMLElement ) {
	return getGridRect(
		// A grid item is inside its grid.
		gridItemElement.parentElement!,
		new window.DOMRect(
			gridItemElement.offsetLeft,
			gridItemElement.offsetTop,
			gridItemElement.offsetWidth,
			gridItemElement.offsetHeight
		)
	);
}

export function getGridInfo( gridElement: Element ): GridInfo {
	const gridTemplateColumns = getComputedCSS(
		gridElement,
		'grid-template-columns'
	);
	const gridTemplateRows = getComputedCSS(
		gridElement,
		'grid-template-rows'
	);
	const borderTopWidth = getComputedCSS( gridElement, 'border-top-width' );
	const borderRightWidth = getComputedCSS(
		gridElement,
		'border-right-width'
	);
	const borderBottomWidth = getComputedCSS(
		gridElement,
		'border-bottom-width'
	);
	const borderLeftWidth = getComputedCSS( gridElement, 'border-left-width' );
	const paddingTop = getComputedCSS( gridElement, 'padding-top' );
	const paddingRight = getComputedCSS( gridElement, 'padding-right' );
	const paddingBottom = getComputedCSS( gridElement, 'padding-bottom' );
	const paddingLeft = getComputedCSS( gridElement, 'padding-left' );

	const numColumns = gridTemplateColumns.split( ' ' ).length;
	const numRows = gridTemplateRows.split( ' ' ).length;
	const numItems = numColumns * numRows;
	return {
		numColumns,
		numRows,
		numItems,
		currentColor: getComputedCSS( gridElement, 'color' ),
		style: {
			gridTemplateColumns,
			gridTemplateRows,
			gap: getComputedCSS( gridElement, 'gap' ),
			inset: `
				calc(${ paddingTop } + ${ borderTopWidth })
				calc(${ paddingRight } + ${ borderRightWidth })
				calc(${ paddingBottom } + ${ borderBottomWidth })
				calc(${ paddingLeft } + ${ borderLeftWidth })
			`,
		},
	};
}
