/**
 * Internal dependencies
 */
import { calculateNotePositions } from '../utils';

function makeRect( top ) {
	return { top };
}

describe( 'calculateNotePositions', () => {
	it( 'returns empty positions when the anchor thread has no blockRect', () => {
		const { positions } = calculateNotePositions( {
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

		const { positions } = calculateNotePositions( {
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

	it( 'pushes an overlapping thread above the anchor upward', () => {
		const threads = [ { id: 1 }, { id: 2 } ];
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

		const { positions } = calculateNotePositions( {
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

		const { positions } = calculateNotePositions( {
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

		const { positions } = calculateNotePositions( {
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

		const { positions } = calculateNotePositions( {
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
} );
