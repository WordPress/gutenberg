interface GridTrack {
	start: number;
	end: number;
}

function round( value: number ): number {
	return Math.round( value * 100 ) / 100;
}

function getRect( {
	x,
	y,
	width,
	height,
	radius,
}: {
	x: number;
	y: number;
	width: number;
	height: number;
	radius: number;
} ): string {
	return `<rect x='${ round( x ) }' y='${ round( y ) }' width='${ round(
		width
	) }' height='${ round( height ) }' rx='${ radius }'/>`;
}

/**
 * Gets an SVG image of a grid's cells, measured from the grid's content box.
 * Each cell is a rounded square, 2px inside the cell, with a dark edge beside
 * a light one, so that it stands out on any background.
 *
 * @param columnTracks The grid's column tracks, in pixels.
 * @param rowTracks    The grid's row tracks, in pixels.
 *
 * @return The image's SVG markup.
 */
export function getGridCellTilesImage(
	columnTracks: GridTrack[],
	rowTracks: GridTrack[]
): string {
	const outerEdges = [];
	const innerEdges = [];
	for ( const row of rowTracks ) {
		for ( const column of columnTracks ) {
			const x = column.start + 2;
			const y = row.start + 2;
			const width = column.end - column.start - 4;
			const height = row.end - row.start - 4;
			// Too small for a tile with both edges.
			if ( width < 4 || height < 4 ) {
				continue;
			}
			// Strokes are centered on the outline, so each edge is drawn
			// half a pixel inside the one around it.
			outerEdges.push(
				getRect( {
					x: x + 0.5,
					y: y + 0.5,
					width: width - 1,
					height: height - 1,
					radius: 3.5,
				} )
			);
			innerEdges.push(
				getRect( {
					x: x + 1.5,
					y: y + 1.5,
					width: width - 3,
					height: height - 3,
					radius: 2.5,
				} )
			);
		}
	}
	const width = round( columnTracks[ columnTracks.length - 1 ]?.end ?? 0 );
	const height = round( rowTracks[ rowTracks.length - 1 ]?.end ?? 0 );
	return (
		`<svg xmlns='http://www.w3.org/2000/svg' width='${ width }' height='${ height }'>` +
		`<g fill='black' fill-opacity='.03' stroke='black' stroke-opacity='.1'>${ outerEdges.join(
			''
		) }</g>` +
		`<g fill='none' stroke='white' stroke-opacity='.16'>${ innerEdges.join(
			''
		) }</g>` +
		'</svg>'
	);
}
