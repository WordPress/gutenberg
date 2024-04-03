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
					textAlign: 'center',
					textColumns: 3,
					textTransform: 'uppercase',
				},
			},
		};
		expect( getTypographyClassesAndStyles( attributes ) ).toEqual( {
			className:
				'has-tofu-font-family has-text-align-center has-large-font-size',
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
		expect(
			getTypographyClassesAndStyles( attributes, {
				typography: {
					fluid: {
						minFontSize: '1rem',
					},
				},
			} )
		).toEqual( {
			className: 'has-tofu-font-family',
			style: {
				letterSpacing: '22px',
				fontSize:
					'clamp(1.25rem, 1.25rem + ((1vw - 0.2rem) * 0.938), 2rem)',
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
				typography: {
					fluid: {
						minFontSize: '1rem',
					},
				},
			} )
		).toEqual( {
			className: 'has-tofu-font-family',
			style: {
				textDecoration: 'underline',
				fontSize:
					'clamp(1.25rem, 1.25rem + ((1vw - 0.2rem) * 0.938), 2rem)',
				textTransform: 'uppercase',
			},
		} );
	} );

	it( 'should use layout.wideSize for the maximum viewport value', () => {
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
				typography: {
					fluid: {
						minFontSize: '1rem',
					},
				},
				layout: {
					wideSize: '1000px',
				},
			} )
		).toEqual( {
			className: 'has-tofu-font-family',
			style: {
				textDecoration: 'underline',
				fontSize:
					'clamp(1.25rem, 1.25rem + ((1vw - 0.2rem) * 1.765), 2rem)',
				textTransform: 'uppercase',
			},
		} );
	} );
} );
