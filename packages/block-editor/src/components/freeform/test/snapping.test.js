import { describe, expect, it } from 'vitest';
import {
	BASE_MESH,
	DESIGN_WIDTH,
	MARGIN,
	RHYTHM,
	SNAP_THRESHOLD,
	constrainRect,
	getDistanceLabels,
	getLatticeColumnWidth,
	getNeighbors,
	resolveDragPosition,
	resolveResize,
	snapToLatticeX,
	snapToLatticeY,
} from '../snapping';

const rect = ( x, y, width, height ) => ( { x, y, width, height } );

describe( 'getNeighbors', () => {
	it( 'finds the nearest block on each side that overlaps the other axis', () => {
		const subject = rect( 400, 400, 100, 100 );
		const others = [
			rect( 100, 420, 100, 60 ), // left, overlaps vertically
			rect( 700, 420, 100, 60 ), // right, overlaps vertically
			rect( 420, 100, 60, 100 ), // top, overlaps horizontally
			rect( 420, 700, 60, 100 ), // bottom, overlaps horizontally
		];

		expect( getNeighbors( subject, others ) ).toEqual( {
			left: others[ 0 ],
			right: others[ 1 ],
			top: others[ 2 ],
			bottom: others[ 3 ],
		} );
	} );

	it( 'ignores blocks that do not overlap on the perpendicular axis', () => {
		const subject = rect( 400, 400, 100, 100 );
		// Sits to the left, but far above: not a horizontal neighbor.
		const others = [ rect( 100, 0, 100, 60 ) ];

		expect( getNeighbors( subject, others ) ).toEqual( {
			left: null,
			right: null,
			top: null,
			bottom: null,
		} );
	} );

	it( 'prefers the closest candidate when several qualify', () => {
		const subject = rect( 400, 400, 100, 100 );
		const far = rect( 0, 420, 100, 60 );
		const near = rect( 250, 420, 100, 60 );

		expect( getNeighbors( subject, [ far, near ] ).left ).toBe( near );
	} );
} );

