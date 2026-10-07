import { describe, expect, it } from 'vitest';
import { canHoldACanvas, collectCanvases } from '../canvases';
import { DEFAULT_CANVAS_HEIGHT } from '../constants';

const block = ( clientId, attributes = {}, innerBlocks = [] ) => ( {
	clientId,
	attributes,
	innerBlocks,
} );
const canvas = ( clientId, canvasHeight, innerBlocks ) =>
	block(
		clientId,
		{ layout: { type: 'freeform', canvasHeight } },
		innerBlocks
	);
const placed = ( clientId, rect ) =>
	block( clientId, { style: { layout: rect } } );

describe( 'collectCanvases', () => {
	it( 'finds a canvas and the children it has placed', () => {
		const rect = { x: 72, y: 24, width: 600, height: 60 };
		expect(
			collectCanvases( [ canvas( 'sec', 400, [ placed( 'a', rect ) ] ) ] )
		).toEqual( [
			{ clientId: 'sec', canvasHeight: 400, rects: { a: rect } },
		] );
	} );

	it( 'finds a canvas nested inside another canvas', () => {
		const inner = canvas( 'inner', 200, [
			placed( 'deep', { x: 0, y: 0, width: 100, height: 10 } ),
		] );
		const found = collectCanvases( [ canvas( 'outer', 400, [ inner ] ) ] );

		expect( found.map( ( c ) => c.clientId ) ).toEqual( [
			'outer',
			'inner',
		] );
	} );

	it( 'finds a canvas buried under containers that are not canvases', () => {
		const found = collectCanvases( [
			block( 'plain', {}, [
				block( 'alsoPlain', {}, [
					canvas( 'deep', 300, [
						placed( 'x', { x: 1, y: 2, width: 3, height: 4 } ),
					] ),
				] ),
			] ),
		] );

		expect( found.map( ( c ) => c.clientId ) ).toEqual( [ 'deep' ] );
	} );

	it( 'ignores children that have never been placed', () => {
		const found = collectCanvases( [
			canvas( 'sec', 400, [
				placed( 'a', { x: 0, y: 0, width: 10, height: 10 } ),
				block( 'b' ),
				block( 'c', { style: { layout: { width: 500 } } } ),
			] ),
		] );

		expect( Object.keys( found[ 0 ].rects ) ).toEqual( [ 'a' ] );
	} );

	it( 'falls back to the default canvas height', () => {
		const found = collectCanvases( [
			block( 'sec', { layout: { type: 'freeform' } }, [] ),
		] );

		expect( found[ 0 ].canvasHeight ).toBe( DEFAULT_CANVAS_HEIGHT );
	} );

	it( 'returns nothing when no block is a canvas', () => {
		expect(
			collectCanvases( [
				block( 'a', { layout: { type: 'constrained' } }, [
					block( 'b' ),
				] ),
			] )
		).toEqual( [] );
	} );
} );

describe( 'canHoldACanvas', () => {
	it( 'accepts a container that leaves its layout open', () => {
		// Group, and anything else that lets you choose a layout.
		expect( canHoldACanvas( { allowSizingOnChildren: true } ) ).toBe(
			true
		);
		expect( canHoldACanvas( { allowJustification: false } ) ).toBe( true );
	} );

	it( 'accepts plain layout support', () => {
		// core/column declares `"layout": true`.
		expect( canHoldACanvas( true ) ).toBe( true );
	} );

	it( 'refuses a block that arranges its own children', () => {
		// Columns, Buttons, Navigation, Gallery and the paginations all say
		// `allowSwitching: false`. Repositioning their children would break
		// the arrangement the block exists to provide.
		expect(
			canHoldACanvas( {
				allowSwitching: false,
				default: { type: 'flex' },
			} )
		).toBe( false );
		expect(
			canHoldACanvas( {
				allowSwitching: false,
				allowEditing: false,
				default: { type: 'flex', flexWrap: 'nowrap' },
			} )
		).toBe( false );
	} );

	it( 'refuses a block with no layout support at all', () => {
		expect( canHoldACanvas( undefined ) ).toBe( false );
		expect( canHoldACanvas( false ) ).toBe( false );
	} );
} );
