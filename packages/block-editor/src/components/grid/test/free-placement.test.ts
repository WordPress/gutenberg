import { describe, expect, it } from 'vitest';
import {
	clampPixelRect,
	extendTracks,
	getEqualTracks,
	getGridPlacementFromPixelRect,
	getPixelRectFromGridPlacement,
	getResizedGridPlacement,
	snapPixelRectEdges,
	snapPixelRectPosition,
	type PixelRectCorner,
	type PixelRectEdge,
} from '../free-placement';
import { getGridTracks } from '../utils';

// Four 100px columns and four 100px rows, with 10px gaps: tracks start at
// 0, 110, 220 and 330, and the grid ends at 430.
const columnTracks = getGridTracks( '100px 100px 100px 100px', 10 );
const rowTracks = getGridTracks( '100px 100px 100px 100px', 10 );
const bounds = { left: 0, top: 0, right: 430, bottom: 430 };

describe( 'getGridPlacementFromPixelRect', () => {
	it( 'returns cells only when the edges are on lines', () => {
		expect(
			getGridPlacementFromPixelRect(
				{ left: 110, top: 0, right: 320, bottom: 100 },
				columnTracks,
				rowTracks
			)
		).toEqual( { columnStart: 2, columnSpan: 2, rowStart: 1, rowSpan: 1 } );
	} );

	it( 'returns the containing cells and the box inside them', () => {
		expect(
			getGridPlacementFromPixelRect(
				{ left: 50, top: 20, right: 260, bottom: 90 },
				columnTracks,
				rowTracks
			)
		).toEqual( {
			columnStart: 1,
			columnSpan: 3,
			rowStart: 1,
			rowSpan: 1,
			box: { left: 0.1563, top: 0.0625, width: 0.6563, height: 0.7 },
		} );
	} );

	it( 'treats edges within half a pixel as on the line', () => {
		expect(
			getGridPlacementFromPixelRect(
				{ left: 110.4, top: 0, right: 320, bottom: 100.3 },
				columnTracks,
				rowTracks
			)
		).toEqual( { columnStart: 2, columnSpan: 2, rowStart: 1, rowSpan: 1 } );
	} );

	it( 'keeps an edge that is in a gap in the cell before it', () => {
		expect(
			getGridPlacementFromPixelRect(
				{ left: 105, top: 0, right: 320, bottom: 100 },
				columnTracks,
				rowTracks
			)
		).toEqual( {
			columnStart: 1,
			columnSpan: 3,
			rowStart: 1,
			rowSpan: 1,
			box: { left: 0.3281, top: 0, width: 0.6719, height: 1 },
		} );
	} );
} );

describe( 'getGridPlacementFromPixelRect with measured pixels', () => {
	// Three columns in a 1000px grid with 24px gaps start at 0, 341.33 and
	// 682.67, which the canvas measures in whole pixels.
	const thirds = getEqualTracks( { count: 3, size: 1000, gap: 24 } );
	const rows = getEqualTracks( { count: 3, size: 1000, gap: 24 } );

	it( 'never gives a box that starts before its cells', () => {
		const { box } = getGridPlacementFromPixelRect(
			{ left: 341, top: 0, right: 658, bottom: 200 },
			thirds,
			rows
		);
		expect( box?.left ).toBe( 0 );
		expect( box?.width ).toBeLessThanOrEqual( 1 );
	} );

	it( 'does not add a cell for an edge rounded just past a line', () => {
		expect(
			getGridPlacementFromPixelRect(
				{ left: 341, top: 0, right: 659, bottom: 318 },
				thirds,
				rows
			)
		).toEqual( { columnStart: 2, columnSpan: 1, rowStart: 1, rowSpan: 1 } );
	} );
} );

describe( 'getPixelRectFromGridPlacement', () => {
	it( 'inverts getGridPlacementFromPixelRect', () => {
		const rect = { left: 50, top: 20, right: 260, bottom: 90 };
		const result = getPixelRectFromGridPlacement(
			getGridPlacementFromPixelRect( rect, columnTracks, rowTracks ),
			columnTracks,
			rowTracks
		);
		const edges: PixelRectEdge[] = [ 'left', 'top', 'right', 'bottom' ];
		for ( const edge of edges ) {
			expect( result?.[ edge ] ).toBeCloseTo( rect[ edge ], 1 );
		}
	} );

	it( 'returns the cells for a placement without a box', () => {
		expect(
			getPixelRectFromGridPlacement(
				{ columnStart: 2, columnSpan: 2, rowStart: 1, rowSpan: 1 },
				columnTracks,
				rowTracks
			)
		).toEqual( { left: 110, top: 0, right: 320, bottom: 100 } );
	} );

	it( 'returns null for cells outside the tracks', () => {
		expect(
			getPixelRectFromGridPlacement(
				{ columnStart: 4, columnSpan: 2, rowStart: 1, rowSpan: 1 },
				columnTracks,
				rowTracks
			)
		).toBeNull();
	} );
} );

describe( 'clampPixelRect', () => {
	it( 'keeps a rect inside and moves rather than shrinks it', () => {
		expect(
			clampPixelRect(
				{ left: -20, top: 400, right: 80, bottom: 500 },
				bounds
			)
		).toEqual( { left: 0, top: 330, right: 100, bottom: 430 } );
	} );

	it( 'uses the rotated outline', () => {
		// Rotated 90°, the outline is 40..60 across and -40..60 down.
		const result = clampPixelRect(
			{ left: 0, top: 0, right: 100, bottom: 20 },
			bounds,
			90
		);
		expect( result.left ).toBeCloseTo( 0 );
		expect( result.top ).toBeCloseTo( 40 );
		expect( result.right ).toBeCloseTo( 100 );
		expect( result.bottom ).toBeCloseTo( 60 );
	} );

	it( 'aligns a rect bigger than the bounds to the top left', () => {
		expect(
			clampPixelRect(
				{ left: 10, top: 10, right: 510, bottom: 60 },
				bounds
			)
		).toEqual( { left: 0, top: 10, right: 500, bottom: 60 } );
	} );
} );

