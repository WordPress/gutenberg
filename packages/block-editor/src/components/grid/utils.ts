import type { GridInfo, GridRectOptions, GridTrack } from './types';

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
 * @param gridElement The grid element.
 * @param axis        Either 'column' or 'row'.
 *
 * @return An array of objects with the start and end
 *         position in pixels of each grid track.
 */
export function getGridTracks(
	gridElement: HTMLElement,
	axis: 'column' | 'row'
): GridTrack[] {
	const isColumn = axis === 'column';
	const padding = ( isColumn ? [ 'left', 'right' ] : [ 'top', 'bottom' ] )
		.map( ( side ) =>
			parseFloat( getComputedCSS( gridElement, `padding-${ side }` ) )
		)
		.reduce( ( total, value ) => total + value, 0 );
	const contentSize =
		( isColumn ? gridElement.clientWidth : gridElement.clientHeight ) -
		padding;
	const gapInPixels = getGapInPixels(
		getComputedCSS( gridElement, `${ axis }-gap` ),
		contentSize
	);
	const template = getComputedCSS(
		gridElement,
		isColumn ? 'grid-template-columns' : 'grid-template-rows'
	);

	const tracks: GridTrack[] = [];
	for ( const size of template.split( ' ' ) ) {
		const previousTrack = tracks[ tracks.length - 1 ];
		const start = previousTrack ? previousTrack.end + gapInPixels : 0;
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
