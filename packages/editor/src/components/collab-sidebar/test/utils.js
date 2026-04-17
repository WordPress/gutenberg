/**
 * Internal dependencies
 */
import { calculateNotePositions } from '../utils';

function makeRect( top ) {
	return { top };
}

describe( 'calculateNotePositions', () => {
	it( 'returns empty positions when no threads match blockRects', () => {
		const { positions } = calculateNotePositions( {
			threads: [ { id: 1 } ],
			selectedNoteId: undefined,
			blockRects: {},
			heights: {},
			scrollTop: 0,
		} );
		expect( positions ).toEqual( {} );
	} );

	it( 'assigns default position when there is no selected thread', () => {
		const threads = [ { id: 1 }, { id: 2 }, { id: 3 } ];
		const blockRects = {
			1: makeRect( 100 ),
			2: makeRect( 300 ),
			3: makeRect( 500 ),
		};
		const heights = { 1: 50, 2: 50, 3: 50 };

		const { positions } = calculateNotePositions( {
			threads,
			selectedNoteId: undefined,
			blockRects,
			heights,
			scrollTop: 0,
		} );

		// With no selected thread, anchorIndex falls back to 0 (first thread).
		// position = blockTop + scrollTop + offset = blockTop + (-16).
		expect( positions[ 1 ] ).toBe( 84 );
		expect( positions[ 2 ] ).toBe( 284 );
		expect( positions[ 3 ] ).toBe( 484 );
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

		const { positions } = calculateNotePositions( {
			threads,
			selectedNoteId: 2,
			blockRects,
			heights,
			scrollTop: 0,
		} );

		// Anchor: position = 200 + (-16) = 184.
		expect( positions[ 2 ] ).toBe( 184 );
		// Thread 3 overlaps thread 2: previous bottom = (200-16)+80 = 264.
		// 220 < 264+16 = 280, so offset = 264-220+20 = 64. Position = 220+64 = 284.
		expect( positions[ 3 ] ).toBe( 284 );
	} );

	it( 'pushes neighbors above the selected thread upward when overlapping', () => {
		const threads = [ { id: 1 }, { id: 2 } ];
		// Thread 1 is tall and overlaps where thread 2 sits.
		const blockRects = {
			1: makeRect( 150 ),
			2: makeRect( 180 ),
		};
		const heights = { 1: 60, 2: 50 };

		const { positions } = calculateNotePositions( {
			threads,
			selectedNoteId: 2,
			blockRects,
			heights,
			scrollTop: 0,
		} );

		// Anchor: position = 180 + (-16) = 164.
		expect( positions[ 2 ] ).toBe( 164 );
		// Thread 1 bottom = 150+60 = 210, belowAdjustedTop = 180-16 = 164.
		// 210 > 164, so offset = 164-150-60-20 = -66. Position = 150+(-66) = 84.
		expect( positions[ 1 ] ).toBe( 84 );
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

		const { positions } = calculateNotePositions( {
			threads,
			selectedNoteId: 1,
			blockRects,
			heights,
			scrollTop: 0,
		} );

		// Anchor: position = 100 + (-16) = 84.
		expect( positions[ 1 ] ).toBe( 84 );
		// Thread 2: prev bottom = (100-16)+80 = 164. 110 < 164+16, offset = 164-110+20 = 74. Position = 110+74 = 184.
		expect( positions[ 2 ] ).toBe( 184 );
		// Thread 3: prev bottom = (110+74)+80 = 264. 120 < 264+16, offset = 264-120+20 = 164. Position = 120+164 = 284.
		expect( positions[ 3 ] ).toBe( 284 );
	} );

	it( 'skips threads with missing blockRects', () => {
		const threads = [ { id: 1 }, { id: 2 }, { id: 3 } ];
		const blockRects = {
			1: makeRect( 100 ),
			// id 2 is missing
			3: makeRect( 500 ),
		};
		const heights = { 1: 50, 3: 50 };

		const { positions } = calculateNotePositions( {
			threads,
			selectedNoteId: 1,
			blockRects,
			heights,
			scrollTop: 0,
		} );

		expect( positions[ 1 ] ).toBe( 84 );
		expect( positions[ 2 ] ).toBeUndefined();
		expect( positions[ 3 ] ).toBe( 484 );
	} );

	it( 'incorporates scrollTop into positions', () => {
		const threads = [ { id: 1 }, { id: 2 } ];
		const blockRects = {
			1: makeRect( 100 ),
			2: makeRect( 300 ),
		};
		const heights = { 1: 50, 2: 50 };

		const { positions } = calculateNotePositions( {
			threads,
			selectedNoteId: 1,
			blockRects,
			heights,
			scrollTop: 500,
		} );

		// position = blockTop + scrollTop + offset.
		// Thread 1: 100 + 500 + (-16) = 584.
		expect( positions[ 1 ] ).toBe( 584 );
		// Thread 2: 300 + 500 + (-16) = 784.
		expect( positions[ 2 ] ).toBe( 784 );
	} );
} );
