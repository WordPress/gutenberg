import { describe, expect, it } from 'vitest';
import {
	getFreeGridDropTarget,
	getGrabPoint,
	getGridDropTarget,
	getPixelRectFromGridRect,
} from '../get-grid-drop-target';
import { getGridTracks } from '../utils';
import type { GridRect } from '../utils';

// Three 100px columns and three 50px rows, with 10px gaps.
const columnTracks = getGridTracks( '100px 100px 100px', 10 );
const rowTracks = getGridTracks( '50px 50px 50px', 10 );

function toPlain( rect: GridRect ) {
	return {
		columnStart: rect.columnStart,
		rowStart: rect.rowStart,
		columnSpan: rect.columnSpan,
		rowSpan: rect.rowSpan,
	};
}

describe( 'getGridDropTarget()', () => {
	it( 'lands a 1x1 block in the cell under the pointer', () => {
		expect(
			toPlain(
				getGridDropTarget( {
					x: 230,
					y: 70,
					columnTracks,
					rowTracks,
				} )
			)
		).toEqual( { columnStart: 3, rowStart: 2, columnSpan: 1, rowSpan: 1 } );
	} );

	it( 'treats the pointer as the center of the block', () => {
		// A 2x2 block centered on the gap corner between cells 2/2 and 3/3.
		expect(
			toPlain(
				getGridDropTarget( {
					x: 215,
					y: 115,
					columnTracks,
					rowTracks,
					columnSpan: 2,
					rowSpan: 2,
				} )
			)
		).toEqual( { columnStart: 2, rowStart: 2, columnSpan: 2, rowSpan: 2 } );
	} );

	it( 'centers the block by its measured size', () => {
		// The cells a block spans give a 100px wide block, which lands in
		// column 2. Measured at 300px wide, its left edge is in column 1.
		const options = { x: 160, y: 25, columnTracks, rowTracks };
		expect( getGridDropTarget( options ).columnStart ).toBe( 2 );
		expect(
			getGridDropTarget( { ...options, width: 300, height: 50 } )
				.columnStart
		).toBe( 1 );
	} );

	it( 'keeps the point the block was grabbed at under the pointer', () => {
		// A 2x2 block in cells 2/2, from 110,60 to 320,170, grabbed 20px
		// right and 10px down from its corner, then moved 10px down and
		// right. Treated as its center, the pointer would land it in 1/1.
		expect(
			toPlain(
				getGridDropTarget( {
					x: 140,
					y: 80,
					columnTracks,
					rowTracks,
					columnSpan: 2,
					rowSpan: 2,
					grabX: 20,
					grabY: 10,
				} )
			)
		).toEqual( { columnStart: 2, rowStart: 2, columnSpan: 2, rowSpan: 2 } );
	} );

	it( 'clamps the landing area against the right and bottom edges', () => {
		expect(
			toPlain(
				getGridDropTarget( {
					x: 290,
					y: 160,
					columnTracks,
					rowTracks,
					columnSpan: 2,
					rowSpan: 2,
				} )
			)
		).toEqual( { columnStart: 2, rowStart: 2, columnSpan: 2, rowSpan: 2 } );
	} );

	it( 'clamps the landing area against the left and top edges', () => {
		expect(
			toPlain(
				getGridDropTarget( {
					x: 10,
					y: 10,
					columnTracks,
					rowTracks,
					columnSpan: 2,
					rowSpan: 2,
				} )
			)
		).toEqual( { columnStart: 1, rowStart: 1, columnSpan: 2, rowSpan: 2 } );
	} );

	it( 'shrinks a block bigger than the grid to fit it', () => {
		expect(
			toPlain(
				getGridDropTarget( {
					x: 230,
					y: 10,
					columnTracks,
					rowTracks,
					columnSpan: 5,
					rowSpan: 4,
				} )
			)
		).toEqual( { columnStart: 1, rowStart: 1, columnSpan: 3, rowSpan: 3 } );
	} );

	it( 'handles uneven track sizes', () => {
		const unevenColumns = getGridTracks( '40px 200px 60px', 10 );
		expect(
			getGridDropTarget( {
				x: 150,
				y: 25,
				columnTracks: unevenColumns,
				rowTracks,
				width: 200,
			} ).columnStart
		).toBe( 2 );
		expect(
			getGridDropTarget( {
				x: 290,
				y: 25,
				columnTracks: unevenColumns,
				rowTracks,
				width: 60,
			} ).columnStart
		).toBe( 3 );
	} );
} );

describe( 'getPixelRectFromGridRect()', () => {
	it( 'converts cells to pixels, excluding the trailing gap', () => {
		expect(
			getPixelRectFromGridRect(
				getGridDropTarget( {
					x: 215,
					y: 70,
					columnTracks,
					rowTracks,
					columnSpan: 2,
				} ),
				columnTracks,
				rowTracks
			)
		).toEqual( { left: 110, top: 60, right: 320, bottom: 110 } );
	} );

	it( 'returns null for cells outside the tracks', () => {
		expect(
			getPixelRectFromGridRect(
				{ columnStart: 3, columnEnd: 4, rowStart: 1, rowEnd: 1 },
				columnTracks,
				rowTracks
			)
		).toBeNull();
	} );
} );

