/**
 * Internal dependencies
 */
import makeFamiliesFromFaces from '../make-families-from-faces';

/* global Blob */
function createMockFile(
	name = 'file.ttf',
	size = 1024,
	mimeType = 'text/plain'
) {
	const file = new Blob( [ new ArrayBuffer( size ) ], { type: mimeType } );
	file.name = name;
	return file;
}

describe( 'makeFamiliesFromFaces', () => {
	it( 'handles empty fontFaces list', () => {
		const result = makeFamiliesFromFaces( [] );
		expect( result ).toEqual( [] );
	} );

	it( 'groups fontFaces by fontFamily', () => {
		const fontFaces = [
			{ fontFamily: 'Lobster', file: createMockFile( 'lobster1.ttf' ) },
			{
				fontFamily: 'Piazzolla',
				file: createMockFile( 'piazzolla1.ttf' ),
			},
			{ fontFamily: 'Lobster', file: createMockFile( 'lobster2.ttf' ) },
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

	it( 'sets correct uploadedFile field when file is present', () => {
		const fontFaces = [
			{
				fontFamily: 'Lobster',
				file: createMockFile( 'lobster-400-normal.ttf' ),
			},
			{
				fontFamily: 'Lobster',
				file: createMockFile( 'lobster-400-italic.ttf' ),
			},
			{
				fontFamily: 'Piazzolla',
				file: createMockFile( 'piazzolla-600.ttf' ),
			},
		];
		const result = makeFamiliesFromFaces( fontFaces );

		const lobsterFamily = result.find(
			( family ) => family.slug === 'lobster'
		);
		const piazzollaFamily = result.find(
			( family ) => family.slug === 'piazzolla'
		);

		expect( lobsterFamily.fontFace[ 0 ].uploadedFile ).toBe( 'files0' );
		expect( lobsterFamily.fontFace[ 1 ].uploadedFile ).toBe( 'files1' );
		expect( piazzollaFamily.fontFace[ 0 ].uploadedFile ).toBe( 'files2' );
	} );

	it( 'generates correct name for fontFamily names', () => {
		const fontFaces = [
			{
				fontFamily: 'Piazzolla',
				file: createMockFile( 'piazzolla.ttf' ),
			},
		];

		const result = makeFamiliesFromFaces( fontFaces );
		expect( result[ 0 ].name ).toBe( 'Piazzolla' );
	} );

	it( 'generates correct slug for fontFamily names', () => {
		const fontFaces = [
			{
				fontFamily: 'Times New Roman',
				file: createMockFile( 'times.ttf' ),
			},
		];

		const result = makeFamiliesFromFaces( fontFaces );

		expect( result[ 0 ].slug ).toBe( 'times-new-roman' );
	} );
} );
