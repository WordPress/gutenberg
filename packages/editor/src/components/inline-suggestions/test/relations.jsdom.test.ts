/**
 * How one inline suggestion sits relative to the others in its value: inside
 * other people's additions, holding others' suggestions, partly inside one,
 * or deleting text someone else also proposed to delete.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RichTextData } from '@wordpress/rich-text';
import {
	registerSuggestionFormat,
	unregisterSuggestionFormats,
} from '../format';
import { suggestionRelations } from '../relations';

const mark = (
	kind: 'add' | 'del' | 'format',
	id: number,
	inner: string,
	author: number
) =>
	`<mark data-suggestion-id="${ id }" data-suggestion-type="${ kind }" data-author="${ author }" class="wp-suggestion-${ kind }">${ inner }</mark>`;

// annezazu's example: A (1) adds, B (2) bolds inside, C (3) deletes inside.
const annezazu = () =>
	RichTextData.fromHTMLString(
		`Intro.${ mark(
			'add',
			1,
			` Bright ${ mark(
				'format',
				2,
				`<strong>red </strong>${ mark(
					'del',
					3,
					'<strong>apples</strong>',
					3
				) }`,
				2
			) }${ mark( 'del', 3, ' fell', 3 ) }.`,
			1
		) }`
	);

describe( 'suggestionRelations', () => {
	beforeAll( () => {
		registerSuggestionFormat();
	} );

	afterAll( () => {
		unregisterSuggestionFormats();
	} );

	it( 'lists the suggestions others made inside an addition', () => {
		expect( suggestionRelations( annezazu(), 1 ) ).toEqual( {
			parents: [],
			children: [
				{ id: '2', kind: 'format', authorId: '2' },
				{ id: '3', kind: 'del', authorId: '3' },
			],
			partlyIn: [],
			alsoDeleting: [],
			builtOn: [],
		} );
	} );

	it( 'names the addition a nested suggestion sits in', () => {
		expect( suggestionRelations( annezazu(), 3 ) ).toEqual( {
			parents: [ { id: '1', kind: 'add', authorId: '1' } ],
			children: [],
			partlyIn: [],
			alsoDeleting: [],
			builtOn: [],
		} );
		expect( suggestionRelations( annezazu(), 2 ).parents[ 0 ]?.id ).toBe(
			'1'
		);
	} );

	it( 'reports a deletion that is only partly inside an addition', () => {
		const value = RichTextData.fromHTMLString(
			`a${ mark( 'del', 5, 'bc', 3 ) }${ mark(
				'add',
				6,
				`${ mark( 'del', 5, 'XY', 3 ) }Z`,
				2
			) }`
		);
		expect( suggestionRelations( value, 5 ) ).toEqual( {
			parents: [],
			children: [],
			partlyIn: [ { id: '6', kind: 'add', authorId: '2' } ],
			alsoDeleting: [],
			builtOn: [],
		} );
		// The addition holds part of the deletion: not a child of it.
		expect( suggestionRelations( value, 6 ).children ).toEqual( [] );
	} );

	it( 'ignores the author’s own markers inside their own addition', () => {
		const value = RichTextData.fromHTMLString(
			mark( 'add', 1, `a${ mark( 'format', 4, 'b', 1 ) }c`, 1 )
		);
		expect( suggestionRelations( value, 1 ).children ).toEqual( [] );
		expect( suggestionRelations( value, 4 ).parents ).toEqual( [] );
	} );

	it( 'lists every addition a nested addition sits in, oldest first', () => {
		// Anne (1) adds, Bob (2) types inside it, Carl (3) types inside Bob's.
		const value = RichTextData.fromHTMLString(
			`a${ mark(
				'add',
				10,
				`b${ mark(
					'add',
					11,
					`c${ mark( 'add', 12, 'd', 3 ) }e`,
					2
				) }f`,
				1
			) }g`
		);
		expect( suggestionRelations( value, 12 ).parents ).toEqual( [
			{ id: '10', kind: 'add', authorId: '1' },
			{ id: '11', kind: 'add', authorId: '2' },
		] );
		expect(
			suggestionRelations( value, 10 ).children.map( ( { id } ) => id )
		).toEqual( [ '11', '12' ] );
	} );

	it( 'reports another author deleting the same text', () => {
		const value = RichTextData.fromHTMLString(
			`a${ mark( 'del', 5, `b${ mark( 'del', 6, 'cd', 2 ) }`, 1 ) }e`
		);
		expect( suggestionRelations( value, 6 ).alsoDeleting ).toEqual( [
			{ id: '5', kind: 'del', authorId: '1' },
		] );
		expect( suggestionRelations( value, 5 ).alsoDeleting ).toEqual( [
			{ id: '6', kind: 'del', authorId: '2' },
		] );
	} );

	it( 'reports nothing for a marker that is not in the value', () => {
		expect( suggestionRelations( annezazu(), 99 ) ).toEqual( {
			parents: [],
			children: [],
			partlyIn: [],
			alsoDeleting: [],
			builtOn: [],
		} );
		expect( suggestionRelations( 'plain', 1 ).children ).toEqual( [] );
	} );

	it( 'names the formatting changes a formatting change was made on', () => {
		const value = RichTextData.fromHTMLString(
			`a${ mark(
				'format',
				4,
				`b${ mark( 'format', 9, '<em>cd</em>', 3 ) }`,
				2
			) }${ mark( 'format', 9, '<em>e</em>', 3 ) }`
		);
		expect( suggestionRelations( value, 9 ).builtOn ).toEqual( [
			{ id: '4', kind: 'format', authorId: '2' },
		] );
		// The older change was not made on the newer one.
		expect( suggestionRelations( value, 4 ).builtOn ).toEqual( [] );
	} );
} );
