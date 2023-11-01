/**
 * Internal dependencies
 */
import getIntersectingFontFaces from '../get-intersecting-font-faces';

describe( 'getIntersectingFontFaces', () => {
	it( 'returns matching font faces for matching font family', () => {
		const intendedFontsFamilies = [
			{
				slug: 'lobster',
				fontFace: [
					{
						fontWeight: '400',
						fontStyle: 'normal',
					},
				],
			},
		];

		const existingFontFamilies = [
			{
				slug: 'lobster',
				fontFace: [
					{
						fontWeight: '400',
						fontStyle: 'normal',
					},
				],
			},
		];

		const result = getIntersectingFontFaces(
			intendedFontsFamilies,
			existingFontFamilies
		);

		expect( result ).toEqual( intendedFontsFamilies );
	} );

	it( 'returns empty array when there is no match', () => {
		const intendedFontsFamilies = [
			{
				slug: 'lobster',
				fontFace: [
					{
						fontWeight: '400',
						fontStyle: 'normal',
					},
				],
			},
		];

		const existingFontFamilies = [
			{
				slug: 'montserrat',
				fontFace: [
					{
						fontWeight: '400',
						fontStyle: 'normal',
					},
				],
			},
		];

		const result = getIntersectingFontFaces(
			intendedFontsFamilies,
			existingFontFamilies
		);

		expect( result ).toEqual( [] );
	} );

	it( 'returns matching font faces', () => {
		const intendedFontsFamilies = [
			{
				slug: 'lobster',
				fontFace: [
					{
						fontWeight: '400',
						fontStyle: 'normal',
					},
					{
						fontWeight: '700',
						fontStyle: 'italic',
					},
				],
			},
			{
				slug: 'times',
				fontFace: [
					{
						fontWeight: '400',
						fontStyle: 'normal',
					},
				],
			},
		];

		const existingFontFamilies = [
			{
				slug: 'lobster',
				fontFace: [
					{
						fontWeight: '400',
						fontStyle: 'normal',
					},
					{
						fontWeight: '800',
						fontStyle: 'italic',
					},
					{
						fontWeight: '900',
						fontStyle: 'italic',
					},
				],
			},
		];

		const expectedOutput = [
			{
				slug: 'lobster',
				fontFace: [
					{
						fontWeight: '400',
						fontStyle: 'normal',
					},
				],
			},
		];

		const result = getIntersectingFontFaces(
			intendedFontsFamilies,
			existingFontFamilies
		);

		expect( result ).toEqual( expectedOutput );
	} );

	it( 'returns empty array when the first list is empty', () => {
		const intendedFontsFamilies = [];

		const existingFontFamilies = [
			{
				slug: 'lobster',
				fontFace: [
					{
						fontWeight: '400',
						fontStyle: 'normal',
					},
				],
			},
		];

		const result = getIntersectingFontFaces(
			intendedFontsFamilies,
			existingFontFamilies
		);

		expect( result ).toEqual( [] );
	} );

	it( 'returns empty array when the second list is empty', () => {
		const intendedFontsFamilies = [
			{
				slug: 'lobster',
				fontFace: [
					{
						fontWeight: '400',
						fontStyle: 'normal',
					},
				],
			},
		];

		const existingFontFamilies = [];

		const result = getIntersectingFontFaces(
			intendedFontsFamilies,
			existingFontFamilies
		);

		expect( result ).toEqual( [] );
	} );

	it( 'returns intersecting font family when there are no fonfaces', () => {
		const intendedFontsFamilies = [
			{
				slug: 'piazzolla',
				fontFace: [ { fontStyle: 'normal', fontWeight: '400' } ],
			},
			{
				slug: 'lobster',
			},
		];

		const existingFontFamilies = [
			{
				slug: 'lobster',
			},
		];

		const result = getIntersectingFontFaces(
			intendedFontsFamilies,
			existingFontFamilies
		);

		expect( result ).toEqual( existingFontFamilies );
	} );

	it( 'returns intersecting if there is an intended font face and is not present in the returning it should not be returned', () => {
		const intendedFontsFamilies = [
			{
				slug: 'piazzolla',
				fontFace: [ { fontStyle: 'normal', fontWeight: '400' } ],
			},
			{
				slug: 'lobster',
				fontFace: [ { fontStyle: 'normal', fontWeight: '400' } ],
			},
		];

		const existingFontFamilies = [
			{
				slug: 'lobster',
			},
		];

		const result = getIntersectingFontFaces(
			intendedFontsFamilies,
			existingFontFamilies
		);
		const expected = [
			{
				slug: 'lobster',
				fontFace: [],
			},
		];
		expect( result ).toEqual( expected );
	} );
} );