describe( 'getGrabPoint()', () => {
	const pixelRect = { left: 100, top: 50, right: 300, bottom: 150 };

	it( 'keeps the point a block was grabbed at by its body', () => {
		expect( getGrabPoint( { x: 120, y: 60, pixelRect } ) ).toEqual( {
			grabX: 20,
			grabY: 10,
		} );
	} );

	it( 'centers a block when the pointer is outside it', () => {
		expect( getGrabPoint( { x: 320, y: 170, pixelRect } ) ).toEqual( {} );
	} );

	it( 'keeps the offset of a drag handle outside the block', () => {
		expect(
			getGrabPoint( { x: 320, y: 170, pixelRect, isHandleDrag: true } )
		).toEqual( { grabX: 220, grabY: 120 } );
	} );

	it( 'centers a block that is not in the grid', () => {
		expect(
			getGrabPoint( {
				x: 120,
				y: 60,
				pixelRect: null,
				isHandleDrag: true,
			} )
		).toEqual( {} );
	} );
} );

describe( 'getFreeGridDropTarget', () => {
	// Four 100px columns and rows, with 10px gaps: the grid ends at 430.
	const freeColumnTracks = getGridTracks( '100px 100px 100px 100px', 10 );
	const freeRowTracks = getGridTracks( '100px 100px 100px 100px', 10 );
	const options = {
		columnTracks: freeColumnTracks,
		rowTracks: freeRowTracks,
		width: 100,
		height: 80,
		grabX: 50,
		grabY: 40,
	};

	it( 'drops at the exact point without Shift', () => {
		const { placement, pixelRect } = getFreeGridDropTarget( {
			...options,
			x: 160,
			y: 60,
		} );
		expect( pixelRect ).toEqual( {
			left: 110,
			top: 20,
			right: 210,
			bottom: 100,
		} );
		expect( placement ).toEqual( {
			columnStart: 2,
			columnSpan: 1,
			rowStart: 1,
			rowSpan: 1,
			box: { left: 0, top: 0.2, width: 1, height: 0.8 },
		} );
	} );

	it( 'snaps the corner and keeps the size with Shift', () => {
		const { placement, pixelRect } = getFreeGridDropTarget( {
			...options,
			x: 160,
			y: 60,
			snap: true,
		} );
		expect( pixelRect ).toEqual( {
			left: 110,
			top: 0,
			right: 210,
			bottom: 80,
		} );
		expect( placement.box ).toEqual( {
			left: 0,
			top: 0,
			width: 1,
			height: 0.8,
		} );
	} );

	it( 'returns cells without a box when the block fills them', () => {
		expect(
			getFreeGridDropTarget( {
				...options,
				height: 100,
				grabY: 50,
				x: 160,
				y: 160,
				snap: true,
			} ).placement
		).toEqual( { columnStart: 2, columnSpan: 1, rowStart: 2, rowSpan: 1 } );
	} );

	it( 'stays inside the grid', () => {
		const { pixelRect } = getFreeGridDropTarget( {
			...options,
			x: 1000,
			y: -50,
		} );
		expect( pixelRect.right ).toBe( 430 );
		expect( pixelRect.top ).toBe( 0 );
	} );

	it( 'block from outside uses span size', () => {
		const { pixelRect } = getFreeGridDropTarget( {
			columnTracks: freeColumnTracks,
			rowTracks: freeRowTracks,
			columnSpan: 2,
			x: 215,
			y: 50,
		} );
		expect( pixelRect ).toEqual( {
			left: 110,
			top: 0,
			right: 320,
			bottom: 100,
		} );
	} );

	it( 'clamps a rotated block by its outline', () => {
		// A 100×20 block rotated 90° reaches 40px above and below its box.
		const { pixelRect } = getFreeGridDropTarget( {
			columnTracks: freeColumnTracks,
			rowTracks: freeRowTracks,
			width: 100,
			height: 20,
			grabX: 50,
			grabY: 10,
			angle: 90,
			x: 50,
			y: 10,
		} );
		expect( pixelRect.top ).toBeCloseTo( 40 );
	} );

	it( 'keeps a rotated block inside the grid without its rotation too', () => {
		// A 300×100 block rotated 90° at the left edge would need to start
		// before the grid for its outline to touch the edge.
		const { pixelRect, placement } = getFreeGridDropTarget( {
			columnTracks: freeColumnTracks,
			rowTracks: freeRowTracks,
			width: 300,
			height: 100,
			grabX: 150,
			grabY: 50,
			angle: 90,
			x: 0,
			y: 200,
		} );
		expect( pixelRect.left ).toBeGreaterThanOrEqual( 0 );
		expect( placement.box?.left ?? 0 ).toBeGreaterThanOrEqual( 0 );
	} );
} );
