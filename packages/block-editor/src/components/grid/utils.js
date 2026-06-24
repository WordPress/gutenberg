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

function getNumericCSS( element, property ) {
	return parseFloat( getComputedCSS( element, property ) ) || 0;
}

function createDOMRect( element, left, top, width, height ) {
	return new element.ownerDocument.defaultView.DOMRect(
		left,
		top,
		width,
		height
	);
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
		const parsedSize = parseFloat( size );
		if ( Number.isNaN( parsedSize ) ) {
			continue;
		}
		const previousTrack = tracks[ tracks.length - 1 ];
		const start = previousTrack ? previousTrack.end + gap : 0;
		const end = start + parsedSize;
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
	const columnGap = getNumericCSS( gridElement, 'column-gap' );
	const rowGap = getNumericCSS( gridElement, 'row-gap' );
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

function parseGridLine( value ) {
	const normalizedValue = value?.trim();
	if ( ! normalizedValue || normalizedValue === 'auto' ) {
		return {};
	}

	const spanMatch = normalizedValue.match( /^span\s+(\d+)$/ );
	if ( spanMatch ) {
		return { span: parseInt( spanMatch[ 1 ], 10 ) };
	}

	if ( /^-?\d+$/.test( normalizedValue ) ) {
		return { line: parseInt( normalizedValue, 10 ) };
	}

	return {};
}

function getGridItemRectFromOffsets( gridItemElement ) {
	return getGridRect(
		gridItemElement.parentElement,
		createDOMRect(
			gridItemElement,
			gridItemElement.offsetLeft,
			gridItemElement.offsetTop,
			gridItemElement.offsetWidth,
			gridItemElement.offsetHeight
		)
	);
}

function resolveGridLine( line, trackCount ) {
	if ( line === undefined ) {
		return undefined;
	}

	return line < 0 ? trackCount + line + 2 : line;
}

function getAxisPlacement( startValue, endValue, trackCount ) {
	const start = parseGridLine( startValue );
	const end = parseGridLine( endValue );
	const startLine = resolveGridLine( start.line, trackCount );
	const endLine = resolveGridLine( end.line, trackCount );
	const span = Math.min(
		start.span ||
			end.span ||
			( startLine && endLine ? Math.max( 1, endLine - startLine ) : 1 ),
		trackCount
	);

	return {
		start:
			startLine ??
			( endLine ? Math.max( 1, endLine - span ) : undefined ),
		span,
	};
}

function getGridItemPlacement(
	gridItemElement,
	gridColumnCount,
	gridRowCount
) {
	const column = getAxisPlacement(
		getComputedCSS( gridItemElement, 'grid-column-start' ),
		getComputedCSS( gridItemElement, 'grid-column-end' ),
		gridColumnCount
	);
	const row = getAxisPlacement(
		getComputedCSS( gridItemElement, 'grid-row-start' ),
		getComputedCSS( gridItemElement, 'grid-row-end' ),
		gridRowCount
	);

	return {
		columnStart: column.start,
		columnSpan: column.span,
		rowStart: row.start,
		rowSpan: row.span,
	};
}

function normalizeAlignment( value ) {
	const alignment = value?.trim();
	if ( ! alignment || alignment === 'auto' || alignment === 'normal' ) {
		return 'stretch';
	}

	const keyword = alignment.split( /\s+/ ).at( -1 );
	if ( [ 'start', 'self-start', 'flex-start', 'left' ].includes( keyword ) ) {
		return 'start';
	}
	if ( [ 'end', 'self-end', 'flex-end', 'right' ].includes( keyword ) ) {
		return 'end';
	}
	if ( keyword === 'center' ) {
		return 'center';
	}

	return 'stretch';
}

function getGridItemAlignment( gridItemElement, selfProperty, itemsProperty ) {
	const selfAlignment = getComputedCSS( gridItemElement, selfProperty );
	if ( selfAlignment?.trim() && selfAlignment.trim() !== 'auto' ) {
		return normalizeAlignment( selfAlignment );
	}

	return normalizeAlignment(
		getComputedCSS( gridItemElement.parentElement, itemsProperty )
	);
}

function getTrackSpanStart( tracks, rectStart, rectEnd, span, alignment ) {
	const lastStartIndex = Math.max( tracks.length - span, 0 );
	let closestIndex = 0;
	let closestDistance = Infinity;

	for ( let index = 0; index <= lastStartIndex; index++ ) {
		const start = tracks[ index ].start;
		const end = tracks[ index + span - 1 ].end;
		let distance;

		if ( alignment === 'start' ) {
			distance = Math.abs( start - rectStart );
		} else if ( alignment === 'end' ) {
			distance = Math.abs( end - rectEnd );
		} else if ( alignment === 'center' ) {
			distance = Math.abs(
				( start + end ) / 2 - ( rectStart + rectEnd ) / 2
			);
		} else {
			distance =
				Math.abs( start - rectStart ) + Math.abs( end - rectEnd );
		}

		if ( distance < closestDistance ) {
			closestDistance = distance;
			closestIndex = index;
		}
	}

	return closestIndex + 1;
}

export function getGridItemRect( gridItemElement ) {
	const gridElement = gridItemElement.parentElement;
	const gridColumnTracks = getGridTracks(
		getComputedCSS( gridElement, 'grid-template-columns' ),
		getNumericCSS( gridElement, 'column-gap' )
	);
	const gridRowTracks = getGridTracks(
		getComputedCSS( gridElement, 'grid-template-rows' ),
		getNumericCSS( gridElement, 'row-gap' )
	);

	if ( ! gridColumnTracks.length || ! gridRowTracks.length ) {
		return getGridItemRectFromOffsets( gridItemElement );
	}

	const { columnStart, columnSpan, rowStart, rowSpan } = getGridItemPlacement(
		gridItemElement,
		gridColumnTracks.length,
		gridRowTracks.length
	);
	const itemRect = getGridOffsetRect(
		gridElement,
		gridItemElement.getBoundingClientRect()
	);

	return new GridRect( {
		columnStart:
			columnStart ??
			getTrackSpanStart(
				gridColumnTracks,
				itemRect.left,
				itemRect.right,
				columnSpan,
				getGridItemAlignment(
					gridItemElement,
					'justify-self',
					'justify-items'
				)
			),
		rowStart:
			rowStart ??
			getTrackSpanStart(
				gridRowTracks,
				itemRect.top,
				itemRect.bottom,
				rowSpan,
				getGridItemAlignment(
					gridItemElement,
					'align-self',
					'align-items'
				)
			),
		columnSpan,
		rowSpan,
	} );
}

export function getGridContentClientRect( gridElement ) {
	const clientRect = gridElement.getBoundingClientRect();
	const borderLeftWidth = getNumericCSS( gridElement, 'border-left-width' );
	const borderRightWidth = getNumericCSS( gridElement, 'border-right-width' );
	const borderTopWidth = getNumericCSS( gridElement, 'border-top-width' );
	const borderBottomWidth = getNumericCSS(
		gridElement,
		'border-bottom-width'
	);
	const paddingLeft = getNumericCSS( gridElement, 'padding-left' );
	const paddingRight = getNumericCSS( gridElement, 'padding-right' );
	const paddingTop = getNumericCSS( gridElement, 'padding-top' );
	const paddingBottom = getNumericCSS( gridElement, 'padding-bottom' );
	const left = clientRect.left + borderLeftWidth + paddingLeft;
	const top = clientRect.top + borderTopWidth + paddingTop;
	const width =
		clientRect.width -
		borderLeftWidth -
		borderRightWidth -
		paddingLeft -
		paddingRight;
	const height =
		clientRect.height -
		borderTopWidth -
		borderBottomWidth -
		paddingTop -
		paddingBottom;

	return createDOMRect( gridElement, left, top, width, height );
}

export function getGridOffsetRect( gridElement, clientRect ) {
	const gridContentClientRect = getGridContentClientRect( gridElement );

	return createDOMRect(
		gridElement,
		clientRect.left - gridContentClientRect.left,
		clientRect.top - gridContentClientRect.top,
		clientRect.width,
		clientRect.height
	);
}

export function getGridItemAreaRect( gridItemElement ) {
	const gridElement = gridItemElement.parentElement;
	const columnGap = getNumericCSS( gridElement, 'column-gap' );
	const rowGap = getNumericCSS( gridElement, 'row-gap' );
	const gridColumnTracks = getGridTracks(
		getComputedCSS( gridElement, 'grid-template-columns' ),
		columnGap
	);
	const gridRowTracks = getGridTracks(
		getComputedCSS( gridElement, 'grid-template-rows' ),
		rowGap
	);

	if ( ! gridColumnTracks.length || ! gridRowTracks.length ) {
		return createDOMRect(
			gridElement,
			gridItemElement.offsetLeft,
			gridItemElement.offsetTop,
			gridItemElement.offsetWidth,
			gridItemElement.offsetHeight
		);
	}

	const gridRect = getGridItemRect( gridItemElement );
	const columnStartIndex = gridRect.columnStart - 1;
	const columnEndIndex = Math.min(
		gridRect.columnEnd - 1,
		gridColumnTracks.length - 1
	);
	const rowStartIndex = gridRect.rowStart - 1;
	const rowEndIndex = Math.min(
		gridRect.rowEnd - 1,
		gridRowTracks.length - 1
	);
	const left = gridColumnTracks[ columnStartIndex ]?.start ?? 0;
	const right = gridColumnTracks[ columnEndIndex ]?.end ?? left;
	const top = gridRowTracks[ rowStartIndex ]?.start ?? 0;
	const bottom = gridRowTracks[ rowEndIndex ]?.end ?? top;

	return createDOMRect( gridElement, left, top, right - left, bottom - top );
}

export function getGridItemAreaClientRect( gridItemElement ) {
	const gridElement = gridItemElement.parentElement;
	const gridContentClientRect = getGridContentClientRect( gridElement );
	const gridItemAreaRect = getGridItemAreaRect( gridItemElement );

	return createDOMRect(
		gridElement,
		gridContentClientRect.left + gridItemAreaRect.left,
		gridContentClientRect.top + gridItemAreaRect.top,
		gridItemAreaRect.width,
		gridItemAreaRect.height
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
