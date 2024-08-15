/**
 * Internal dependencies
 */
import { toggleFont } from '../toggleFont';

describe( 'toggleFont function', () => {
	const initialCustomFonts = [
		{
			slug: 'font1',
			fontFace: [
				{ fontWeight: '400', fontStyle: 'normal' },
				{ fontWeight: '700', fontStyle: 'italic' },
			],
		},
	];

	const newFont = { slug: 'font2', fontFace: [] };

	// Basic Toggles
	describe( 'Basic Toggles', () => {
		it( 'should toggle the entire font family on/off', () => {
			let updatedFonts = toggleFont( newFont, null, initialCustomFonts );
			expect( updatedFonts ).toEqual( [
				...initialCustomFonts,
				newFont,
			] );

			updatedFonts = toggleFont( newFont, null, updatedFonts );
			expect( updatedFonts ).toEqual( initialCustomFonts );
		} );

		it( 'should toggle a specific font face of an activated font family', () => {
			const face = { fontWeight: '400', fontStyle: 'normal' };
			let updatedFonts = toggleFont(
				initialCustomFonts[ 0 ],
				face,
				initialCustomFonts
			);
			expect( updatedFonts[ 0 ].fontFace ).toEqual( [
				{ fontWeight: '700', fontStyle: 'italic' },
			] );

			updatedFonts = toggleFont(
				initialCustomFonts[ 0 ],
				face,
				updatedFonts
			);
			expect( updatedFonts[ 0 ].fontFace ).toEqual( [
				{ fontWeight: '700', fontStyle: 'italic' },
				{ fontWeight: '400', fontStyle: 'normal' },
			] );
		} );

		it( 'should toggle a specific font face of a non-activated font family', () => {
			const face = { fontWeight: '500', fontStyle: 'normal' };
			const updatedFonts = toggleFont(
				newFont,
				face,
				initialCustomFonts
			);
			expect( updatedFonts ).toEqual( [
				...initialCustomFonts,
				{ ...newFont, fontFace: [ face ] },
			] );
		} );
	} );

	// Edge Cases
	describe( 'Edge Cases', () => {
		it( 'should handle empty initial fonts', () => {
			const updatedFonts = toggleFont( newFont, null, [] );
			expect( updatedFonts ).toEqual( [ newFont ] );
		} );

		it( 'should deactivate font family when all font faces are deactivated', () => {
			const face1 = { fontWeight: '400', fontStyle: 'normal' };
			const face2 = { fontWeight: '700', fontStyle: 'italic' };
			let updatedFonts = toggleFont(
				initialCustomFonts[ 0 ],
				face1,
				initialCustomFonts
			);
			updatedFonts = toggleFont(
				initialCustomFonts[ 0 ],
				face2,
				updatedFonts
			);

			expect( updatedFonts ).toEqual( [] );
		} );

		it( 'should not duplicate an already activated font face', () => {
			const face = { fontWeight: '400', fontStyle: 'normal' };
			const updatedFonts = toggleFont(
				initialCustomFonts[ 0 ],
				face,
				initialCustomFonts
			);
			const furtherUpdatedFonts = toggleFont(
				initialCustomFonts[ 0 ],
				face,
				updatedFonts
			);

			expect( furtherUpdatedFonts ).toHaveLength( 1 );
			// Sort the font faces by fontWeight to ensure the order is consistent for the toEqual assertion.
			expect(
				furtherUpdatedFonts[ 0 ].fontFace.sort(
					( a, b ) => a.fontWeight - b.fontWeight
				)
			).toEqual( initialCustomFonts[ 0 ].fontFace );
		} );

		it( 'should handle undefined or null fontFace gracefully', () => {
			const fontWithoutFaces = { slug: 'font3' }; // no fontFace defined
			const face = { fontWeight: '500', fontStyle: 'normal' };
			const updatedFonts = toggleFont(
				fontWithoutFaces,
				face,
				initialCustomFonts
			);
			expect( updatedFonts ).toEqual( [
				...initialCustomFonts,
				{ ...fontWithoutFaces, fontFace: [ face ] },
			] );
		} );

		it( 'should handle fonts with the same slug but different properties', () => {
			const differentFontWithSameSlug = {
				slug: 'font1',
				displayName: 'Different Font with Same Slug',
			};
			const updatedFonts = toggleFont(
				differentFontWithSameSlug,
				null,
				initialCustomFonts
			);
			expect( updatedFonts ).toEqual( [] );
		} );
	} );
} );
