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
}

export function getComputedCSS( element, property ) {
	return element.ownerDocument.defaultView
		.getComputedStyle( element )
		.getPropertyValue( property );
}

function getGridTracks( template, gap ) {
	const tracks = [];
	for ( const size of template.split( ' ' ) ) {
		const previousTrack = tracks[ tracks.length - 1 ];
		const start = previousTrack ? previousTrack.end + gap : 0;
		const end = start + parseFloat( size );
		tracks.push( { start, end } );
	}
	return tracks;
}

function getClosestTrack( tracks, position, edge = 'start' ) {
	return tracks.reduce(
		( closest, track, index ) =>
			Math.abs( track[ edge ] - position ) <
			Math.abs( tracks[ closest ][ edge ] - position )
				? index
				: closest,
		0
	);
}

export function calculateGridRect( gridElement, target ) {
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
	const offsetRect =
		target instanceof window.DOMRect
			? target
			: new window.DOMRect(
					target.offsetLeft,
					target.offsetTop,
					target.offsetWidth,
					target.offsetHeight
			  );
	const columnStart =
		getClosestTrack( gridColumnTracks, offsetRect.left ) + 1;
	const rowStart = getClosestTrack( gridRowTracks, offsetRect.top ) + 1;
	const columnEnd =
		getClosestTrack( gridColumnTracks, offsetRect.right, 'end' ) + 1;
	const rowEnd =
		getClosestTrack( gridRowTracks, offsetRect.bottom, 'end' ) + 1;
	return new GridRect( {
		columnStart,
		columnEnd,
		rowStart,
		rowEnd,
	} );
}
