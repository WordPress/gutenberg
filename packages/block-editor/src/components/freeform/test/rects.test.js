import { describe, expect, it } from 'vitest';
import {
	DEFAULT_BLOCK_WIDTH,
	getBirthPlacement,
	getRequiredCanvasHeight,
	isPlaced,
	readRects,
} from '../rects';
import { DEFAULT_CANVAS_HEIGHT } from '../constants';
import { MARGIN, RHYTHM } from '../snapping';

describe( 'isPlaced', () => {
	it( 'is true once a block has both coordinates', () => {
		expect( isPlaced( { x: 0, y: 0 } ) ).toBe( true );
	} );

	it( 'is false for a block that has never been placed', () => {
		expect( isPlaced( {} ) ).toBe( false );
		expect( isPlaced( undefined ) ).toBe( false );
		expect( isPlaced( { x: 10 } ) ).toBe( false );
	} );
} );

describe( 'getBirthPlacement', () => {
	it( 'puts the first block at the content margin', () => {
		expect( getBirthPlacement( [] ) ).toEqual( {
			x: MARGIN,
			y: MARGIN,
			width: DEFAULT_BLOCK_WIDTH,
		} );
	} );

	it( 'puts the next block one rhythm below everything already placed', () => {
		expect(
			getBirthPlacement( [
				{ x: 0, y: 100, width: 100, height: 50 },
				{ x: 0, y: 300, width: 100, height: 120 },
			] )
		).toEqual( {
			x: MARGIN,
			y: 420 + RHYTHM,
			width: DEFAULT_BLOCK_WIDTH,
		} );
	} );
} );

describe( 'getRequiredCanvasHeight', () => {
	it( 'grows to clear the lowest block, plus a margin', () => {
		expect(
			getRequiredCanvasHeight(
				[ { x: 0, y: 900, width: 100, height: 100 } ],
				DEFAULT_CANVAS_HEIGHT
			)
		).toBe( 1000 + MARGIN );
	} );

	it( 'never shrinks the canvas', () => {
		expect(
			getRequiredCanvasHeight(
				[ { x: 0, y: 0, width: 100, height: 10 } ],
				900
			)
		).toBe( 900 );
	} );

	it( 'handles an empty canvas', () => {
		expect( getRequiredCanvasHeight( [], 600 ) ).toBe( 600 );
	} );
} );

describe( 'readRects', () => {
	const makeCanvas = ( children ) => ( {
		children: children.map( ( { clientId, height } ) => ( {
			dataset: { block: clientId },
			offsetHeight: height,
		} ) ),
	} );

	it( 'takes position and width from the stored layout', () => {
		const rects = readRects( {
			canvasElement: makeCanvas( [ { clientId: 'a', height: 100 } ] ),
			childClientIds: [ 'a' ],
			childStyles: { a: { layout: { x: 120, y: 240, width: 360 } } },
			designToCanvasPx: 1,
		} );

		expect( rects.a ).toEqual( {
			x: 120,
			y: 240,
			width: 360,
			height: 100,
		} );
	} );

	it( 'measures height from the DOM rather than trusting the stored value', () => {
		const rects = readRects( {
			canvasElement: makeCanvas( [ { clientId: 'a', height: 200 } ] ),
			childClientIds: [ 'a' ],
			childStyles: {
				a: { layout: { x: 0, y: 0, width: 100, height: 40 } },
			},
			designToCanvasPx: 1,
		} );

		expect( rects.a.height ).toBe( 200 );
	} );

	it( 'converts measured pixels back into design units', () => {
		const rects = readRects( {
			canvasElement: makeCanvas( [ { clientId: 'a', height: 100 } ] ),
			childClientIds: [ 'a' ],
			childStyles: { a: { layout: { x: 0, y: 0, width: 100 } } },
			// The canvas is rendered at half the design width.
			designToCanvasPx: 0.5,
		} );

		expect( rects.a.height ).toBe( 200 );
	} );

	it( 'falls back to defaults when there is nothing to measure', () => {
		const rects = readRects( {
			canvasElement: null,
			childClientIds: [ 'a' ],
			childStyles: {},
			designToCanvasPx: 1,
		} );

		expect( rects.a ).toEqual( {
			x: 0,
			y: 0,
			width: DEFAULT_BLOCK_WIDTH,
			height: 48,
		} );
	} );

	it( 'ignores canvas children that are not blocks', () => {
		const canvas = makeCanvas( [ { clientId: 'a', height: 60 } ] );
		canvas.children.push( { dataset: {}, offsetHeight: 999 } );

		const rects = readRects( {
			canvasElement: canvas,
			childClientIds: [ 'a' ],
			childStyles: { a: { layout: { x: 0, y: 0, width: 100 } } },
			designToCanvasPx: 1,
		} );

		expect( Object.keys( rects ) ).toEqual( [ 'a' ] );
		expect( rects.a.height ).toBe( 60 );
	} );
} );

describe( 'readRects on a section that is not a canvas yet', () => {
	const makeCanvas = ( children ) => ( {
		children: children.map( ( c ) => ( {
			dataset: { block: c.clientId },
			offsetLeft: c.left,
			offsetTop: c.top,
			offsetWidth: c.width,
			offsetHeight: c.height,
		} ) ),
	} );

	it( 'measures an unplaced block where it actually sits', () => {
		const rects = readRects( {
			canvasElement: makeCanvas( [
				{ clientId: 'a', left: 36, top: 24, width: 528, height: 30 },
			] ),
			childClientIds: [ 'a' ],
			childStyles: {},
			// Rendered at half the design width.
			designToCanvasPx: 0.5,
		} );

		expect( rects.a ).toEqual( {
			x: 72,
			y: 48,
			width: 1056,
			height: 60,
		} );
	} );

	it( 'still prefers stored coordinates once a block has them', () => {
		const rects = readRects( {
			canvasElement: makeCanvas( [
				{ clientId: 'a', left: 36, top: 24, width: 528, height: 30 },
			] ),
			childClientIds: [ 'a' ],
			childStyles: { a: { layout: { x: 400, y: 200, width: 300 } } },
			designToCanvasPx: 0.5,
		} );

		expect( rects.a.x ).toBe( 400 );
		expect( rects.a.y ).toBe( 200 );
		expect( rects.a.width ).toBe( 300 );
	} );
} );