describe( 'snapPixelRectPosition', () => {
	it( 'moves the corner and keeps the size', () => {
		expect(
			snapPixelRectPosition(
				{ left: 100, top: 5, right: 150, bottom: 45 },
				columnTracks,
				rowTracks
			)
		).toEqual( { left: 110, top: 0, right: 160, bottom: 40 } );
	} );
} );

describe( 'snapPixelRectEdges', () => {
	it( 'moves only the named edges', () => {
		expect(
			snapPixelRectEdges(
				{ left: 50, top: 20, right: 200, bottom: 90 },
				[ 'right' ],
				columnTracks,
				rowTracks
			)
		).toEqual( { left: 50, top: 20, right: 210, bottom: 90 } );
	} );

	it( 'snaps start edges to track starts', () => {
		expect(
			snapPixelRectEdges(
				{ left: 50, top: 20, right: 200, bottom: 90 },
				[ 'left', 'top' ],
				columnTracks,
				rowTracks
			)
		).toEqual( { left: 0, top: 0, right: 200, bottom: 90 } );
	} );
} );

describe( 'extendTracks', () => {
	it( 'adds average-sized tracks past the end', () => {
		const tracks = extendTracks( rowTracks, 600, 10 );
		expect( tracks ).toHaveLength( 6 );
		expect( tracks[ 5 ] ).toEqual( { start: 550, end: 650 } );
	} );

	it( 'returns the tracks unchanged when the position is inside', () => {
		expect( extendTracks( rowTracks, 400, 10 ) ).toEqual( rowTracks );
	} );
} );

describe( 'getEqualTracks', () => {
	it( 'splits a size with gaps', () => {
		expect( getEqualTracks( { count: 2, size: 210, gap: 10 } ) ).toEqual( [
			{ start: 0, end: 100 },
			{ start: 110, end: 210 },
		] );
	} );
} );

describe( 'getResizedGridPlacement', () => {
	const options = { columnTracks, rowTracks, rowGap: 10 };

	it( 'resizes freely', () => {
		expect(
			getResizedGridPlacement( {
				...options,
				pixelRect: { left: 110, top: 0, right: 260, bottom: 100 },
				direction: 'right',
				snap: false,
			} )
		).toEqual( {
			columnStart: 2,
			columnSpan: 2,
			rowStart: 1,
			rowSpan: 1,
			box: { left: 0, top: 0, width: 0.7143, height: 1 },
		} );
	} );

	it( 'snaps only the dragged edge with Shift', () => {
		expect(
			getResizedGridPlacement( {
				...options,
				pixelRect: { left: 50, top: 0, right: 260, bottom: 100 },
				direction: 'right',
				snap: true,
			} )
		).toEqual( {
			columnStart: 1,
			columnSpan: 2,
			rowStart: 1,
			rowSpan: 1,
			box: { left: 0.2381, top: 0, width: 0.7619, height: 1 },
		} );
	} );

	it( 'grows past the last row', () => {
		expect(
			getResizedGridPlacement( {
				...options,
				pixelRect: { left: 0, top: 330, right: 100, bottom: 600 },
				direction: 'bottom',
				snap: false,
			} )
		).toEqual( {
			columnStart: 1,
			columnSpan: 1,
			rowStart: 4,
			rowSpan: 3,
			box: { left: 0, top: 0, width: 1, height: 0.8438 },
		} );
	} );

	it( 'clamps the left edge to the grid', () => {
		expect(
			getResizedGridPlacement( {
				...options,
				pixelRect: { left: -30, top: 0, right: 100, bottom: 100 },
				direction: 'left',
				snap: false,
			} )
		).toEqual( { columnStart: 1, columnSpan: 1, rowStart: 1, rowSpan: 1 } );
	} );

	it( 'resizes from a corner', () => {
		expect(
			getResizedGridPlacement( {
				...options,
				pixelRect: {
					left: 110,
					top: 0,
					right: 260,
					bottom: 100,
				},
				direction: 'bottomRight',
				snap: false,
			} )
		).toEqual( {
			columnStart: 2,
			columnSpan: 2,
			rowStart: 1,
			rowSpan: 1,
			box: { left: 0, top: 0, width: 0.7143, height: 1 },
		} );
	} );

	it( 'resizes from the top-left corner', () => {
		expect(
			getResizedGridPlacement( {
				...options,
				pixelRect: {
					left: 220,
					top: 100,
					right: 320,
					bottom: 200,
				},
				direction: 'topLeft' as PixelRectCorner,
				snap: false,
			} )
		).toEqual( {
			columnStart: 3,
			columnSpan: 1,
			rowStart: 1,
			rowSpan: 2,
			box: { left: 0, top: 1, width: 1, height: 0.4762 },
		} );
	} );

	it( 'snaps both edges of a corner with Shift', () => {
		expect(
			getResizedGridPlacement( {
				...options,
				pixelRect: {
					left: 50,
					top: 50,
					right: 260,
					bottom: 200,
				},
				direction: 'topLeft' as PixelRectCorner,
				snap: true,
			} )
		).toEqual( {
			columnStart: 1,
			columnSpan: 3,
			rowStart: 1,
			rowSpan: 2,
			box: { left: 0, top: 0, width: 0.8125, height: 0.9524 },
		} );
	} );
} );
