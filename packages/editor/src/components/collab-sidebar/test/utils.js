/**
 * Internal dependencies
 */
import {
	getNoteIdsFromMetadata,
	addNoteIdToMetadata,
	removeNoteIdFromMetadata,
} from '../utils';

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
