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

	it( 'return undefined when the url starts with file:', () => {
		const input = 'file:./theme/assets/font1.ttf';
		expect( getDisplaySrcFromFontFace( input ) ).toBe( undefined );
	} );

	it( 'encodes the URL if it is not encoded', () => {
		const input = 'https://example.org/font one with spaces.ttf';
		expect( getDisplaySrcFromFontFace( input ) ).toBe(
			'https://example.org/font%20one%20with%20spaces.ttf'
		);
	} );

	it( 'does not encode the URL if it is already encoded', () => {
		const input = 'https://example.org/fonts/font%20one.ttf';
		expect( getDisplaySrcFromFontFace( input ) ).toBe(
			'https://example.org/fonts/font%20one.ttf'
		);
	} );
} );
