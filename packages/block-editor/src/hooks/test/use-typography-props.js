/**
 * Internal dependencies
 */
import { getTypographyClassesAndStyles } from '../use-typography-props';

describe( 'getTypographyClassesAndStyles', () => {
	it( 'should return styles and classes', () => {
		const attributes = {
			fontFamily: 'tofu',
			fontSize: 'large',
			style: {
				typography: {
					letterSpacing: '22px',
					fontSize: '2rem',
					textColumns: 3,
					textTransform: 'uppercase',
				},
			},
		};
		expect( getTypographyClassesAndStyles( attributes ) ).toEqual( {
			className: 'has-tofu-font-family has-large-font-size',
			style: {
				columnCount: 3,
				letterSpacing: '22px',
				fontSize: '2rem',
				textTransform: 'uppercase',
			},
		} );
	} );

	it( 'should return fluid font size styles', () => {
		const attributes = {
			fontFamily: 'tofu',
			style: {
				typography: {
					letterSpacing: '22px',
					fontSize: '2rem',
					textTransform: 'uppercase',
				},
			},
		};
		expect( getTypographyClassesAndStyles( attributes, true ) ).toEqual( {
			className: 'has-tofu-font-family',
			style: {
				letterSpacing: '22px',
				fontSize:
					'clamp(1.5rem, 1.5rem + ((1vw - 0.48rem) * 0.962), 2rem)',
				textTransform: 'uppercase',
			},
		} );
	} );

	it( 'should return configured fluid font size styles', () => {
		const attributes = {
			fontFamily: 'tofu',
			style: {
				typography: {
					textDecoration: 'underline',
					fontSize: '2rem',
					textTransform: 'uppercase',
				},
			},
		};
		expect(
			getTypographyClassesAndStyles( attributes, {
				minFontSize: '1rem',
			} )
		).toEqual( {
			className: 'has-tofu-font-family',
			style: {
				textDecoration: 'underline',
				fontSize:
					'clamp(1.5rem, 1.5rem + ((1vw - 0.48rem) * 0.962), 2rem)',
				textTransform: 'uppercase',
			},
		} );
	} );
} );
