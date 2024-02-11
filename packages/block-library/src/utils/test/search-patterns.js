/**
 * Internal dependencies
 */
import {
	normalizeSearchInput,
	getPatternSearchRank,
	searchPatterns,
} from '../search-patterns';

describe( 'normalizeSearchInput', () => {
	it( 'should remove accents', () => {
		expect( normalizeSearchInput( 'café' ) ).toBe( 'cafe' );
	} );

	it( 'should trim and lowercase', () => {
		expect( normalizeSearchInput( '  Foo  ' ) ).toBe( 'foo' );
	} );
} );

describe( 'getPatternSearchRank', () => {
	it( 'should give a high rank to exact matches', () => {
		const pattern = { title: 'Foo' };
		expect( getPatternSearchRank( pattern, 'Foo' ) ).toBe( 30 );
	} );

	it( 'should give a high rank to prefix matches', () => {
		const pattern = { title: 'Foo' };
		expect( getPatternSearchRank( pattern, 'Fo' ) ).toBe( 20 );
	} );

	it( 'should give a low rank to no matches', () => {
		const pattern = { title: 'Foo' };
		expect( getPatternSearchRank( pattern, 'Bar' ) ).toBe( 0 );
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
