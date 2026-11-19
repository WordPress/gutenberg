import { describe, expect, it } from 'vitest';
import { normalizeSearchInput, searchPatterns } from '../search-patterns';

describe( 'normalizeSearchInput', () => {
	it( 'should remove accents', () => {
		expect( normalizeSearchInput( 'café' ) ).toBe( 'cafe' );
	} );

	it( 'should trim and lowercase', () => {
		expect( normalizeSearchInput( '  Foo  ' ) ).toBe( 'foo' );
	} );
} );

describe( 'searchPatterns', () => {
	it( 'should return all patterns if no search term is provided', () => {
		const patterns = [ { title: 'Foo' }, { title: 'Bar' } ];
		expect( searchPatterns( patterns, '' ) ).toEqual( patterns );
	} );

	it( 'should return an empty array if no patterns are provided', () => {
		expect( searchPatterns( [], 'Foo' ) ).toEqual( [] );
	} );

	it( 'should return an empty array if no patterns match', () => {
		const patterns = [ { title: 'Foo' }, { title: 'Bar' } ];
		expect( searchPatterns( patterns, 'Baz' ) ).toEqual( [] );
	} );

	it( 'should return the matching patterns', () => {
		const patterns = [ { title: 'Foo' }, { title: 'Bar' } ];
		expect( searchPatterns( patterns, 'Foo' ) ).toEqual( [
			patterns[ 0 ],
		] );
	} );
} );
