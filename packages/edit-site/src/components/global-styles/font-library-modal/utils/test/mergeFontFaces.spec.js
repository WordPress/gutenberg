/**
 * Internal dependencies
 */
import { mergeFontFaces } from '../index';

describe( 'mergeFontFaces', () => {
	it( 'should return an empty array when both existing and incoming arrays are empty', () => {
		expect( mergeFontFaces() ).toEqual( [] );
	} );

	it( 'should return the existing array when the incoming array is empty', () => {
		const existing = [ { fontWeight: 'normal', fontStyle: 'italic' } ];
		expect( mergeFontFaces( existing, [] ) ).toEqual( existing );
	} );

	it( 'should return the incoming array when the existing array is empty', () => {
		const incoming = [ { fontWeight: 'bold', fontStyle: 'normal' } ];
		expect( mergeFontFaces( [], incoming ) ).toEqual( incoming );
	} );

	it( 'should merge non-overlapping existing and incoming arrays', () => {
		const existing = [ { fontWeight: 'normal', fontStyle: 'italic' } ];
		const incoming = [ { fontWeight: 'bold', fontStyle: 'normal' } ];
		expect( mergeFontFaces( existing, incoming ) ).toEqual( [
			...existing,
			...incoming,
		] );
	} );

	it( 'should overwrite duplicates with the incoming array', () => {
		const existing = [
			{ fontWeight: 'normal', fontStyle: 'italic', src: 'old-src' },
		];
		const incoming = [
			{ fontWeight: 'normal', fontStyle: 'italic', src: 'new-src' },
		];
		expect( mergeFontFaces( existing, incoming ) ).toEqual( incoming );
	} );

	it( 'should handle multiple elements in both existing and incoming arrays', () => {
		const existing = [
			{ fontWeight: 'normal', fontStyle: 'italic', src: 'old-1' },
			{ fontWeight: 'bold', fontStyle: 'normal', src: 'old-2' },
		];
		const incoming = [
			{ fontWeight: 'normal', fontStyle: 'italic', src: 'new-1' },
			{ fontWeight: 'bold', fontStyle: 'oblique', src: 'new-2' },
		];
		const expected = [
			{ fontWeight: 'normal', fontStyle: 'italic', src: 'new-1' },
			{ fontWeight: 'bold', fontStyle: 'normal', src: 'old-2' },
			{ fontWeight: 'bold', fontStyle: 'oblique', src: 'new-2' },
		];
		expect( mergeFontFaces( existing, incoming ) ).toEqual( expected );
	} );
} );
