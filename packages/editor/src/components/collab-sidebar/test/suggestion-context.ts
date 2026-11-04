import { describe, expect, it } from 'vitest';
import { suggestionContextLines } from '../suggestion-context';

const names: Record< string, string > = { '1': 'Anne', '2': 'Bob' };
const nameOf = ( id: string ) => names[ id ];

describe( 'suggestionContextLines', () => {
	it( 'says which addition a nested suggestion sits in', () => {
		expect(
			suggestionContextLines( {
				relations: {
					parent: { id: '1', kind: 'add', authorId: '1' },
					children: [],
					partlyIn: [],
				},
				emptiedCount: 0,
				nameOf,
			} )
		).toEqual( [ 'Inside a suggested addition by Anne' ] );
	} );

	it( 'counts the suggestions others made inside an addition, and warns before rejecting it', () => {
		expect(
			suggestionContextLines( {
				relations: {
					parent: null,
					children: [
						{ id: '2', kind: 'format', authorId: '2' },
						{ id: '3', kind: 'del', authorId: '3' },
					],
					partlyIn: [],
				},
				emptiedCount: 2,
				nameOf,
			} )
		).toEqual( [
			'Includes 2 suggestions from others',
			'Rejecting also makes 2 suggestions outdated.',
		] );
	} );

	it( 'uses the singular for one suggestion', () => {
		expect(
			suggestionContextLines( {
				relations: {
					parent: null,
					children: [ { id: '2', kind: 'del', authorId: '2' } ],
					partlyIn: [],
				},
				emptiedCount: 1,
				nameOf,
			} )
		).toEqual( [
			'Includes 1 suggestion from others',
			'Rejecting also makes 1 suggestion outdated.',
		] );
	} );

	it( 'says when a suggestion is only partly inside an addition', () => {
		expect(
			suggestionContextLines( {
				relations: {
					parent: null,
					children: [],
					partlyIn: [ { id: '2', kind: 'add', authorId: '2' } ],
				},
				emptiedCount: 0,
				nameOf,
			} )
		).toEqual( [ 'Partly inside a suggested addition by Bob' ] );
	} );

	it( 'falls back to a name-free line when the author is unknown', () => {
		expect(
			suggestionContextLines( {
				relations: {
					parent: { id: '9', kind: 'add', authorId: '9' },
					children: [],
					partlyIn: [],
				},
				emptiedCount: 0,
				nameOf,
			} )
		).toEqual( [ 'Inside another suggested addition' ] );
	} );

	it( 'leaves the consequence out once the suggestion is resolved', () => {
		expect(
			suggestionContextLines( {
				relations: {
					parent: null,
					children: [ { id: '2', kind: 'del', authorId: '2' } ],
					partlyIn: [],
				},
				emptiedCount: 1,
				nameOf,
				isResolved: true,
			} )
		).toEqual( [ 'Includes 1 suggestion from others' ] );
	} );

	it( 'says nothing for a suggestion that overlaps no other', () => {
		expect(
			suggestionContextLines( {
				relations: { parent: null, children: [], partlyIn: [] },
				emptiedCount: 0,
				nameOf,
			} )
		).toEqual( [] );
	} );
} );
