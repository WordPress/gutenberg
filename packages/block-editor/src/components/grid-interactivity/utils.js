export function getComputedCSS( element, property ) {
	return element.ownerDocument.defaultView
		.getComputedStyle( element )
		.getPropertyValue( property );
}

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

export function range( start, length ) {
	return Array.from( { length }, ( _, i ) => start + i );
}

export class Rect {
	constructor( { x = 0, y = 0, width = 1, height = 1 } = {} ) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	contains( x, y ) {
		return (
			x >= this.x &&
			x < this.x + this.width &&
			y >= this.y &&
			y < this.y + this.height
		);
	}

	containsRect( rect ) {
		return (
			this.contains( rect.x, rect.y ) &&
			this.contains( rect.x + rect.width - 1, rect.y + rect.height - 1 )
		);
	}
}