describe( 'resolveDragPosition alignment snapping', () => {
	const baseArgs = {
		canvasHeight: 800,
		movedX: true,
		movedY: true,
	};

	it( 'snaps a left edge onto another block’s left edge', () => {
		const result = resolveDragPosition( {
			...baseArgs,
			rect: rect( 0, 0, 100, 100 ),
			others: [ rect( 300, 400, 200, 50 ) ],
			rawX: 303,
			rawY: 0,
		} );

		expect( result.x ).toBe( 300 );
		expect( result.guideX ).toBe( 300 );
	} );

	it( 'snaps a right edge onto another block’s right edge', () => {
		const result = resolveDragPosition( {
			...baseArgs,
			rect: rect( 0, 0, 100, 100 ),
			// Spans 300..450, centre 375 — none of which can also capture the
			// dragged block's left edge or centre, so only the right edge can win.
			others: [ rect( 300, 400, 150, 50 ) ],
			// Right edge would land at 447; the other block's right edge is 450.
			rawX: 347,
			rawY: 0,
		} );

		expect( result.x ).toBe( 350 );
		expect( result.guideX ).toBe( 450 );
	} );

	it( 'snaps the horizontal centre onto the canvas centre', () => {
		const result = resolveDragPosition( {
			...baseArgs,
			rect: rect( 0, 0, 200, 100 ),
			others: [],
			rawX: DESIGN_WIDTH / 2 - 100 + 4,
			rawY: 0,
		} );

		expect( result.x ).toBe( DESIGN_WIDTH / 2 - 100 );
		expect( result.guideX ).toBe( DESIGN_WIDTH / 2 );
	} );

	it( 'snaps to the content margin', () => {
		const result = resolveDragPosition( {
			...baseArgs,
			rect: rect( 0, 0, 200, 100 ),
			others: [],
			rawX: MARGIN + 3,
			rawY: 0,
		} );

		expect( result.x ).toBe( MARGIN );
		expect( result.guideX ).toBe( MARGIN );
	} );

	it( 'does not snap past the threshold', () => {
		const result = resolveDragPosition( {
			...baseArgs,
			rect: rect( 0, 0, 100, 100 ),
			others: [ rect( 300, 400, 200, 50 ) ],
			rawX: 300 + SNAP_THRESHOLD + 2,
			rawY: 0,
		} );

		expect( result.x ).not.toBe( 300 );
		expect( result.guideX ).toBeNull();
	} );

	it( 'falls back to the base mesh when nothing is in reach', () => {
		const result = resolveDragPosition( {
			...baseArgs,
			rect: rect( 0, 0, 100, 100 ),
			others: [],
			rawX: 211,
			rawY: 307,
		} );

		expect( result.x % BASE_MESH ).toBe( 0 );
		expect( result.y % BASE_MESH ).toBe( 0 );
		expect( result.x ).toBe( 208 );
		expect( result.y ).toBe( 304 );
	} );

	it( 'bypasses every magnet when freeform is held', () => {
		const result = resolveDragPosition( {
			...baseArgs,
			rect: rect( 0, 0, 100, 100 ),
			others: [ rect( 300, 400, 200, 50 ) ],
			rawX: 302.4,
			rawY: 307.6,
			freeform: true,
		} );

		expect( result.x ).toBe( 302 );
		expect( result.y ).toBe( 308 );
		expect( result.guideX ).toBeNull();
		expect( result.guideY ).toBeNull();
	} );

	it( 'keeps an axis the pointer never moved at its original value', () => {
		const result = resolveDragPosition( {
			...baseArgs,
			rect: rect( 307, 211, 100, 100 ),
			others: [],
			rawX: 400,
			rawY: 211,
			movedY: false,
		} );

		expect( result.y ).toBe( 211 );
		expect( result.guideY ).toBeNull();
	} );

	it( 'pins the locked axis when an axis lock is held', () => {
		const result = resolveDragPosition( {
			...baseArgs,
			rect: rect( 307, 211, 100, 100 ),
			others: [ rect( 300, 400, 200, 50 ) ],
			rawX: 400,
			rawY: 403,
			lockedAxis: 'y',
		} );

		expect( result.y ).toBe( 211 );
		expect( result.guideY ).toBeNull();
	} );

	it( 'clamps the result inside the canvas', () => {
		const result = resolveDragPosition( {
			...baseArgs,
			rect: rect( 0, 0, 200, 100 ),
			others: [],
			rawX: DESIGN_WIDTH + 500,
			rawY: -200,
		} );

		expect( result.x ).toBe( DESIGN_WIDTH - 200 );
		expect( result.y ).toBe( 0 );
	} );
} );

