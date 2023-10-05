/**
 * Internal dependencies
 */
import makeFamiliesFromFaces from '../make-families-from-faces';

describe( 'makeFamiliesFromFaces', () => {
	it( 'handles empty fontFaces list', () => {
		const result = makeFamiliesFromFaces( [] );
		expect( result ).toEqual( null );
	} );

	it( 'collects multiple fontFaces for the same fontFamily', () => {
		const fontFaces = [
			{ fontFamily: 'Super Duper' },
			{
				fontFamily: 'Super Duper',
				file: { name: 'piazzolla.ttf' },
			},
			{ fontFamily: 'Super Duper', file: { name: 'piazzolla.ttf' } },
		];

		const result = makeFamiliesFromFaces( fontFaces );

		expect( result.name ).toEqual( 'Super Duper' );
		expect( result.fontFace ).toHaveLength( 3 );
	} );

	it( 'errors with multiple fontFaces for different fontFamilies', () => {
		const fontFaces = [
			{ fontFamily: 'Super Duper' },
			{ fontFamily: 'Duper Super', file: { name: 'piazzolla.ttf' } },
		];

		expect( () => makeFamiliesFromFaces( fontFaces ) ).toThrow(
			new Error(
				'You may only batch upload fonts from the same font family.'
			)
		);
	} );

	it( 'generates correct name for fontFamily names', () => {
		const fontFaces = [
			{
				fontFamily: 'Piazzolla',
				file: { name: 'piazzolla.ttf' },
			},
		];

		const result = makeFamiliesFromFaces( fontFaces );
		expect( result.name ).toBe( 'Piazzolla' );
	} );

	it( 'generates correct slug for fontFamily names', () => {
		const fontFaces = [
			{
				fontFamily: 'Times New Roman',
				file: { name: 'times.ttf' },
			},
		];

		const result = makeFamiliesFromFaces( fontFaces );

		expect( result.slug ).toBe( 'times-new-roman' );
	} );

	it( 'generates correct fontFamily property for fontFamily object', () => {
		const fontFaces = [
			{
				fontFamily: 'Times New Roman',
				file: { name: 'times.ttf' },
			},
		];

		const result = makeFamiliesFromFaces( fontFaces );

		expect( result.fontFamily ).toBe( 'Times New Roman' );
	} );
} );
