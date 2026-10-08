import { describe, expect, it } from 'vitest';
import {
	getCanvasConversion,
	getVisibleBox,
	isEditorFurniture,
} from '../conversion';
import { DESIGN_WIDTH } from '../constants';

// A section rendered 600px wide is half the design width, so every measurement
// doubles on the way into design space.
const paddingBox = { left: 100, top: 50, width: 600, height: 300 };

describe( 'getCanvasConversion', () => {
	it( 'keeps the section exactly as tall as it already is', () => {
		const { canvasHeight } = getCanvasConversion( {
			paddingBox,
			children: [],
		} );

		expect( canvasHeight ).toBe( 600 );
	} );

	it( 'turns a child’s rendered box into design-space coordinates', () => {
		const { rects } = getCanvasConversion( {
			paddingBox,
			// 50px in and 30px down from the section, 300 x 60.
			children: [ { left: 150, top: 80, width: 300, height: 60 } ],
		} );

		expect( rects ).toEqual( [
			{ x: 100, y: 60, width: 600, height: 120 },
		] );
	} );

	it( 'measures every child from the section, not from the page', () => {
		const { rects } = getCanvasConversion( {
			paddingBox,
			children: [
				{ left: 100, top: 50, width: 600, height: 40 },
				{ left: 100, top: 150, width: 600, height: 40 },
			],
		} );

		expect( rects[ 0 ] ).toEqual( { x: 0, y: 0, width: 1200, height: 80 } );
		expect( rects[ 1 ].y ).toBe( 200 );
	} );

	it( 'rounds to whole design units', () => {
		const { rects } = getCanvasConversion( {
			paddingBox,
			children: [ { left: 133, top: 67, width: 101, height: 33 } ],
		} );

		expect( rects[ 0 ] ).toEqual( {
			x: 66,
			y: 34,
			width: 202,
			height: 66,
		} );
	} );

	it( 'is a no-op for a section that has not been laid out', () => {
		expect(
			getCanvasConversion( {
				paddingBox: { left: 0, top: 0, width: 0, height: 0 },
				children: [ { left: 0, top: 0, width: 10, height: 10 } ],
			} )
		).toBeNull();
	} );

	it( 'leaves a section rendered at the design width untouched', () => {
		const { canvasHeight, rects } = getCanvasConversion( {
			paddingBox: { left: 0, top: 0, width: DESIGN_WIDTH, height: 480 },
			children: [ { left: 72, top: 24, width: 1056, height: 60 } ],
		} );

		expect( canvasHeight ).toBe( 480 );
		expect( rects[ 0 ] ).toEqual( {
			x: 72,
			y: 24,
			width: 1056,
			height: 60,
		} );
	} );
} );

describe( 'getVisibleBox', () => {
	// A block's layout box is not what you see. In a constrained section every
	// block is the full content width, so an image, a button or a short line of
	// text all measure 1200 units wide — and a block as wide as the canvas has
	// nowhere sideways to go. Everything ends up stacked against the left edge
	// however it is dragged.
	const blockBox = { left: 100, top: 50, width: 600, height: 120 };

	it( 'shrinks a block to the thing you can see inside it', () => {
		// A 200px image sitting in a full-width Image block.
		expect(
			getVisibleBox( blockBox, [
				{ left: 300, top: 60, width: 200, height: 100 },
			] )
		).toEqual( { left: 300, top: 60, width: 200, height: 100 } );
	} );

	it( 'takes in everything inside, not just the first thing', () => {
		expect(
			getVisibleBox( blockBox, [
				{ left: 150, top: 60, width: 100, height: 40 },
				{ left: 400, top: 80, width: 100, height: 60 },
			] )
		).toEqual( { left: 150, top: 60, width: 350, height: 80 } );
	} );

	it( 'never grows a block beyond its own box', () => {
		// A child can overflow — a negative margin, a shadow. The canvas places
		// the block, so the block's own box is the limit.
		expect(
			getVisibleBox( blockBox, [
				{ left: 0, top: 0, width: 5000, height: 5000 },
			] )
		).toEqual( blockBox );
	} );

	it( 'keeps the block box when there is nothing to see inside', () => {
		expect( getVisibleBox( blockBox, [] ) ).toEqual( blockBox );
	} );

	it( 'ignores anything with no size, such as a hidden child', () => {
		expect(
			getVisibleBox( blockBox, [
				{ left: 0, top: 0, width: 0, height: 0 },
				{ left: 200, top: 70, width: 50, height: 50 },
			] )
		).toEqual( { left: 200, top: 70, width: 50, height: 50 } );
	} );
} );

describe( 'isEditorFurniture', () => {
	// A block's element holds the editor's own chrome as well as the block's
	// content. An Image block contains the image — and a drop zone that spans
	// the whole block, which would make every image measure the full width
	// again and leave them all stacked against the left edge.
	it.each( [
		'components-drop-zone',
		'components-resizable-box__handle',
		'block-editor-block-list__insertion-point',
		'block-editor-rich-text__editable-formats',
	] )( 'knows %s is the editor talking, not the block', ( className ) => {
		expect( isEditorFurniture( className ) ).toBe( true );
	} );

	it.each( [ 'wp-block-image', 'wp-element-button', 'alignleft', '' ] )(
		'knows %s is the block itself',
		( className ) => {
			expect( isEditorFurniture( className ) ).toBe( false );
		}
	);

	it( 'reads every class, not just the first', () => {
		expect(
			isEditorFurniture( 'wp-block-cover components-drop-zone' )
		).toBe( true );
	} );

	it( 'copes with a node that has no class at all', () => {
		expect( isEditorFurniture( undefined ) ).toBe( false );
	} );
} );