describe( 'resolveDragPosition spacing intelligence', () => {
	const baseArgs = {
		canvasHeight: 800,
		movedX: true,
		movedY: true,
	};

	it( 'snaps to the exact midpoint between two neighbours', () => {
		// Left neighbour ends at 300, right neighbour starts at 800.
		// A 100-wide block centred in that gap starts at (300 + 800 - 100) / 2 = 500.
		const result = resolveDragPosition( {
			...baseArgs,
			rect: rect( 0, 400, 100, 100 ),
			others: [ rect( 100, 400, 200, 100 ), rect( 800, 400, 200, 100 ) ],
			rawX: 504,
			rawY: 400,
		} );

		expect( result.x ).toBe( 500 );
		expect( result.equalX ).toBe( true );
		expect( result.guideX ).toBeNull();
	} );

	it( 'equal spacing wins over a competing alignment magnet', () => {
		// An alignment candidate sits at 502 (another block's left edge) but the
		// true midpoint is 500: the midpoint must win or equal gaps are unreachable.
		const result = resolveDragPosition( {
			...baseArgs,
			rect: rect( 0, 400, 100, 100 ),
			others: [
				rect( 100, 400, 200, 100 ),
				rect( 800, 400, 200, 100 ),
				rect( 502, 0, 50, 50 ),
			],
			rawX: 503,
			rawY: 400,
		} );

		expect( result.x ).toBe( 500 );
		expect( result.equalX ).toBe( true );
	} );

	it( 'offers the gap a run already keeps, so a fourth item lands in step', () => {
		// Two 100-wide blocks at 100 and 250 keep a gap of 50.
		// Dragging a third towards 400 should land it at 400 (250 + 100 + 50).
		const result = resolveDragPosition( {
			...baseArgs,
			rect: rect( 0, 400, 100, 100 ),
			others: [ rect( 100, 400, 100, 100 ), rect( 250, 400, 100, 100 ) ],
			rawX: 404,
			rawY: 400,
		} );

		expect( result.x ).toBe( 400 );
		expect( result.repeatX ).toEqual(
			expect.objectContaining( { gap: 50, side: 'left' } )
		);
	} );

	it( 'offers a rhythm gap from a lone neighbour', () => {
		// One neighbour ending at 300; RHYTHM away is 324.
		const result = resolveDragPosition( {
			...baseArgs,
			rect: rect( 0, 400, 100, 100 ),
			others: [ rect( 100, 400, 200, 100 ) ],
			rawX: 321,
			rawY: 400,
		} );

		expect( result.x ).toBe( 300 + RHYTHM );
		expect( result.rhythmX ).toEqual(
			expect.objectContaining( { gap: RHYTHM, side: 'left' } )
		);
	} );

	it( 'applies equal spacing on the vertical axis too', () => {
		// Top neighbour ends at 200, bottom starts at 600; a 100-tall block
		// centred in the gap starts at (200 + 600 - 100) / 2 = 350.
		const result = resolveDragPosition( {
			...baseArgs,
			rect: rect( 400, 0, 100, 100 ),
			others: [ rect( 400, 100, 100, 100 ), rect( 400, 600, 100, 100 ) ],
			rawX: 400,
			rawY: 353,
		} );

		expect( result.y ).toBe( 350 );
		expect( result.equalY ).toBe( true );
	} );

	it( 'does not offer spacing magnets while freeform is held', () => {
		const result = resolveDragPosition( {
			...baseArgs,
			rect: rect( 0, 400, 100, 100 ),
			others: [ rect( 100, 400, 200, 100 ), rect( 800, 400, 200, 100 ) ],
			rawX: 504,
			rawY: 400,
			freeform: true,
		} );

		expect( result.equalX ).toBe( false );
		expect( result.x ).toBe( 504 );
	} );
} );

describe( 'resolveResize', () => {
	const baseArgs = {
		canvasHeight: 800,
		others: [],
	};

	it( 'grows the width from an east handle', () => {
		const result = resolveResize( {
			...baseArgs,
			rect: rect( 100, 100, 200, 100 ),
			direction: 'e',
			// Lands the edge on 400, already a base-mesh multiple.
			deltaX: 100,
			deltaY: 0,
		} );

		expect( result.rect ).toEqual( rect( 100, 100, 300, 100 ) );
	} );

	it( 'moves the origin as well as the size from a west handle', () => {
		const result = resolveResize( {
			...baseArgs,
			rect: rect( 100, 100, 200, 100 ),
			direction: 'w',
			// Lands the edge on 48, already a base-mesh multiple.
			deltaX: -52,
			deltaY: 0,
		} );

		expect( result.rect ).toEqual( rect( 48, 100, 252, 100 ) );
	} );

	it( 'rounds a freely dragged edge to the base mesh', () => {
		const result = resolveResize( {
			...baseArgs,
			rect: rect( 100, 100, 200, 100 ),
			direction: 'e',
			// Edge would land at 404; the nearest mesh line is 408.
			deltaX: 104,
			deltaY: 0,
		} );

		expect( result.rect.width ).toBe( 308 );
		expect( ( result.rect.x + result.rect.width ) % BASE_MESH ).toBe( 0 );
	} );

	it( 'snaps an edge onto a neighbour’s edge and reports the guide', () => {
		const result = resolveResize( {
			...baseArgs,
			rect: rect( 100, 100, 200, 100 ),
			others: [ rect( 500, 400, 100, 100 ) ],
			direction: 'e',
			deltaX: 203,
			deltaY: 0,
		} );

		expect( result.rect.width ).toBe( 400 );
		expect( result.guideX ).toBe( 500 );
	} );

	it( 'offers a neighbour’s width as a magnet and labels it', () => {
		const result = resolveResize( {
			...baseArgs,
			rect: rect( 100, 100, 200, 100 ),
			// A 333-wide neighbour, nowhere near the dragged edge positionally.
			others: [ rect( 700, 700, 333, 40 ) ],
			direction: 'e',
			deltaX: 131,
			deltaY: 0,
		} );

		expect( result.rect.width ).toBe( 333 );
		expect( result.sizeLabelX ).toBe( 'width' );
	} );

	it( 'offers a neighbour’s height as a magnet and labels it', () => {
		const result = resolveResize( {
			...baseArgs,
			rect: rect( 100, 100, 200, 100 ),
			others: [ rect( 700, 700, 40, 155 ) ],
			direction: 's',
			deltaX: 0,
			deltaY: 52,
		} );

		expect( result.rect.height ).toBe( 155 );
		expect( result.sizeLabelY ).toBe( 'height' );
	} );

	it( 'never resizes below the minimum', () => {
		const result = resolveResize( {
			...baseArgs,
			rect: rect( 100, 100, 200, 100 ),
			direction: 'e',
			deltaX: -400,
			deltaY: 0,
		} );

		expect( result.rect.width ).toBeGreaterThan( 0 );
	} );

	it( 'keeps the rect inside the canvas', () => {
		const result = resolveResize( {
			...baseArgs,
			rect: rect( 1000, 100, 200, 100 ),
			direction: 'e',
			deltaX: 400,
			deltaY: 0,
		} );

		expect( result.rect.x + result.rect.width ).toBeLessThanOrEqual(
			DESIGN_WIDTH
		);
	} );
} );

