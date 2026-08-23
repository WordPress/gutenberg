import { getFacePreviewStyle, getFamilyPreviewStyle } from '../preview-styles';

describe( 'getFacePreviewStyle', () => {
	it.each( [
		[ '700', '700' ],
		[ '200 900', '400' ],
		[ '500 900', '500' ],
		[ '100 300', '300' ],
		[ 'bold', '700' ],
		[ '500 bold', '500' ],
		[ 'auto', '400' ],
		[ undefined, '400' ],
	] )( 'resolves %p to %p', ( fontWeight, expected ) => {
		expect(
			getFacePreviewStyle( { fontFamily: 'Inter', fontWeight } )
		).toEqual( expect.objectContaining( { fontWeight: expected } ) );
	} );
} );

describe( 'getFamilyPreviewStyle', () => {
	it( 'resolves the range of the normal faces', () => {
		expect(
			getFamilyPreviewStyle( {
				fontFamily: 'Inter',
				fontFace: [ { fontStyle: 'normal', fontWeight: '150 700' } ],
			} )
		).toEqual( expect.objectContaining( { fontWeight: '400' } ) );
	} );

	it( 'picks the weight closest to regular across the normal faces', () => {
		expect(
			getFamilyPreviewStyle( {
				fontFamily: 'Inter',
				fontFace: [
					{ fontStyle: 'normal', fontWeight: '700' },
					{ fontStyle: 'normal', fontWeight: '500' },
				],
			} )
		).toEqual( expect.objectContaining( { fontWeight: '500' } ) );
	} );

	it( 'falls back to the first face when none are normal', () => {
		expect(
			getFamilyPreviewStyle( {
				fontFamily: 'Inter',
				fontFace: [ { fontStyle: 'italic', fontWeight: '200 900' } ],
			} )
		).toEqual(
			expect.objectContaining( {
				fontStyle: 'italic',
				fontWeight: '400',
			} )
		);
	} );
} );
