import { describe, expect, it } from 'vitest';
import { findAspectRatioOption, parseAspectRatio } from '../utils';

describe( 'parseAspectRatio', () => {
	it.each( [
		[ '1', 1 ],
		[ '1/1', 1 ],
		[ '16/9', 16 / 9 ],
		[ '16 / 9', 16 / 9 ],
		[ '1.5', 1.5 ],
		[ '3/2', 1.5 ],
	] )( 'parses %s', ( value, expected ) => {
		expect( parseAspectRatio( value ) ).toBe( expected );
	} );

	it.each( [
		[ 'auto' ],
		[ '' ],
		[ '16/9/2' ],
		[ '0' ],
		[ '1/0' ],
		[ '-16/9' ],
		[ undefined ],
		[ null ],
	] )( 'returns null for %s', ( value ) => {
		expect( parseAspectRatio( value ) ).toBeNull();
	} );
} );

describe( 'findAspectRatioOption', () => {
	const options = [
		{ label: 'Original', value: 'auto' },
		{ label: 'Square', value: '1' },
		{ label: 'Wide', value: '16/9' },
	];

	it( 'matches an option by value', () => {
		expect( findAspectRatioOption( '16/9', options ) ).toBe( options[ 2 ] );
	} );

	it( 'matches an option describing the same ratio', () => {
		expect( findAspectRatioOption( '1/1', options ) ).toBe( options[ 1 ] );
		expect( findAspectRatioOption( '16 / 9', options ) ).toBe(
			options[ 2 ]
		);
	} );

	it( 'returns null when no option describes the ratio', () => {
		expect( findAspectRatioOption( '7/5', options ) ).toBeNull();
		expect( findAspectRatioOption( 'nonsense', options ) ).toBeNull();
	} );
} );
