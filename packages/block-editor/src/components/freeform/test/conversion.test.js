import { describe, expect, it } from 'vitest';
import {
	getCanvasConversion,
	getRepairedRect,
	getVisibleBox,
	isEditorFurniture,
	isTextBlock,
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

describe( 'getRepairedRect', () => {
	// Conversion happens once. A section converted before blocks were measured
	// by their contents still holds blocks the full width of the canvas, and
	// such a block can never move sideways however it is dragged — x is pinned
	// at 0 and everything stays stacked against the left edge. Picking one up
	// is the moment to give it the size of what you can see.
	const full = { x: 0, y: 100, width: DESIGN_WIDTH, height: 200 };

	it( 'gives a canvas-wide block the size of its contents', () => {
		expect(
			getRepairedRect(
				full,
				{ x: 300, y: 100, width: 335, height: 200 },
				DESIGN_WIDTH
			)
		).toEqual( { x: 300, y: 100, width: 335, height: 200 } );
	} );

	it( 'leaves the height and vertical position alone', () => {
		// Only the sideways pinning is being repaired; moving the block up or
		// down under the hand would be a surprise.
		expect(
			getRepairedRect(
				full,
				{ x: 300, y: 999, width: 335, height: 20 },
				DESIGN_WIDTH
			)
		).toEqual( { x: 300, y: 100, width: 335, height: 200 } );
	} );

	it( 'leaves a block that is not canvas-wide exactly as it is', () => {
		const placed = { x: 200, y: 100, width: 400, height: 200 };
		expect(
			getRepairedRect(
				placed,
				{ x: 250, y: 100, width: 100, height: 200 },
				DESIGN_WIDTH
			)
		).toEqual( placed );
	} );

	it( 'leaves it alone when its contents fill the canvas too', () => {
		// A long paragraph really is the full width, and shrinking it would
		// rewrap the text under the hand.
		expect(
			getRepairedRect(
				full,
				{ x: 0, y: 100, width: DESIGN_WIDTH, height: 200 },
				DESIGN_WIDTH
			)
		).toEqual( full );
	} );

	it( 'copes with nothing to measure', () => {
		expect( getRepairedRect( full, undefined, DESIGN_WIDTH ) ).toEqual(
			full
		);
		expect( getRepairedRect( undefined, full, DESIGN_WIDTH ) ).toBe(
			undefined
		);
	} );
} );

describe( 'a block whose content is only text', () => {
	// It keeps its own box. Measuring a paragraph by its words would make it
	// as wide as its text, and so placeable anywhere — but it would also mean
	// a paragraph changed width the moment it was dragged, and a block should
	// be the size it was before you picked it up.
	const blockBox = { left: 100, top: 50, width: 600, height: 120 };

	it( 'is left at the width it is laid out at', () => {
		expect( getVisibleBox( blockBox, [] ) ).toEqual( blockBox );
	} );

	it( 'is therefore never repaired on being picked up', () => {
		// Its visible box is its own box, so there is nothing narrower to
		// shrink it to and `getRepairedRect` hands the stored rect straight
		// back.
		const stored = { x: 0, y: 100, width: DESIGN_WIDTH, height: 200 };
		expect(
			getRepairedRect(
				stored,
				{ x: 0, y: 100, width: DESIGN_WIDTH, height: 200 },
				DESIGN_WIDTH
			)
		).toBe( stored );
	} );
} );

describe( 'isTextBlock', () => {
	// A paragraph is text however it is marked up. Counting its contents meant
	// a paragraph with a link or a bold word in it had element children, got
	// measured by them, and narrowed to the width of that markup the moment it
	// was dragged — while a paragraph of plain text kept its size. The block
	// itself says what it is: a rich text root carries the editable attribute
	// and the editor's class for it.
	it( 'knows a paragraph by the attribute RichText puts on it', () => {
		expect( isTextBlock( 'wp-block-paragraph', true ) ).toBe( true );
	} );

	it( 'knows one that is held still on a canvas, which is still text', () => {
		// Locked for dragging, `contenteditable="false"` — the attribute is
		// there either way, which is the point.
		expect(
			isTextBlock(
				'block-editor-rich-text__editable wp-block-paragraph',
				true
			)
		).toBe( true );
	} );

	it( 'knows it by the class alone', () => {
		expect( isTextBlock( 'block-editor-rich-text__editable', false ) ).toBe(
			true
		);
	} );

	it( 'does not mistake an image block for text', () => {
		expect( isTextBlock( 'wp-block-image', false ) ).toBe( false );
	} );

	it( 'does not mistake a Buttons block for text', () => {
		// Its buttons hold the editable text, not the block itself, so the
		// block is measured by them and can be placed anywhere.
		expect( isTextBlock( 'wp-block-buttons', false ) ).toBe( false );
	} );

	it( 'copes with a block that has no class', () => {
		expect( isTextBlock( undefined, false ) ).toBe( false );
	} );
} );

describe( 'rounding a measurement into design space', () => {
	// Positions round to the nearest unit, but sizes round up. Rounding a size
	// down makes a block come back from a drag a shade shorter or narrower
	// than it was, which on a Group with a background reads as the box
	// collapsing, and on a line of text can re-wrap it.
	const tight = { left: 0, top: 0, width: 1200, height: 301 };

	it( 'never gives a block less height than it was measured at', () => {
		const { rects } = getCanvasConversion( {
			paddingBox: tight,
			children: [ { left: 0, top: 0, width: 100, height: 100.4 } ],
		} );
		expect( rects[ 0 ].height ).toBe( 101 );
	} );

	it( 'never gives it less width either', () => {
		const { rects } = getCanvasConversion( {
			paddingBox: tight,
			children: [ { left: 0, top: 0, width: 100.2, height: 100 } ],
		} );
		expect( rects[ 0 ].width ).toBe( 101 );
	} );

	it( 'keeps the canvas at least as tall as the section it froze', () => {
		expect(
			getCanvasConversion( {
				paddingBox: { left: 0, top: 0, width: 1200, height: 300.2 },
				children: [ { left: 0, top: 0, width: 10, height: 10 } ],
			} ).canvasHeight
		).toBe( 301 );
	} );

	it( 'still rounds a position to the nearest unit', () => {
		// A position rounded up every time would walk a block down and to the
		// right a little on each conversion.
		const { rects } = getCanvasConversion( {
			paddingBox: tight,
			children: [ { left: 10.2, top: 20.4, width: 100, height: 100 } ],
		} );
		expect( rects[ 0 ].x ).toBe( 10 );
		expect( rects[ 0 ].y ).toBe( 20 );
	} );
} );