describe( 'getDistanceLabels', () => {
	it( 'measures the gap to each neighbour', () => {
		const labels = getDistanceLabels( {
			rect: rect( 400, 400, 100, 100 ),
			others: [ rect( 100, 400, 200, 100 ) ],
			canvasHeight: 800,
		} );
		const horizontal = labels.filter( ( l ) => l.axis === 'horizontal' );

		expect( horizontal ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( { distance: 100, start: 300 } ),
			] )
		);
	} );

	it( 'measures to the canvas edge when a side has no neighbour', () => {
		const labels = getDistanceLabels( {
			rect: rect( 400, 400, 100, 100 ),
			others: [],
			canvasHeight: 800,
		} );

		expect( labels ).toEqual(
			expect.arrayContaining( [
				// Left edge of the canvas.
				expect.objectContaining( {
					axis: 'horizontal',
					start: 0,
					distance: 400,
				} ),
				// Right edge of the canvas.
				expect.objectContaining( {
					axis: 'horizontal',
					start: 500,
					distance: DESIGN_WIDTH - 500,
				} ),
			] )
		);
	} );

	it( 'marks both gaps equal when they are', () => {
		const labels = getDistanceLabels( {
			rect: rect( 400, 400, 100, 100 ),
			others: [ rect( 200, 400, 100, 100 ), rect( 600, 400, 100, 100 ) ],
			canvasHeight: 800,
			isEqualX: true,
		} );
		const horizontal = labels.filter( ( l ) => l.axis === 'horizontal' );

		expect( horizontal ).toHaveLength( 2 );
		expect( horizontal.every( ( l ) => l.isEqual ) ).toBe( true );
		expect( horizontal.map( ( l ) => l.distance ) ).toEqual( [ 100, 100 ] );
	} );

	it( 'skips gaps too small to label', () => {
		const labels = getDistanceLabels( {
			rect: rect( 400, 400, 100, 100 ),
			others: [ rect( 200, 400, 198, 100 ) ],
			canvasHeight: 800,
		} );

		expect(
			labels.filter( ( l ) => l.axis === 'horizontal' && l.start === 398 )
		).toHaveLength( 0 );
	} );
} );

describe( 'constrainRect', () => {
	it( 'keeps a rect inside the canvas width', () => {
		expect( constrainRect( rect( 1150, 10, 200, 50 ), 800 ) ).toEqual(
			rect( DESIGN_WIDTH - 200, 10, 200, 50 )
		);
	} );

	it( 'never pushes a rect above the canvas top', () => {
		expect( constrainRect( rect( 10, -40, 200, 50 ), 800 ) ).toEqual(
			rect( 10, 0, 200, 50 )
		);
	} );

	it( 'allows a rect to extend past the current canvas height', () => {
		// The canvas grows to fit its content, so the bottom is not a wall.
		expect( constrainRect( rect( 10, 900, 200, 50 ), 800 ) ).toEqual(
			rect( 10, 900, 200, 50 )
		);
	} );
} );

