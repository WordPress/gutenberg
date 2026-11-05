import { describe, expect, it } from 'vitest';
import {
	DEFAULT_FREQUENT_CHARACTERS,
	MAX_FREQUENT_CHARACTERS,
	getFrequentCharacters,
	recordCharacterUse,
} from '../frequent-characters';
import { getSpecialCharacterCategories } from '../characters';

const isAnything = () => true;

describe( 'recordCharacterUse', () => {
	it( 'adds a first pick with a count of one', () => {
		expect( recordCharacterUse( undefined, '—' ) ).toEqual( [
			{ char: '—', count: 1 },
		] );
	} );

	it( 'counts repeat picks and moves them ahead of less used ones', () => {
		let entries = recordCharacterUse( [], '©' );
		entries = recordCharacterUse( entries, '€' );
		entries = recordCharacterUse( entries, '€' );
		expect( entries ).toEqual( [
			{ char: '€', count: 2 },
			{ char: '©', count: 1 },
		] );
	} );

	it( 'puts the latest pick first among equal counts', () => {
		let entries = recordCharacterUse( [], '©' );
		entries = recordCharacterUse( entries, '€' );
		expect( entries.map( ( { char } ) => char ) ).toEqual( [ '€', '©' ] );
	} );

	it( 'drops malformed stored entries', () => {
		const stored = [
			{ char: '©', count: 3 },
			{ char: '', count: 2 },
			{ char: '€', count: -1 },
			{ char: '°', count: Infinity },
			{ char: 42, count: 1 },
			null,
			'—',
		];
		expect( recordCharacterUse( stored, '™' ) ).toEqual( [
			{ char: '©', count: 3 },
			{ char: '™', count: 1 },
		] );
	} );

	it( 'starts over when the stored value is not a list', () => {
		expect( recordCharacterUse( { char: '©' }, '™' ) ).toEqual( [
			{ char: '™', count: 1 },
		] );
	} );

	it( 'keeps the new pick when the list is full', () => {
		let entries = Array.from(
			{ length: MAX_FREQUENT_CHARACTERS },
			( _, i ) => ( { char: String.fromCharCode( 0x41 + i ), count: 5 } )
		);
		entries = recordCharacterUse( entries, '€' );
		expect( entries ).toHaveLength( MAX_FREQUENT_CHARACTERS );
		expect( entries.at( -1 ) ).toEqual( { char: '€', count: 1 } );
	} );
} );

describe( 'getFrequentCharacters', () => {
	it( 'shows the defaults before anything has been picked', () => {
		expect( getFrequentCharacters( undefined, isAnything ) ).toEqual(
			DEFAULT_FREQUENT_CHARACTERS
		);
	} );

	it( 'puts picks first, followed by defaults not already listed', () => {
		expect(
			getFrequentCharacters(
				[
					{ char: '±', count: 2 },
					{ char: '©', count: 1 },
				],
				isAnything,
				[ '—', '©' ]
			)
		).toEqual( [ '±', '©', '—' ] );
	} );

	it( 'skips characters the picker no longer offers', () => {
		expect(
			getFrequentCharacters(
				[ { char: '☃', count: 4 } ],
				( char ) => char !== '☃',
				[ '—' ]
			)
		).toEqual( [ '—' ] );
	} );

	it( 'caps the list', () => {
		const stored = Array.from(
			{ length: MAX_FREQUENT_CHARACTERS + 4 },
			( _, i ) => ( { char: String.fromCharCode( 0x41 + i ), count: 1 } )
		);
		expect( getFrequentCharacters( stored, isAnything ) ).toHaveLength(
			MAX_FREQUENT_CHARACTERS
		);
	} );

	it( 'only uses defaults the picker offers', () => {
		const offered = new Set(
			getSpecialCharacterCategories().flatMap( ( { characters } ) =>
				characters.map( ( { char } ) => char )
			)
		);
		for ( const char of DEFAULT_FREQUENT_CHARACTERS ) {
			expect( offered.has( char ) ).toBe( true );
		}
	} );
} );
