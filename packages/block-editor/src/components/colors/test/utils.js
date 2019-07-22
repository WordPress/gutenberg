/**
 * Internal dependencies
 */
import {
	getColorObjectByAttributeValues,
	getColorObjectByColorValue,
	getColorClassName,
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

			expect( getColorObjectByAttributeValues( colors, undefined, customColor ) ).toEqual( { color: customColor } );
		} );

		it( 'should return the custom color object when definedColor was not found', () => {
			const colors = [
				{ slug: 'red' },
				{ slug: 'green' },
				{ slug: 'blue' },
			];
			const definedColor = 'purple';
			const customColor = '#ffffff';

			expect( getColorObjectByAttributeValues( colors, definedColor, customColor ) ).toEqual( { color: customColor } );
		} );

		it( 'should return the found color object', () => {
			const colors = [
				{ slug: 'red' },
				{ slug: 'green' },
				{ slug: 'blue' },
			];
			const definedColor = 'blue';
			const customColor = '#ffffff';

			expect( getColorObjectByAttributeValues( colors, definedColor, customColor ) ).toEqual( { slug: 'blue' } );
		} );
	} );

	describe( 'getColorObjectByColorValue', () => {
		it( 'should return undefined if the given color was not found', () => {
			const colors = [
				{ slug: 'red', color: '#ff0000' },
				{ slug: 'green', color: '#00ff00' },
				{ slug: 'blue', color: '#0000ff' },
			];

			expect( getColorObjectByColorValue( colors, '#ffffff' ) ).toBeUndefined();
		} );

		it( 'should return a color object for the given color value', () => {
			const colors = [
				{ slug: 'red', color: '#ff0000' },
				{ slug: 'green', color: '#00ff00' },
				{ slug: 'blue', color: '#0000ff' },
			];

			expect( getColorObjectByColorValue( colors, '#00ff00' ) ).toEqual( { slug: 'green', color: '#00ff00' } );
		} );
	} );

	describe( 'getColorClassName', () => {
		it( 'should return undefined if colorContextName is missing', () => {
			expect( getColorClassName( undefined, 'Light Purple' ) ).toBeUndefined();
		} );

		it( 'should return undefined if colorSlug is missing', () => {
			expect( getColorClassName( 'background', undefined ) ).toBeUndefined();
		} );

		it( 'should return a class name with the color slug in kebab case', () => {
			expect( getColorClassName( 'background', 'Light Purple' ) ).toBe( 'has-light-purple-background' );
		} );
	} );
} );
