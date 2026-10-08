export function range( start, length ) {
	return Array.from( { length }, ( _, i ) => start + i );
}

export class GridRect {
	constructor( {
		columnStart,
		rowStart,
		columnEnd,
		rowEnd,
		columnSpan,
		rowSpan,
	} = {} ) {
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

	contains( column, row ) {
		return (
			column >= this.columnStart &&
			column <= this.columnEnd &&
			row >= this.rowStart &&
			row <= this.rowEnd
		);
	}

	containsRect( rect ) {
		return (
			this.contains( rect.columnStart, rect.rowStart ) &&
			this.contains( rect.columnEnd, rect.rowEnd )
		);
	}

	intersectsRect( rect ) {
		return (
			this.columnStart <= rect.columnEnd &&
			this.columnEnd >= rect.columnStart &&
			this.rowStart <= rect.rowEnd &&
			this.rowEnd >= rect.rowStart
		);
	}
}

export function getComputedCSS( element, property ) {
	return element.ownerDocument.defaultView
		.getComputedStyle( element )
		.getPropertyValue( property );
}

/**
 * Given a grid-template-columns or grid-template-rows CSS property value, gets the start and end
 * position in pixels of each grid track.
 *
 * https://css-tricks.com/snippets/css/complete-guide-grid/#aa-grid-track
 *
 * @param {string} template The grid-template-columns or grid-template-rows CSS property value.
 *                          Only supports fixed sizes in pixels.
 * @param {number} gap      The gap between grid tracks in pixels.
 *
 * @return {Array<{start: number, end: number}>} An array of objects with the start and end
 *                                               position in pixels of each grid track.
 */
export function getGridTracks( template, gap ) {
	const tracks = [];
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
 * @param {Array<{start: number, end: number}>} tracks   An array of objects with the start and end
 *                                                       position in pixels of each grid track.
 * @param {number}                              position The position in pixels.
 * @param {string}                              edge     The edge of the track to compare the
 *                                                       position to. Either 'start' or 'end'.
 *
 * @return {number} The index of the closest track to the position. 0-based, unlike CSS grid which
 *                  is 1-based.
 */
export function getClosestTrack( tracks, position, edge = 'start' ) {
	return tracks.reduce(
		( closest, track, index ) =>
			Math.abs( track[ edge ] - position ) <
			Math.abs( tracks[ closest ][ edge ] - position )
				? index
				: closest,
		0
	);
}

export function getGridRect( gridElement, rect ) {
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

export function getGridItemRect( gridItemElement ) {
	return getGridRect(
		gridItemElement.parentElement,
		new window.DOMRect(
			gridItemElement.offsetLeft,
			gridItemElement.offsetTop,
			gridItemElement.offsetWidth,
			gridItemElement.offsetHeight
		)
	);
}

export function getGridInfo( gridElement ) {
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
 * @param {HTMLElement} gridElement The grid element.
 *
 * @return {{columnTracks: Array<{start: number, end: number}>, rowTracks: Array<{start: number, end: number}>}} The grid tracks.
 */
export function getGridTrackPositions( gridElement ) {
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
 * box. Offsets ignore CSS transforms and the `rotate` property, so a rotated
 * item is measured by the area it takes up in the grid.
 *
 * @param {HTMLElement} gridItemElement The grid item element.
 *
 * @return {{left: number, top: number, right: number, bottom: number}} The item's position.
 */
export function getGridItemPixelRect( gridItemElement ) {
	const gridElement = gridItemElement.parentElement;
	let left = gridItemElement.offsetLeft;
	let top = gridItemElement.offsetTop;
	if ( gridItemElement.offsetParent !== gridElement ) {
		left -= gridElement.offsetLeft + gridElement.clientLeft;
		top -= gridElement.offsetTop + gridElement.clientTop;
	}
	left -= parseFloat( getComputedCSS( gridElement, 'padding-left' ) ) || 0;
	top -= parseFloat( getComputedCSS( gridElement, 'padding-top' ) ) || 0;
	return {
		left,
		top,
		right: left + gridItemElement.offsetWidth,
		bottom: top + gridItemElement.offsetHeight,
	};
}

/**
 * Gets the grid cells that a rectangle in pixels covers, snapping its edges to
 * the closest tracks.
 *
 * @param {{left: number, top: number, right: number, bottom: number}} rect         Rectangle relative to the grid's content box.
 * @param {Array<{start: number, end: number}>}                        columnTracks Column tracks.
 * @param {Array<{start: number, end: number}>}                        rowTracks    Row tracks.
 *
 * @return {GridRect} The grid cells.
 */
export function getGridRectFromPixelRect( rect, columnTracks, rowTracks ) {
	return new GridRect( {
		columnStart: getClosestTrack( columnTracks, rect.left ) + 1,
		rowStart: getClosestTrack( rowTracks, rect.top ) + 1,
		columnEnd: getClosestTrack( columnTracks, rect.right, 'end' ) + 1,
		rowEnd: getClosestTrack( rowTracks, rect.bottom, 'end' ) + 1,
	} );
}

/**
 * Sets an inline style on an element, or removes it when the value is empty.
 * Used for previews that should not go through block attributes, such as the
 * rotation while the rotate handle is dragged.
 *
 * @param {HTMLElement} element  The element.
 * @param {string}      property The CSS property, in camel case.
 * @param {string}      value    The value, or an empty string to remove it.
 */
export function setInlineStyle( element, property, value ) {
	element.style[ property ] = value;
}
