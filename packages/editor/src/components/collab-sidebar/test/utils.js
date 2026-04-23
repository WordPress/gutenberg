/**
 * Internal dependencies
 */
import {
	getNoteIdsFromMetadata,
	addNoteIdToMetadata,
	removeNoteIdFromMetadata,
	calculateNotePositions,
} from '../utils';

function makeRect( top ) {
	return { top };
}

describe( 'getNoteIdsFromMetadata', () => {
	it( 'returns empty array for null metadata', () => {
		expect( getNoteIdsFromMetadata( null ) ).toEqual( [] );
	} );

	it( 'returns empty array for undefined metadata', () => {
		expect( getNoteIdsFromMetadata( undefined ) ).toEqual( [] );
	} );

	it( 'returns empty array for metadata without noteId', () => {
		expect( getNoteIdsFromMetadata( {} ) ).toEqual( [] );
		expect( getNoteIdsFromMetadata( { name: 'test' } ) ).toEqual( [] );
	} );

	it( 'returns empty array for noteId of 0', () => {
		expect( getNoteIdsFromMetadata( { noteId: 0 } ) ).toEqual( [] );
	} );

	it( 'returns empty array for noteId of empty string', () => {
		expect( getNoteIdsFromMetadata( { noteId: '' } ) ).toEqual( [] );
	} );

	it( 'returns empty array for noteId of false', () => {
		expect( getNoteIdsFromMetadata( { noteId: false } ) ).toEqual( [] );
	} );

	it( 'returns array from scalar noteId (legacy format)', () => {
		expect( getNoteIdsFromMetadata( { noteId: 42 } ) ).toEqual( [ 42 ] );
	} );

	it( 'handles string noteId (legacy format)', () => {
		expect( getNoteIdsFromMetadata( { noteId: '42' } ) ).toEqual( [
			'42',
		] );
	} );

	it( 'returns array from array noteId', () => {
		expect( getNoteIdsFromMetadata( { noteId: [ 1, 2, 3 ] } ) ).toEqual( [
			1, 2, 3,
		] );
	} );

	it( 'filters out falsy values from array', () => {
		expect(
			getNoteIdsFromMetadata( { noteId: [ 1, null, 2, undefined, 3 ] } )
		).toEqual( [ 1, 2, 3 ] );
	} );

	it( 'filters out zero and empty string from array', () => {
		expect(
			getNoteIdsFromMetadata( { noteId: [ 0, '', 1, false, 2 ] } )
		).toEqual( [ 1, 2 ] );
	} );

	it( 'returns empty array when all array values are falsy', () => {
		expect(
			getNoteIdsFromMetadata( { noteId: [ null, undefined, 0, '' ] } )
		).toEqual( [] );
	} );
} );

describe( 'addNoteIdToMetadata', () => {
	it( 'creates array for first note on empty metadata', () => {
		const result = addNoteIdToMetadata( {}, 42 );
		expect( result.noteId ).toEqual( [ 42 ] );
	} );

	it( 'creates array for first note on null metadata', () => {
		const result = addNoteIdToMetadata( null, 42 );
		expect( result.noteId ).toEqual( [ 42 ] );
	} );

	it( 'creates array for first note on undefined metadata', () => {
		const result = addNoteIdToMetadata( undefined, 42 );
		expect( result.noteId ).toEqual( [ 42 ] );
	} );

	it( 'converts scalar noteId to array and appends new id', () => {
		const result = addNoteIdToMetadata( { noteId: 1 }, 2 );
		expect( result.noteId ).toEqual( [ 1, 2 ] );
	} );

	it( 'appends to existing array', () => {
		const result = addNoteIdToMetadata( { noteId: [ 1, 2 ] }, 3 );
		expect( result.noteId ).toEqual( [ 1, 2, 3 ] );
	} );

	it( 'prevents duplicates', () => {
		const result = addNoteIdToMetadata( { noteId: [ 1, 2 ] }, 1 );
		expect( result ).toEqual( { noteId: [ 1, 2 ] } );
	} );

	it( 'preserves other metadata properties', () => {
		const result = addNoteIdToMetadata( { noteId: 1, name: 'test' }, 2 );
		expect( result ).toEqual( { noteId: [ 1, 2 ], name: 'test' } );
	} );

	it( 'returns original metadata object when duplicate is added', () => {
		const metadata = { noteId: [ 1, 2 ] };
		const result = addNoteIdToMetadata( metadata, 1 );
		expect( result ).toBe( metadata );
	} );

	it( 'handles adding to metadata with other properties but no noteId', () => {
		const result = addNoteIdToMetadata( { name: 'test' }, 5 );
		expect( result ).toEqual( { name: 'test', noteId: [ 5 ] } );
	} );
} );

describe( 'removeNoteIdFromMetadata', () => {
	it( 'removes noteId from array', () => {
		const result = removeNoteIdFromMetadata( { noteId: [ 1, 2, 3 ] }, 2 );
		expect( result.noteId ).toEqual( [ 1, 3 ] );
	} );

	it( 'returns undefined noteId when array becomes empty', () => {
		const result = removeNoteIdFromMetadata( { noteId: [ 1 ] }, 1 );
		expect( result.noteId ).toBeUndefined();
	} );

	it( 'handles removing from scalar noteId (legacy format)', () => {
		const result = removeNoteIdFromMetadata( { noteId: 42 }, 42 );
		expect( result.noteId ).toBeUndefined();
	} );

	it( 'handles removing non-existent id', () => {
		const result = removeNoteIdFromMetadata( { noteId: [ 1, 2 ] }, 99 );
		expect( result.noteId ).toEqual( [ 1, 2 ] );
	} );

	it( 'handles empty metadata', () => {
		const result = removeNoteIdFromMetadata( {}, 1 );
		expect( result.noteId ).toBeUndefined();
	} );

	it( 'preserves other metadata properties', () => {
		const result = removeNoteIdFromMetadata(
			{ noteId: [ 1, 2 ], name: 'test' },
			1
		);
		expect( result ).toEqual( { noteId: [ 2 ], name: 'test' } );
	} );

	it( 'handles null metadata', () => {
		const result = removeNoteIdFromMetadata( null, 1 );
		expect( result.noteId ).toBeUndefined();
	} );

	it( 'handles undefined metadata', () => {
		const result = removeNoteIdFromMetadata( undefined, 1 );
		expect( result.noteId ).toBeUndefined();
	} );

	it( 'removes last note and cleans up noteId to undefined', () => {
		const result = removeNoteIdFromMetadata(
			{ noteId: [ 42 ], name: 'test' },
			42
		);
		expect( result ).toEqual( { name: 'test', noteId: undefined } );
	} );
} );

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
