/**
 * Internal dependencies
 */
import getIntersectingFontFaces from '../get-intersecting-font-faces';

describe( 'getIntersectingFontFaces', () => {
	it( 'returns matching font faces for matching font family', () => {
		const incomingFontFamilies = [
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
			incomingFontFamilies,
			existingFontFamilies
		);

		expect( result ).toEqual( incomingFontFamilies );
	} );

	it( 'returns empty array when there is no match', () => {
		const incomingFontFamilies = [
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
			incomingFontFamilies,
			existingFontFamilies
		);

		expect( result ).toEqual( [] );
	} );

	it( 'returns matching font faces', () => {
		const incomingFontFamilies = [
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
			incomingFontFamilies,
			existingFontFamilies
		);

		expect( result ).toEqual( expectedOutput );
	} );

	it( 'returns empty array when the first list is empty', () => {
		const incomingFontFamilies = [];

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
			incomingFontFamilies,
			existingFontFamilies
		);

		expect( result ).toEqual( [] );
	} );

	it( 'returns empty array when the second list is empty', () => {
		const incomingFontFamilies = [
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
			incomingFontFamilies,
			existingFontFamilies
		);

		expect( result ).toEqual( [] );
	} );

	it( 'returns intersecting font family when there are no fonfaces', () => {
		const incomingFontFamilies = [
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
			incomingFontFamilies,
			existingFontFamilies
		);

		expect( result ).toEqual( existingFontFamilies );
	} );

	it( 'returns intersecting if there is an intended font face and is not present in the returning it should not be returned', () => {
		const incomingFontFamilies = [
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
			incomingFontFamilies,
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

	it( 'updates font family definition using the incoming data', () => {
		const incomingFontFamilies = [
			{
				slug: 'gothic-a1',
				fontFace: [ { fontStyle: 'normal', fontWeight: '400' } ],
				fontFamily: "'Gothic A1', serif",
			},
		];

		const existingFontFamilies = [
			{
				slug: 'gothic-a1',
				fontFace: [ { fontStyle: 'normal', fontWeight: '400' } ],
				fontFamily: 'Gothic A1, serif',
			},
		];

		const result = getIntersectingFontFaces(
			incomingFontFamilies,
			existingFontFamilies
		);
		const expected = [
			{
				slug: 'gothic-a1',
				fontFace: [ { fontStyle: 'normal', fontWeight: '400' } ],
				fontFamily: "'Gothic A1', serif",
			},
		];
		expect( result ).toEqual( expected );
	} );
} );
