/**
 * Internal dependencies
 */
import {
	getColorObjectByAttributeValues,
	getColorObjectByColorValue,
	getColorClassName,
	getMostReadableColor,
} from '../utils';

describe( 'color utils', () => {
	describe( 'getColorObjectByAttributeValues', () => {
		it( 'should return the custom color object when there is no definedColor', () => {
			const colors = [
				{ slug: 'red' },
				{ slug: 'green' },
				{ slug: 'blue' },
			];
			const customColor = '#ffffff';

			expect(
				getColorObjectByAttributeValues(
					colors,
					undefined,
					customColor
				)
			).toEqual( {
				color: customColor,
			} );
		} );

		it( 'should return the custom color object when definedColor was not found', () => {
			const colors = [
				{ slug: 'red' },
				{ slug: 'green' },
				{ slug: 'blue' },
			];
			const definedColor = 'purple';
			const customColor = '#ffffff';

			expect(
				getColorObjectByAttributeValues(
					colors,
					definedColor,
					customColor
				)
			).toEqual( {
				color: customColor,
			} );
		} );

		it( 'should return the found color object', () => {
			const colors = [
				{ slug: 'red' },
				{ slug: 'green' },
				{ slug: 'blue' },
			];
			const definedColor = 'blue';
			const customColor = '#ffffff';

			expect(
				getColorObjectByAttributeValues(
					colors,
					definedColor,
					customColor
				)
			).toEqual( {
				slug: 'blue',
			} );
		} );
	} );

	describe( 'getColorObjectByColorValue', () => {
		it( 'should return undefined if the given color was not found', () => {
			const colors = [
				{ slug: 'red', color: '#ff0000' },
				{ slug: 'green', color: '#00ff00' },
				{ slug: 'blue', color: '#0000ff' },
			];

			expect(
				getColorObjectByColorValue( colors, '#ffffff' )
			).toBeUndefined();
		} );

		it( 'should return a color object for the given color value', () => {
			const colors = [
				{ slug: 'red', color: '#ff0000' },
				{ slug: 'green', color: '#00ff00' },
				{ slug: 'blue', color: '#0000ff' },
			];

			expect( getColorObjectByColorValue( colors, '#00ff00' ) ).toEqual( {
				slug: 'green',
				color: '#00ff00',
			} );
		} );
	} );

	describe( 'getColorClassName', () => {
		it( 'should return undefined if colorContextName is missing', () => {
			expect(
				getColorClassName( undefined, 'Light Purple' )
			).toBeUndefined();
		} );

		it( 'should return undefined if colorSlug is missing', () => {
			expect(
				getColorClassName( 'background', undefined )
			).toBeUndefined();
		} );

		it( 'should return a class name with the color slug in kebab case', () => {
			expect(
				getColorClassName( 'background', 'Light   Purple veryDark' )
			).toBe( 'has-light-purple-very-dark-background' );
		} );

		it( 'should return the correct class name if the color slug is not a string', () => {
			expect( getColorClassName( 'background', 123456 ) ).toBe(
				'has-123456-background'
			);
		} );

		it( 'should return the correct class name if the color slug contains special characters', () => {
			expect( getColorClassName( 'background', '#abcdef' ) ).toBe(
				'has-abcdef-background'
			);
		} );
	} );

	describe( 'getMostReadableColor', () => {
		it( 'should return the most readable color', () => {
			expect(
				getMostReadableColor(
					[
						{
							name: 'Red',
							slug: 'red',
							color: 'red',
						},
						{
							name: 'Black',
							slug: 'black',
							color: 'black',
						},
					],
					'#f3f3f3'
				)
			).toBe( 'black' );

			expect(
				getMostReadableColor(
					[
						{
							name: 'C1',
							slug: 'c1',
							color: '#39373b',
						},
						{
							name: 'C2',
							slug: 'c2',
							color: '#a25de6',
						},
					],
					'#9853ff'
				)
			).toBe( '#39373b' );
		} );
	} );
} );
