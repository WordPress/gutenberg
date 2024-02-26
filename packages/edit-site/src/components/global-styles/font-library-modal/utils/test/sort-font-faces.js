/**
 * Internal dependencies
 */
import { sortFontFaces } from '../sort-font-faces';

describe( 'sortFontFaces', () => {
	it( 'should prioritize "normal" fontStyle and then sort by numeric fontWeight values', () => {
		const input = [
			{ fontStyle: 'normal', fontWeight: '500' },
			{ fontStyle: 'normal', fontWeight: '400' },
		];
		const expected = [
			{ fontStyle: 'normal', fontWeight: '400' },
			{ fontStyle: 'normal', fontWeight: '500' },
		];
		expect( sortFontFaces( input ) ).toEqual( expected );
	} );

	it( 'should correctly sort named fontWeight values within the same fontStyle', () => {
		const input = [
			{ fontStyle: 'italic', fontWeight: 'bold' },
			{ fontStyle: 'italic', fontWeight: 'normal' },
		];
		const expected = [
			{ fontStyle: 'italic', fontWeight: 'normal' },
			{ fontStyle: 'italic', fontWeight: 'bold' },
		];
		expect( sortFontFaces( input ) ).toEqual( expected );
	} );

	it( 'should prioritize fontStyle "normal" over other styles', () => {
		const input = [
			{ fontStyle: 'italic', fontWeight: '400' },
			{ fontStyle: 'normal', fontWeight: '500' },
		];
		const expected = [
			{ fontStyle: 'normal', fontWeight: '500' },
			{ fontStyle: 'italic', fontWeight: '400' },
		];
		expect( sortFontFaces( input ) ).toEqual( expected );
	} );

	it( 'should sort other fontStyles alphabetically after "normal"', () => {
		const input = [
			{ fontStyle: 'oblique', fontWeight: '500' },
			{ fontStyle: 'italic', fontWeight: '500' },
		];
		const expected = [
			{ fontStyle: 'italic', fontWeight: '500' },
			{ fontStyle: 'oblique', fontWeight: '500' },
		];
		expect( sortFontFaces( input ) ).toEqual( expected );
	} );

	it( 'should correctly handle multiple test cases', () => {
		const input = [
			{ fontStyle: 'oblique', fontWeight: '300' },
			{ fontStyle: 'normal', fontWeight: '400' },
			{ fontStyle: 'italic', fontWeight: '500' },
			{ fontStyle: 'italic', fontWeight: 'bold' },
			{ fontStyle: 'italic', fontWeight: '600 900' },
			{ fontStyle: 'normal', fontWeight: '500' },
		];
		const expected = [
			{ fontStyle: 'normal', fontWeight: '400' },
			{ fontStyle: 'normal', fontWeight: '500' },
			{ fontStyle: 'italic', fontWeight: '500' },
			{ fontStyle: 'italic', fontWeight: '600 900' },
			{ fontStyle: 'italic', fontWeight: 'bold' },
			{ fontStyle: 'oblique', fontWeight: '300' },
		];
		expect( sortFontFaces( input ) ).toEqual( expected );
	} );
} );
