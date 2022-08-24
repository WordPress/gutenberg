/**
 * Internal dependencies
 */
import { getTypographyClassesAndStyles } from '../use-typography-props';

describe( 'getTypographyClassesAndStyles', () => {
	it( 'should return styles and classes', () => {
		const attributes = {
			fontFamily: 'tofu',
			style: {
				typography: {
					letterSpacing: '22px',
					fontSize: '2rem',
					fontFamily: 'tahini',
				},
			},
		};
		expect( getTypographyClassesAndStyles( attributes ) ).toEqual( {
			className: 'has-tofu-font-family',
			style: {
				letterSpacing: '22px',
				fontSize: '2rem',
				fontFamily: 'tahini',
			},
		} );
	} );
} );
