import { describe, expect, it } from 'vitest';
import {
	blockSuggestionContextLines,
	suggestionContextLines,
} from '../suggestion-context';

const names: Record< string, string > = { '1': 'Anne', '2': 'Bob' };
const nameOf = ( id: string ) => names[ id ];

describe( 'suggestionContextLines', () => {
	it( 'says which addition a nested suggestion sits in', () => {
		expect(
			suggestionContextLines( {
				relations: {
					parents: [ { id: '1', kind: 'add', authorId: '1' } ],
					children: [],
					partlyIn: [],
					alsoDeleting: [],
					builtOn: [],
				},
				emptiedCount: 0,
				nameOf,
			} )
		).toEqual( [ 'Inside a suggested addition by Anne' ] );
	} );

	it( 'names every addition a nested suggestion sits in', () => {
		expect(
			suggestionContextLines( {
				relations: {
					parents: [
						{ id: '1', kind: 'add', authorId: '1' },
						{ id: '2', kind: 'add', authorId: '2' },
					],
					children: [],
					partlyIn: [],
					alsoDeleting: [],
					builtOn: [],
				},
				emptiedCount: 0,
				nameOf,
			} )
		).toEqual( [ 'Inside suggested additions by Anne, Bob' ] );
	} );

	it( 'says who else suggested deleting the same text', () => {
		expect(
			suggestionContextLines( {
				relations: {
					parents: [],
					children: [],
					partlyIn: [],
					alsoDeleting: [
						{ id: '1', kind: 'del', authorId: '1' },
						{ id: '3', kind: 'del', authorId: '3' },
					],
					builtOn: [],
				},
				emptiedCount: 0,
				nameOf,
			} )
		).toEqual( [
			'Anne also suggested deleting this text',
			'Someone else also suggested deleting this text',
		] );
	} );

	it( 'says whose formatting change a formatting change was made on', () => {
		expect(
			suggestionContextLines( {
				relations: {
					parents: [],
					children: [],
					partlyIn: [],
					alsoDeleting: [],
					builtOn: [
						{ id: '1', kind: 'format', authorId: '1' },
						{ id: '3', kind: 'format', authorId: '3' },
					],
				},
				emptiedCount: 0,
				nameOf,
			} )
		).toEqual( [
			'Built on a suggested formatting change by Anne',
			'Built on another suggested formatting change',
		] );
	} );

	it( 'counts the suggestions others made inside an addition, and warns before rejecting it', () => {
		expect(
			suggestionContextLines( {
				relations: {
					parents: [],
					children: [
						{ id: '2', kind: 'format', authorId: '2' },
						{ id: '3', kind: 'del', authorId: '3' },
					],
					partlyIn: [],
					alsoDeleting: [],
					builtOn: [],
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
					parents: [],
					children: [ { id: '2', kind: 'del', authorId: '2' } ],
					partlyIn: [],
					alsoDeleting: [],
					builtOn: [],
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
					parents: [],
					children: [],
					partlyIn: [ { id: '2', kind: 'add', authorId: '2' } ],
					alsoDeleting: [],
					builtOn: [],
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
					parents: [ { id: '9', kind: 'add', authorId: '9' } ],
					children: [],
					partlyIn: [],
					alsoDeleting: [],
					builtOn: [],
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
					parents: [],
					children: [ { id: '2', kind: 'del', authorId: '2' } ],
					partlyIn: [],
					alsoDeleting: [],
					builtOn: [],
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
				relations: {
					parents: [],
					children: [],
					partlyIn: [],
					alsoDeleting: [],
					builtOn: [],
				},
				emptiedCount: 0,
				nameOf,
			} )
		).toEqual( [] );
	} );
} );

describe( 'blockSuggestionContextLines', () => {
	const markers = [
		{ type: 'pending-insert', authorId: 3, commentId: 1 },
		{ type: 'pending-remove', authorId: 7, commentId: 2 },
		{ type: 'pending-attributes', authorId: 9, after: { level: 3 } },
	] as any[];

	it( 'names the other suggestions on the block', () => {
		expect(
			blockSuggestionContextLines( { markers, noteId: '2', nameOf } )
		).toEqual( [
			'Anne suggested adding this block',
			'Someone else also suggested changes to this block',
		] );
	} );

	it( 'says rejecting a suggested block outdates what others suggested on it', () => {
		expect(
			blockSuggestionContextLines( { markers, noteId: '1', nameOf } )
		).toEqual( [
			'Bob also suggested removing this block',
			'Someone else also suggested changes to this block',
			'Rejecting also makes 2 suggestions outdated.',
		] );
	} );

	it( 'says nothing for a block with one suggestion', () => {
		expect(
			blockSuggestionContextLines( {
				markers: markers.slice( 0, 1 ),
				noteId: '1',
				nameOf,
			} )
		).toEqual( [] );
	} );
} );