describe( 'the painted lattice', () => {
	const baseArgs = {
		canvasHeight: 800,
		movedX: true,
		movedY: true,
		lattice: true,
	};

	it( 'lands an outer edge on a drawn column line', () => {
		const result = resolveDragPosition( {
			...baseArgs,
			rect: rect( 0, 0, 100, 100 ),
			others: [],
			// The third column starts at 161. The base mesh would say 160.
			rawX: 158,
			rawY: 0,
			movedY: false,
		} );

		expect( result.x ).toBe( 161 );
	} );

	it( 'draws no guide for a line that is already on screen', () => {
		const result = resolveDragPosition( {
			...baseArgs,
			rect: rect( 0, 0, 100, 100 ),
			others: [],
			rawX: 158,
			rawY: 0,
			movedY: false,
		} );

		expect( result.guideX ).toBeNull();
	} );

	it( 'lands an outer edge on a drawn row line', () => {
		const result = resolveDragPosition( {
			...baseArgs,
			rect: rect( 0, 0, 100, 60 ),
			others: [],
			rawX: 0,
			// Rows run 24 on, 12 off: the third row's gutter starts at 108.
			// The base mesh would say 104.
			rawY: 106,
			movedX: false,
		} );

		expect( result.y ).toBe( 108 );
	} );

	it( 'never lets a block’s centre land on a lattice line', () => {
		const result = resolveDragPosition( {
			...baseArgs,
			rect: rect( 0, 0, 200, 100 ),
			others: [],
			// Centred on the third column's line at 161, but both outer edges
			// are well clear of every line, so nothing may capture.
			rawX: 61,
			rawY: 0,
			movedY: false,
		} );

		expect( result.x ).toBe( 64 );
	} );

	it( 'yields to an alignment magnet', () => {
		const result = resolveDragPosition( {
			...baseArgs,
			rect: rect( 0, 0, 100, 100 ),
			// Another block's left edge at 164, against the lattice line at 161.
			others: [ rect( 164, 400, 200, 50 ) ],
			rawX: 158,
			rawY: 0,
			movedY: false,
		} );

		expect( result.x ).toBe( 164 );
		expect( result.guideX ).toBe( 164 );
	} );

	it( 'is inert when the lattice is not on screen', () => {
		const result = resolveDragPosition( {
			...baseArgs,
			lattice: false,
			rect: rect( 0, 0, 100, 100 ),
			others: [],
			rawX: 158,
			rawY: 0,
			movedY: false,
		} );

		expect( result.x ).toBe( 160 );
	} );

	it( 'catches a resized edge too', () => {
		const result = resolveResize( {
			rect: rect( 100, 100, 200, 100 ),
			others: [],
			canvasHeight: 800,
			direction: 'e',
			// The edge would land at 248; the fifth column starts at 250.
			deltaX: -52,
			deltaY: 0,
			lattice: true,
		} );

		expect( result.rect.width ).toBe( 150 );
	} );

	it( 'leaves a resized edge on the mesh when the lattice is off', () => {
		const result = resolveResize( {
			rect: rect( 100, 100, 200, 100 ),
			others: [],
			canvasHeight: 800,
			direction: 'e',
			deltaX: -52,
			deltaY: 0,
		} );

		expect( result.rect.width ).toBe( 148 );
	} );
} );

describe( 'lattice geometry', () => {
	it( 'divides the content column into 24 cells with gutters between them', () => {
		// 1200 - 2 x 72 margin - 23 x 12 gutters, over 24 columns.
		expect( getLatticeColumnWidth() ).toBe( 32.5 );
	} );

	it( 'puts a vertical line at each column edge', () => {
		expect( snapToLatticeX( 73 ) ).toBe( MARGIN );
		expect( snapToLatticeX( 160 ) ).toBe( 161 );
	} );

	it( 'puts a horizontal line at each row edge', () => {
		expect( snapToLatticeY( 2 ) ).toBe( 0 );
		expect( snapToLatticeY( 23 ) ).toBe( 24 );
		expect( snapToLatticeY( 34 ) ).toBe( 36 );
	} );

	it( 'offers the canvas edges as lines', () => {
		expect( snapToLatticeX( 2 ) ).toBe( 0 );
		expect( snapToLatticeX( DESIGN_WIDTH - 2 ) ).toBe( DESIGN_WIDTH );
	} );
} );
