/**
 * Internal dependencies
 */
import makeFamiliesFromFaces from '../make-families-from-faces';

describe( 'makeFamiliesFromFaces', () => {
	it( 'handles empty fontFaces list', () => {
		const result = makeFamiliesFromFaces( [] );
		expect( result ).toEqual( [] );
	} );

	it( 'groups fontFaces by fontFamily', () => {
		const fontFaces = [
			{ fontFamily: 'Lobster' },
			{
				fontFamily: 'Piazzolla',
				file: { name: 'piazzolla.ttf' },
			},
			{ fontFamily: 'Lobster', file: { name: 'piazzolla.ttf' } },
		];

		const result = makeFamiliesFromFaces( fontFaces );

		expect( result ).toHaveLength( 2 );
		expect(
			result.find( ( family ) => family.name === 'Lobster' ).fontFace
		).toHaveLength( 2 );
		expect(
			result.find( ( family ) => family.name === 'Piazzolla' ).fontFace
		).toHaveLength( 1 );
	} );

	it( 'generates correct name for fontFamily names', () => {
		const fontFaces = [
			{
				fontFamily: 'Piazzolla',
				file: { name: 'piazzolla.ttf' },
			},
		];

		const result = makeFamiliesFromFaces( fontFaces );
		expect( result[ 0 ].name ).toBe( 'Piazzolla' );
	} );

	it( 'generates correct slug for fontFamily names', () => {
		const fontFaces = [
			{
				fontFamily: 'Times New Roman',
				file: { name: 'times.ttf' },
			},
		];

		const result = makeFamiliesFromFaces( fontFaces );

		expect( result[ 0 ].slug ).toBe( 'times-new-roman' );
	} );
} );
