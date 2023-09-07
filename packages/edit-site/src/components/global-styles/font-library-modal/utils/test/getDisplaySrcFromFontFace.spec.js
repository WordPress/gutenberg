/**
 * Internal dependencies
 */
import { getDisplaySrcFromFontFace } from '../index';

describe( 'getDisplaySrcFromFontFace', () => {
	it( 'returns the first item when input is an array', () => {
		const input = [
			'http://example.com/font-asset-1.ttf',
			'http://example.com/font-asset-2.ttf',
		];
		expect( getDisplaySrcFromFontFace( input ) ).toBe(
			'http://example.com/font-asset-1.ttf'
		);
	} );

	it( 'returns the input when it is a string', () => {
		const input = 'http://example.com/font-asset-1.ttf';
		expect( getDisplaySrcFromFontFace( input ) ).toBe(
			'http://example.com/font-asset-1.ttf'
		);
	} );

	it( 'makes URL absolute when it starts with file:. and urlPrefix is given', () => {
		const input = 'file:./font1';
		const urlPrefix = 'http://example.com';
		expect( getDisplaySrcFromFontFace( input, urlPrefix ) ).toBe(
			'http://example.com/font1'
		);
	} );

	it( 'does not modify URL if it does not start with file:.', () => {
		const input = [ 'http://some-other-place.com/font1' ];
		const urlPrefix = 'http://example.com';
		expect( getDisplaySrcFromFontFace( input, urlPrefix ) ).toBe(
			'http://some-other-place.com/font1'
		);
	} );

	it( 'encodes the URL if it is not encoded', () => {
		const input = 'file:./assets/font one with spaces.ttf';
		expect( getDisplaySrcFromFontFace( input ) ).toBe(
			'file:./assets/font%20one%20with%20spaces.ttf'
		);
	} );

	it( 'does not encode the URL if it is already encoded', () => {
		const input = 'file:./font%20one';
		expect( getDisplaySrcFromFontFace( input ) ).toBe(
			'file:./font%20one'
		);
	} );
} );
