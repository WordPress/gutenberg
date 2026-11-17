import type {
	GridInfo,
	GridItemLayout,
	GridItemMeasurements,
	GridPixelRect,
	GridRectOptions,
	GridSibling,
	GridTrack,
} from './types';
import { getRotatedBoundingRect } from '../../utils/rotation';

/**
 * Checks whether a grid item has an explicit column or row start.
 *
 * @param layout             Grid item placement.
 * @param layout.columnStart The item's column start.
 * @param layout.rowStart    The item's row start.
 * @return Whether a column or row start is set.
 */
export function hasExplicitGridPlacement( layout: {
	columnStart?: unknown;
	rowStart?: unknown;
} ) {
	return (
		( layout.columnStart !== undefined && layout.columnStart !== null ) ||
		( layout.rowStart !== undefined && layout.rowStart !== null )
	);
}

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
 * Gets the smallest range of grid cells that contains two other ranges,
 * whichever way round they are.
 *
 * @param rectA A range of grid cells.
 * @param rectB Another range of grid cells.
 *
 * @return The cells from one range to the other.
 */
export function getBoundingGridRect( rectA: GridRect, rectB: GridRect ) {
	return new GridRect( {
		columnStart: Math.min( rectA.columnStart, rectB.columnStart ),
		rowStart: Math.min( rectA.rowStart, rectB.rowStart ),
		columnEnd: Math.max( rectA.columnEnd, rectB.columnEnd ),
		rowEnd: Math.max( rectA.rowEnd, rectB.rowEnd ),
	} );
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
	let hasNonEmptyTrack = false;
	for ( const size of sizes ) {
		const previousTrack = tracks[ tracks.length - 1 ];
		// Auto-fit gutters around collapsed tracks overlap, leaving one gap
		// between nonempty tracks and none before or after the occupied tracks.
		// The caller opts in because an ordinary zero-width track keeps its gaps.
		const isGapCollapsed =
			options.collapseEmptyTracks && ( size === 0 || ! hasNonEmptyTrack );
		const start = previousTrack
			? previousTrack.end + ( isGapCollapsed ? 0 : gapInPixels )
			: 0;
		const end = start + size;
		tracks.push( { start, end } );
		hasNonEmptyTrack ||= size > 0;
	}
	return tracks;
}

/**
 * Gets the start and end position in pixels of each track in a computed grid
 * template, such as the value of `grid-template-columns`.
 *
 * @param template The computed grid template: track sizes in pixels.
 * @param gap      The gap between tracks, in pixels.
 *
 * @return An array of objects with the start and end position in pixels of
 *         each grid track.
 */
