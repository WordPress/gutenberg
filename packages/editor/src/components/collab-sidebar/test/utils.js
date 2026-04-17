/**
 * Internal dependencies
 */
import { calculateAllOffsets } from '../utils';

function makeRect( top ) {
	return { top };
}

describe( 'calculateAllOffsets', () => {
	it( 'returns empty offsets when no threads match blockRects', () => {
		const { offsets, minHeight } = calculateAllOffsets( {
			threads: [ { id: 1 } ],
			selectedNoteId: undefined,
			blockRects: {},
			heights: {},
		} );
		expect( offsets ).toEqual( {} );
		expect( minHeight ).toBe( 0 );
	} );

	it( 'assigns default offset when there is no selected thread', () => {
		const threads = [ { id: 1 }, { id: 2 }, { id: 3 } ];
		const blockRects = {
			1: makeRect( 100 ),
			2: makeRect( 300 ),
			3: makeRect( 500 ),
		};
		const heights = { 1: 50, 2: 50, 3: 50 };

		const { offsets } = calculateAllOffsets( {
			threads,
			selectedNoteId: undefined,
			blockRects,
			heights,
		} );

		// With no selected thread, breakIndex falls back to 0 (first thread).
		expect( offsets[ 1 ] ).toBe( -16 );
		// Non-overlapping threads get the default offset.
		expect( offsets[ 2 ] ).toBe( -16 );
		expect( offsets[ 3 ] ).toBe( -16 );
	} );

	it( 'pushes neighbors below the selected thread downward when overlapping', () => {
		const threads = [ { id: 1 }, { id: 2 }, { id: 3 } ];
		// Thread 2 selected; thread 3 starts inside thread 2's space.
		const blockRects = {
			1: makeRect( 100 ),
			2: makeRect( 200 ),
			3: makeRect( 220 ),
		};
		const heights = { 1: 50, 2: 80, 3: 50 };

		const { offsets } = calculateAllOffsets( {
			threads,
			selectedNoteId: 2,
			blockRects,
			heights,
		} );

		expect( offsets[ 2 ] ).toBe( -16 );
		// thread 3 overlaps thread 2: previous bottom = (200-16)+80 = 264.
		// 220 < 264+16 = 280, so offset = 264 - 220 + 20 = 64.
		expect( offsets[ 3 ] ).toBe( 64 );
	} );

	it( 'pushes neighbors above the selected thread upward when overlapping', () => {
		const threads = [ { id: 1 }, { id: 2 } ];
		// Thread 1 is tall and overlaps where thread 2 sits.
		const blockRects = {
			1: makeRect( 150 ),
			2: makeRect( 180 ),
		};
		const heights = { 1: 60, 2: 50 };

		const { offsets } = calculateAllOffsets( {
			threads,
			selectedNoteId: 2,
			blockRects,
			heights,
		} );

		expect( offsets[ 2 ] ).toBe( -16 );
		// Thread 1 bottom = 150 + 60 = 210, next threadTop = 180 - 16 = 164.
		// 210 > 164, so offset = 164 - 150 - 60 - 20 = -66.
		expect( offsets[ 1 ] ).toBe( -66 );
	} );

	it( 'cascades overlap adjustment across multiple threads below', () => {
		const threads = [ { id: 1 }, { id: 2 }, { id: 3 } ];
		// All three threads are tightly packed.
		const blockRects = {
			1: makeRect( 100 ),
			2: makeRect( 110 ),
			3: makeRect( 120 ),
		};
		const heights = { 1: 80, 2: 80, 3: 80 };

		const { offsets } = calculateAllOffsets( {
			threads,
			selectedNoteId: 1,
			blockRects,
			heights,
		} );

		expect( offsets[ 1 ] ).toBe( -16 );
		// Thread 2: previous bottom = (100-16)+80 = 164. 110 < 164+16, offset = 164-110+20 = 74.
		expect( offsets[ 2 ] ).toBe( 74 );
		// Thread 3: previous bottom = (110+74)+80 = 264. 120 < 264+16, offset = 264-120+20 = 164.
		expect( offsets[ 3 ] ).toBe( 164 );
	} );

	it( 'skips threads with missing blockRects', () => {
		const threads = [ { id: 1 }, { id: 2 }, { id: 3 } ];
		const blockRects = {
			1: makeRect( 100 ),
			// id 2 is missing
			3: makeRect( 500 ),
		};
		const heights = { 1: 50, 3: 50 };

		const { offsets } = calculateAllOffsets( {
			threads,
			selectedNoteId: 1,
			blockRects,
			heights,
		} );

		expect( offsets[ 1 ] ).toBe( -16 );
		expect( offsets[ 2 ] ).toBeUndefined();
		expect( offsets[ 3 ] ).toBe( -16 );
	} );

	it( 'computes minHeight from the last thread position', () => {
		const threads = [ { id: 1 }, { id: 2 } ];
		const blockRects = {
			1: makeRect( 100 ),
			2: makeRect( 400 ),
		};
		const heights = { 1: 50, 2: 60 };

		const { minHeight } = calculateAllOffsets( {
			threads,
			selectedNoteId: 1,
			blockRects,
			heights,
		} );

		// Last thread: top=400, height=60, offset=-16, + 32 = 476.
		expect( minHeight ).toBe( 476 );
	} );
} );
