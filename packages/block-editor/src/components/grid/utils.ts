import type {
	GridInfo,
	GridItemMeasurements,
	GridPixelRect,
	GridRectOptions,
	GridSibling,
	GridTrack,
} from './types';
import { getRotatedBoundingRect } from '../../utils/rotation';

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

export function getComputedCSS( element: Element, property: string ) {
	// The element is rendered in a window.
	return element.ownerDocument
		.defaultView!.getComputedStyle( element )
		.getPropertyValue( property );
}

/**
 * Checks whether a grid's cells have a fixed size, as it tells its children
 * with `--wp--style--grid-cells`. Blocks are only placed freely inside cells
 * of a fixed size.
 *
 * @param gridElement The grid element.
 *
 * @return Whether the grid's cells have a fixed size.
 */
export function isGridElementWithFixedCells( gridElement: Element ) {
	return (
		getComputedCSS( gridElement, '--wp--style--grid-cells' ).trim() ===
		'fixed'
	);
}

/**
 * Given a grid-template-columns or grid-template-rows CSS property value, gets the start and end
 * position in pixels of each grid track.
 *
 * https://css-tricks.com/snippets/css/complete-guide-grid/#aa-grid-track
 *
 * @param template The grid-template-columns or grid-template-rows CSS property value.
 *                 Only supports fixed sizes in pixels.
 * @param gap      The gap between grid tracks in pixels.
 *
 * @return An array of objects with the start and end
 *         position in pixels of each grid track.
 */
export function getGridTracks( template: string, gap: number ): GridTrack[] {
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

export function getGridRect( gridElement: Element, rect: DOMRect ) {
	const columnGap = parseFloat( getComputedCSS( gridElement, 'column-gap' ) );
	const rowGap = parseFloat( getComputedCSS( gridElement, 'row-gap' ) );
	const gridColumnTracks = getGridTracks(
		getComputedCSS( gridElement, 'grid-template-columns' ),
		columnGap
	);
	const gridRowTracks = getGridTracks(
		getComputedCSS( gridElement, 'grid-template-rows' ),
		rowGap
	);
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
		columnTracks: getGridTracks(
			getComputedCSS( gridElement, 'grid-template-columns' ),
			parseFloat( getComputedCSS( gridElement, 'column-gap' ) ) || 0
		),
		rowTracks: getGridTracks(
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
	return {
		columnTracks,
		rowTracks,
		siblings,
		src,
		hasFixedCells: isGridElementWithFixedCells( gridElement ),
	};
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
