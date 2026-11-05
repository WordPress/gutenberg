import { describe, expect, it } from 'vitest';
import {
	getSpecialCharacterCategories,
	searchSpecialCharacters,
} from '../characters';
import type { SpecialCharacterCategory } from '../characters';

const categories: SpecialCharacterCategory[] = [
	{
		slug: 'punctuation',
		label: 'Punctuation',
		characters: [
			{ char: '–', name: 'En dash' },
			{ char: '—', name: 'Em dash' },
		],
	},
	{
		slug: 'latin',
		label: 'Latin',
		characters: [ { char: 'é', name: 'Lettre e minuscule accent aigu' } ],
	},
	{
		slug: 'duplicate',
		label: 'Duplicate',
		characters: [ { char: '—', name: 'Em dash' } ],
	},
];

describe( 'searchSpecialCharacters', () => {
	it( 'returns nothing for an empty or blank search', () => {
		expect( searchSpecialCharacters( categories, '' ) ).toEqual( [] );
		expect( searchSpecialCharacters( categories, '   ' ) ).toEqual( [] );
	} );

	it( 'matches every word of the search, in any order, ignoring case', () => {
		expect(
			searchSpecialCharacters( categories, 'DASH em' ).map(
				( { char } ) => char
			)
		).toEqual( [ '—' ] );
	} );

	it( 'ignores diacritics in the search and the name', () => {
		expect(
			searchSpecialCharacters( categories, 'aigú' ).map(
				( { char } ) => char
			)
		).toEqual( [ 'é' ] );
	} );

	it( 'finds a character by the character itself', () => {
		expect(
			searchSpecialCharacters( categories, '–' ).map(
				( { char } ) => char
			)
		).toEqual( [ '–' ] );
	} );

	it( 'lists a character in several categories only once', () => {
		expect(
			searchSpecialCharacters( categories, 'dash' ).map(
				( { char } ) => char
			)
		).toEqual( [ '–', '—' ] );
	} );
} );

describe( 'getSpecialCharacterCategories', () => {
	it( 'gives every category characters, and every character a name', () => {
		for ( const category of getSpecialCharacterCategories() ) {
			expect( category.characters.length ).toBeGreaterThan( 0 );
			for ( const character of category.characters ) {
				expect( character.name ).not.toBe( '' );
				// One code point, so the preview's code point label is right.
				expect( [ ...character.char ] ).toHaveLength( 1 );
			}
		}
	} );

	it( 'does not repeat a character', () => {
		const chars = getSpecialCharacterCategories().flatMap(
			( { characters } ) => characters.map( ( { char } ) => char )
		);
		expect( new Set( chars ).size ).toBe( chars.length );
	} );
} );
