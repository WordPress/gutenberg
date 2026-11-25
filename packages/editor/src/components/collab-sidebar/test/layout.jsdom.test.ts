import { describe, expect, it } from 'vitest';
import { getThreadLayout } from '../utils/layout';

function makeRect( top: number ) {
	return { top };
}

describe( 'getThreadLayout', () => {
	it( 'returns empty positions when the anchor thread has no blockRect', () => {
		const { positions } = getThreadLayout( {
			threads: [ { id: 1 } ],
			selectedNoteId: undefined,
			blockRects: {},
			heights: {},
			scrollTop: 0,
		} );
		expect( positions ).toEqual( {} );
	} );

	it( 'falls back to the first thread as anchor when none is selected', () => {
		const threads = [ { id: 1 }, { id: 2 }, { id: 3 } ];
		const blockRects = {
			1: makeRect( 100 ),
			2: makeRect( 300 ),
			3: makeRect( 500 ),
		};
		const heights = { 1: 50, 2: 50, 3: 50 };

		const { positions } = getThreadLayout( {
			threads,
			selectedNoteId: undefined,
			blockRects,
			heights,
			scrollTop: 0,
		} );

		// 1: 100 - 16 = 84
		// 2: 300 - 16 = 284
		// 3: 500 - 16 = 484
		expect( positions ).toEqual( { 1: 84, 2: 284, 3: 484 } );
	} );

	it( 'anchors on a measured thread when the selected one has no rect', () => {
		// A selected thread whose anchor has not been measured yet used to
		// abandon the whole sweep, leaving every card without a position —
		// and an unpositioned floating card falls back to the panel's origin,
		// where the cards pile up on each other.
		const threads = [ { id: 1 }, { id: 2 }, { id: 3 } ];
		// Thread 2 is selected but its anchor has not been measured.
		const blockRects = { 1: makeRect( 100 ), 3: makeRect( 300 ) };
		const heights = { 1: 50, 2: 50, 3: 50 };

		const { positions } = getThreadLayout( {
			threads,
			selectedNoteId: 2,
			blockRects,
			heights,
			scrollTop: 0,
		} );

		expect( positions ).toEqual( { 1: 84, 3: 284 } );
	} );

	it( 'leaves an unmeasured card unplaced', () => {
		// Sweeping with an unmeasured card treats it as zero-height, so the
		// card after it lands on its anchor — on top of the card it was
		// supposed to clear. The measured neighbours still get a position.
		const threads = [ { id: 1 }, { id: 2 } ];
		const blockRects = { 1: makeRect( 100 ), 2: makeRect( 140 ) };

		const { positions } = getThreadLayout( {
			threads,
			selectedNoteId: 1,
			blockRects,
			heights: { 1: 90 },
			scrollTop: 0,
		} );

		expect( positions ).toEqual( { 1: 84 } );
	} );

	it( 'returns the content height that fits the lowest measured thread', () => {
		const getContentHeight = ( heights: Record< string, number > ) =>
			getThreadLayout( {
				threads: [ { id: 1 }, { id: 2 }, { id: 3 } ],
				selectedNoteId: undefined,
				blockRects: {
					1: makeRect( 100 ),
					2: makeRect( 300 ),
					3: makeRect( 500 ),
				},
				heights,
				scrollTop: 0,
			} ).contentHeight;

		// 2: 284, plus its 16px margin, 50px height and a 16px gap. The
		// unmeasured thread 3 doesn't count until it has a height.
		expect( getContentHeight( { 1: 50, 2: 50 } ) ).toBe( 366 );
		expect( getContentHeight( { 1: 50, 2: 50, 3: 50 } ) ).toBe( 566 );
	} );

	it( 'pushes an overlapping thread above the anchor upward', () => {
		const threads = [ { id: 1 }, { id: 2 } ];
		const blockRects = {
			1: makeRect( 150 ),
			2: makeRect( 180 ),
		};
		const heights = { 1: 60, 2: 50 };

		const { positions } = getThreadLayout( {
			threads,
			selectedNoteId: 2,
			blockRects,
			heights,
			scrollTop: 0,
		} );

		// 2 (anchor): 180 - 16 = 164
		// 1 (upward):  164 - 60 - 20 = 84
		expect( positions ).toEqual( { 1: 84, 2: 164 } );
	} );

	it( 'cascades downward offsets through consecutive overlapping threads', () => {
		const threads = [ { id: 1 }, { id: 2 }, { id: 3 } ];
		const blockRects = {
			1: makeRect( 100 ),
			2: makeRect( 110 ),
			3: makeRect( 120 ),
		};
		const heights = { 1: 80, 2: 80, 3: 80 };

		const { positions } = getThreadLayout( {
			threads,
			selectedNoteId: 1,
			blockRects,
			heights,
			scrollTop: 0,
		} );

		// 1 (anchor):    100 - 16 = 84
		// 2 (downward):   84 + 80 + 20 = 184
		// 3 (downward):  184 + 80 + 20 = 284
		expect( positions ).toEqual( { 1: 84, 2: 184, 3: 284 } );
	} );

	it( 'omits threads that have no blockRect', () => {
		const threads = [ { id: 1 }, { id: 2 }, { id: 3 } ];
		const blockRects = {
			1: makeRect( 100 ),
			3: makeRect( 500 ),
		};
		const heights = { 1: 50, 3: 50 };

		const { positions } = getThreadLayout( {
			threads,
			selectedNoteId: 1,
			blockRects,
			heights,
			scrollTop: 0,
		} );

		// 1: 100 - 16 = 84
		// 3: 500 - 16 = 484
		expect( positions ).toEqual( { 1: 84, 3: 484 } );
	} );

	it( 'allows upward cascade to produce negative positions', () => {
		const threads = [ { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 } ];
		const blockRects = {
			1: makeRect( 150 ),
			2: makeRect( 200 ),
			3: makeRect( 250 ),
			4: makeRect( 300 ),
		};
		const heights = { 1: 90, 2: 90, 3: 90, 4: 230 };

		const { positions } = getThreadLayout( {
			threads,
			selectedNoteId: 4,
			blockRects,
			heights,
			scrollTop: 0,
		} );

		// 4 (anchor):  300 - 16 = 284
		// 3 (upward):  284 - 90 - 20 = 174
		// 2 (upward):  174 - 90 - 20 = 64
		// 1 (upward):   64 - 90 - 20 = -46
		expect( positions ).toEqual( { 1: -46, 2: 64, 3: 174, 4: 284 } );
	} );

	it( 'adds scrollTop to the final positions', () => {
		const threads = [ { id: 1 }, { id: 2 } ];
		const blockRects = {
			1: makeRect( 100 ),
			2: makeRect( 300 ),
		};
		const heights = { 1: 50, 2: 50 };

		const { positions } = getThreadLayout( {
			threads,
			selectedNoteId: 1,
			blockRects,
			heights,
			scrollTop: 500,
		} );

		// 1: 100 + 500 - 16 = 584
		// 2: 300 + 500 - 16 = 784
		expect( positions ).toEqual( { 1: 584, 2: 784 } );
	} );

	it( 'stacks two threads that share a block with the first as anchor', () => {
		const threads = [ { id: 1 }, { id: 2 } ];
		const blockRects = {
			1: makeRect( 200 ),
			2: makeRect( 200 ),
		};
		const heights = { 1: 50, 2: 50 };

		const { positions } = getThreadLayout( {
			threads,
			selectedNoteId: 1,
			blockRects,
			heights,
			scrollTop: 0,
		} );

		// 1 (anchor):    200 - 16 = 184
		// 2 (downward):  (184 + 50) - 200 + 20 = 54 → 200 + 54 = 254
		expect( positions ).toEqual( { 1: 184, 2: 254 } );
	} );

	it( 'stacks two threads that share a block with the second as anchor', () => {
		const threads = [ { id: 1 }, { id: 2 } ];
		const blockRects = {
			1: makeRect( 200 ),
			2: makeRect( 200 ),
		};
		const heights = { 1: 50, 2: 50 };

		const { positions } = getThreadLayout( {
			threads,
			selectedNoteId: 2,
			blockRects,
			heights,
			scrollTop: 0,
		} );

		// 2 (anchor):  200 - 16 = 184
		// 1 (upward):  184 - 200 - 50 - 20 = -86 → 200 + (-86) = 114
		expect( positions ).toEqual( { 1: 114, 2: 184 } );
	} );

	it( 'stacks three threads sharing a block with middle as anchor', () => {
		const threads = [ { id: 1 }, { id: 2 }, { id: 3 } ];
		const blockRects = {
			1: makeRect( 200 ),
			2: makeRect( 200 ),
			3: makeRect( 200 ),
		};
		const heights = { 1: 50, 2: 50, 3: 50 };

		const { positions } = getThreadLayout( {
			threads,
			selectedNoteId: 2,
			blockRects,
			heights,
			scrollTop: 0,
		} );

		// 2 (anchor):    200 - 16 = 184
		// 3 (downward):  (184 + 50) - 200 + 20 = 54 → 254
		// 1 (upward):    184 - 200 - 50 - 20 = -86 → 114
		expect( positions ).toEqual( { 1: 114, 2: 184, 3: 254 } );
	} );

	it( 'never displaces a thread above its own anchor when the pending note sorts out of order', () => {
		/*
		 * The pending "new" note is spliced in after its block's existing
		 * threads, but its marker can sit above a marker that precedes it in
		 * the list. Ordering by measured top
		 * keeps the sweep's assumption true; without it note 1 is pushed to
		 * 164 - 136px above the marker it points at.
		 */
		const threads = [ { id: 1 }, { id: 'new' } ];
		const blockRects = {
			1: makeRect( 300 ),
			new: makeRect( 250 ),
		};
		const heights = { 1: 50, new: 80 };

		const { positions } = getThreadLayout( {
			threads,
			selectedNoteId: 'new',
			blockRects,
			heights,
			scrollTop: 0,
		} );

		// new (anchor):   250 - 16 = 234
		// 1 (downward):   (234 + 80) - 300 + 20 = 34 → 334
		expect( positions ).toEqual( { 1: 334, new: 234 } );
		expect( positions[ 1 ] ).toBeGreaterThan( blockRects[ 1 ].top - 50 );
	} );
} );