export function getGridTracksFromTemplate(
	template: string,
	gap: number
): GridTrack[] {
	const tracks: GridTrack[] = [];
	for ( const size of template.split( ' ' ) ) {
		const previousTrack = tracks[ tracks.length - 1 ];
		const start = previousTrack ? previousTrack.end + gap : 0;
		const end = start + parseFloat( size );
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
	return tracks.reduce( ( closest, track, index ) => {
		const closestTrack = tracks[ closest ];
		const distance = Math.abs( track[ edge ] - position );
		const closestDistance = Math.abs( closestTrack[ edge ] - position );
		// Collapsed tracks can share an edge with an occupied track.
		// Prefer the occupied track when both are equally close.
		return distance < closestDistance ||
			( distance === closestDistance &&
				track.end > track.start &&
				closestTrack.end === closestTrack.start )
			? index
			: closest;
	}, 0 );
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

/**
 * Gets the start and end position in pixels of each column and row track of a
 * grid, relative to the grid's content box.
 *
 * @param gridElement The grid element.
 *
 * @return The grid tracks.
 */
export function getGridTrackPositions( gridElement: Element ): {
	columnTracks: GridTrack[];
	rowTracks: GridTrack[];
} {
	return {
		columnTracks: getGridTracksFromTemplate(
			getComputedCSS( gridElement, 'grid-template-columns' ),
			parseFloat( getComputedCSS( gridElement, 'column-gap' ) ) || 0
		),
		rowTracks: getGridTracksFromTemplate(
			getComputedCSS( gridElement, 'grid-template-rows' ),
			parseFloat( getComputedCSS( gridElement, 'row-gap' ) ) || 0
		),
	};
}

/**
 * Gets the position of a grid item in pixels, relative to the grid's content
 * box. Offsets ignore CSS transforms, such as the ones the editor uses to
 * animate block moves, and the `rotate` property, so an item is measured by
 * the area it takes up in the grid, without its rotation.
 *
 * @param gridItemElement The grid item element.
 * @param padding         The grid's padding, when it is already known.
 * @param padding.left    Left padding, in pixels.
 * @param padding.top     Top padding, in pixels.
 *
 * @return The item's position.
 */
export function getGridItemPixelRect(
	gridItemElement: HTMLElement,
	padding: { left: number; top: number } = getGridPadding(
		// A grid item is inside its grid.
		gridItemElement.parentElement!
	)
): GridPixelRect {
	// A grid item is inside its grid.
	const gridElement = gridItemElement.parentElement!;
	let left = gridItemElement.offsetLeft;
	let top = gridItemElement.offsetTop;
	if ( gridItemElement.offsetParent !== gridElement ) {
		left -= gridElement.offsetLeft + gridElement.clientLeft;
		top -= gridElement.offsetTop + gridElement.clientTop;
	}
	left -= padding.left;
	top -= padding.top;
	return {
		left,
		top,
		right: left + gridItemElement.offsetWidth,
		bottom: top + gridItemElement.offsetHeight,
	};
}

/**
 * A CSS property of an element's inline style that takes a string, in camel
 * case.
 */
type CSSStringProperty = {
	[
		Key in keyof CSSStyleDeclaration
	]: CSSStyleDeclaration[ Key ] extends string ? Key : never;
}[ keyof CSSStyleDeclaration ] &
	string;

const DEGREES_PER_UNIT: Record< string, number > = {
	deg: 1,
	grad: 0.9,
	rad: 180 / Math.PI,
	turn: 360,
};

/**
 * Gets the rotation in degrees from a value of the CSS `rotate` property,
 * such as its computed value.
 *
 * @param value The `rotate` value, such as `45deg`.
 *
 * @return The rotation in degrees, or 0 when there is none in the page's plane.
 */
export function getRotationFromCSS( value: string | undefined ): number {
	const match = value
		?.trim()
		.match( /^(?:z\s+)?(-?[\d.]+(?:e-?\d+)?)(deg|grad|rad|turn)$/ );
	if ( ! match ) {
		return 0;
	}
	return parseFloat( match[ 1 ] ) * DEGREES_PER_UNIT[ match[ 2 ] ];
}

/**
 * Gets the rotation of a grid item as it is rendered, in degrees.
 *
 * @param gridItemElement The grid item element.
 *
 * @return The rotation in degrees.
 */
export function getGridItemRotation( gridItemElement: Element ): number {
	return getRotationFromCSS( getComputedCSS( gridItemElement, 'rotate' ) );
}

/**
 * Sets an inline style on an element, or removes it when the value is empty.
 * Used for previews that should not go through block attributes, such as the
 * rotation while the rotate handle is dragged.
 *
 * @param element  The element.
 * @param property The CSS property, in camel case.
 * @param value    The value, or an empty string to remove it.
 */
export function setInlineStyle(
	element: HTMLElement,
	property: CSSStringProperty,
	value: string
): void {
	element.style[ property ] = value;
}

/**
 * Gets a grid's left and top padding, in pixels.
 *
 * @param gridElement The grid element.
 *
 * @return The padding.
 */
function getGridPadding( gridElement: Element ) {
	return {
		left: parseFloat( getComputedCSS( gridElement, 'padding-left' ) ) || 0,
		top: parseFloat( getComputedCSS( gridElement, 'padding-top' ) ) || 0,
	};
}

/**
 * Measures a grid's tracks and the blocks in it, once, when a drag starts.
 * Blocks are measured in the canvas, so that the result matches what is on
 * screen in every viewport. Hidden blocks are left out, and other blocks take
 * up the cells they reach with their rotation.
 *
 * @param gridElement The grid element.
 * @param srcClientId Client ID of the dragged block, or null when it isn't in
 *                    the grid.
 *
 * @return The measurements.
 */
export function getGridItemMeasurements(
	gridElement: Element,
	srcClientId: string | null
): GridItemMeasurements {
	const { columnTracks, rowTracks } = getGridTrackPositions( gridElement );
	const padding = getGridPadding( gridElement );
	const siblings: GridSibling[] = [];
	let src: GridItemMeasurements[ 'src' ] = null;
	for ( const element of gridElement.children ) {
		// Block elements are HTML elements.
		const child = element as HTMLElement;
		const childClientId = child.getAttribute( 'data-block' );
		if ( ! childClientId || ! child.offsetParent ) {
			continue;
		}
		const pixelRect = getGridItemPixelRect( child, padding );
		const angle = getGridItemRotation( child );
		if ( childClientId === srcClientId ) {
			src = {
				pixelRect,
				rect: getGridRectFromPixelRect(
					pixelRect,
					columnTracks,
					rowTracks
				),
				angle,
			};
			continue;
		}
		const rotatedPixelRect = getRotatedBoundingRect( pixelRect, angle );
		siblings.push( {
			pixelRect: rotatedPixelRect,
			rect: getGridRectFromPixelRect(
				rotatedPixelRect,
				columnTracks,
				rowTracks
			),
		} );
	}
	return { columnTracks, rowTracks, siblings, src };
}

/**
 * Gets the grid cells that a rectangle in pixels covers, snapping its edges to
 * the closest tracks.
 *
 * @param rect         Rectangle relative to the grid's content box.
 * @param columnTracks Column tracks.
 * @param rowTracks    Row tracks.
 *
 * @return The grid cells.
 */
export function getGridRectFromPixelRect(
	rect: GridPixelRect,
	columnTracks: GridTrack[],
	rowTracks: GridTrack[]
): GridRect {
	return new GridRect( {
		columnStart: getClosestTrack( columnTracks, rect.left ) + 1,
		rowStart: getClosestTrack( rowTracks, rect.top ) + 1,
		columnEnd: getClosestTrack( columnTracks, rect.right, 'end' ) + 1,
		rowEnd: getClosestTrack( rowTracks, rect.bottom, 'end' ) + 1,
	} );
}

/**
 * Gets the row a resized grid item ends on. Past the last row, the grid grows:
 * every average row height (plus gap) dragged past the end adds a row.
 *
 * @param rowTracks Row tracks.
 * @param position  Bottom edge of the item in pixels, relative to the grid's content box.
 * @param gap       Row gap in pixels.
 *
 * @return The 1-based row the item ends on.
 */
export function getRowEndForResize(
	rowTracks: GridTrack[],
	position: number,
	gap: number = 0
): number {
	const closestRowEnd = getClosestTrack( rowTracks, position, 'end' ) + 1;
	const lastTrack = rowTracks[ rowTracks.length - 1 ];
	if ( ! lastTrack || position <= lastTrack.end ) {
		return closestRowEnd;
	}
	const averageRowHeight =
		rowTracks.reduce(
			( total, track ) => total + track.end - track.start,
			0
		) / rowTracks.length;
	const extraRows = Math.round(
		( position - lastTrack.end ) / ( averageRowHeight + gap )
	);
	return extraRows > 0 ? rowTracks.length + extraRows : closestRowEnd;
}

/**
 * Gets the names of the blocks dragged from an inserter, which it adds to the
 * drag's data types as `wp-block:<name>`, since only the types can be read
 * while dragging. Each name is listed once.
 *
 * @param dataTransfer The drag's data, if any.
 *
 * @return The block names, or none when the drag isn't from an inserter.
 */
export function getInserterDragBlockNames(
	dataTransfer: Pick< DataTransfer, 'types' > | null | undefined
): string[] {
	return Array.from( dataTransfer?.types ?? [] )
		.filter( ( type ) => type.startsWith( 'wp-block:' ) )
		.map( ( type ) => type.slice( 'wp-block:'.length ) );
}
