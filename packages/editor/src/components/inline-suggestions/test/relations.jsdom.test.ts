/**
 * How one inline suggestion sits relative to the others in its value: inside
 * someone's addition, holding others' suggestions, or partly inside one.
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
			parent: null,
			children: [
				{ id: '2', kind: 'format', authorId: '2' },
				{ id: '3', kind: 'del', authorId: '3' },
			],
			partlyIn: [],
		} );
	} );

	it( 'names the addition a nested suggestion sits in', () => {
		expect( suggestionRelations( annezazu(), 3 ) ).toEqual( {
			parent: { id: '1', kind: 'add', authorId: '1' },
			children: [],
			partlyIn: [],
		} );
		expect( suggestionRelations( annezazu(), 2 ).parent?.id ).toBe( '1' );
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
			parent: null,
			children: [],
			partlyIn: [ { id: '6', kind: 'add', authorId: '2' } ],
		} );
		// The addition holds part of the deletion: not a child of it.
		expect( suggestionRelations( value, 6 ).children ).toEqual( [] );
	} );

	it( 'ignores the author’s own markers inside their own addition', () => {
		const value = RichTextData.fromHTMLString(
			mark( 'add', 1, `a${ mark( 'format', 4, 'b', 1 ) }c`, 1 )
		);
		expect( suggestionRelations( value, 1 ).children ).toEqual( [] );
		expect( suggestionRelations( value, 4 ).parent ).toBeNull();
	} );

	it( 'reports nothing for a marker that is not in the value', () => {
		expect( suggestionRelations( annezazu(), 99 ) ).toEqual( {
			parent: null,
			children: [],
			partlyIn: [],
		} );
		expect( suggestionRelations( 'plain', 1 ).children ).toEqual( [] );
	} );
} );
