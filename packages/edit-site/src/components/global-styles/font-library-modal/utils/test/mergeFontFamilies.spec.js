/**
 * Internal dependencies
 */
import { mergeFontFamilies } from '../index';

describe( 'mergeFontFamilies', () => {
	it( 'should return an empty array when both inputs are empty', () => {
		const result = mergeFontFamilies( [], [] );
		expect( result ).toEqual( [] );
	} );

	it( 'should return the existing array when incoming array is empty', () => {
		const existing = [
			{ slug: 'lobster', name: 'Lobster', fontFamily: 'Lobster' },
		];
		const result = mergeFontFamilies( existing, [] );
		expect( result ).toEqual( existing );
	} );

	it( 'should concar non-conflicting arrays', () => {
		const existing = [
			{ slug: 'lobster', name: 'Lobster', fontFamily: 'Lobster' },
		];
		const incoming = [
			{ slug: 'piazzola', name: 'Piazzolla', fontFamily: 'Piazzolla' },
		];
		const result = mergeFontFamilies( existing, incoming );
		expect( result ).toEqual( [ ...existing, ...incoming ] );
	} );

	it( 'should merge non-conflicting arrays', () => {
		const existing = [
			{ slug: 'lobster', name: 'Lobster', fontFamily: 'Lobster' },
			{ slug: 'piazzola', name: 'Piazzolla', fontFamily: 'Piazzolla' },
		];
		const incoming = [
			{ slug: 'piazzola', name: 'Piazzolla', fontFamily: 'Piazzolla' },
		];
		const result = mergeFontFamilies( existing, incoming );
		expect( result ).toHaveLength( 2 );
	} );

	it( 'should overwrite existing font family data with incoming data', () => {
		const existing = [
			{ slug: 'lobster', name: 'Lobster', fontFamily: 'Lobster' },
			{ slug: 'piazzola', name: 'Piazzolla', fontFamily: 'Piazzolla' },
		];
		const incoming = [
			{
				slug: 'piazzola',
				name: 'Piazzolla',
				fontFamily: 'Piazzolla, serif',
			},
		];
		const result = mergeFontFamilies( existing, incoming );
		expect( result[ 1 ].fontFamily ).toBe( 'Piazzolla, serif' );
	} );

	it( 'should merge fontFaces from incoming array', () => {
		const existing = [
			{
				slug: 'lobster',
				name: 'Lobster',
				fontFamily: 'Lobster',
			},
			{
				slug: 'piazzola',
				name: 'Piazzolla',
				fontFamily: 'Piazzolla',
				fontFace: [
					{ fontWeight: 400, fontStyle: 'normal', src: 'url' },
					{ fontWeight: 500, fontStyle: 'normal', src: 'url' },
				],
			},
		];
		const incoming = [
			{
				slug: 'piazzola',
				name: 'Piazzolla',
				fontFamily: 'Piazzolla, serif',
				fontFace: [
					{ fontWeight: 800, fontStyle: 'normal', src: 'url' },
					{ fontWeight: 400, fontStyle: 'normal', src: 'url' },
				],
			},
		];
		const expected = [
			{
				slug: 'lobster',
				name: 'Lobster',
				fontFamily: 'Lobster',
			},
			{
				slug: 'piazzola',
				name: 'Piazzolla',
				fontFamily: 'Piazzolla, serif',
				fontFace: [
					{ fontWeight: 400, fontStyle: 'normal', src: 'url' },
					{ fontWeight: 500, fontStyle: 'normal', src: 'url' },
					{ fontWeight: 800, fontStyle: 'normal', src: 'url' },
				],
			},
		];

		const result = mergeFontFamilies( existing, incoming );
		expect( result ).toEqual( expected );
	} );
} );
