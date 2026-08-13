import { getStyleForState, setStyleForState } from '../block-style-state';
import { styleHasCustomCSS } from '../custom-css';

describe( 'styleHasCustomCSS', () => {
	it( 'returns false when style is empty', () => {
		expect( styleHasCustomCSS( undefined ) ).toBe( false );
		expect( styleHasCustomCSS( {} ) ).toBe( false );
	} );

	it( 'returns true for root custom CSS', () => {
		expect( styleHasCustomCSS( { css: 'color: red;' } ) ).toBe( true );
	} );

	it( 'returns true for viewport custom CSS', () => {
		expect(
			styleHasCustomCSS( {
				'@tablet': { css: 'color: blue;' },
			} )
		).toBe( true );
	} );

	it( 'ignores whitespace-only CSS', () => {
		expect( styleHasCustomCSS( { css: '   ' } ) ).toBe( false );
	} );
} );

describe( 'custom CSS style state helpers', () => {
	it( 'stores custom CSS under the selected viewport state', () => {
		const style = { css: 'color: red;' };
		const selectedState = { viewport: '@mobile', pseudo: 'default' };

		expect(
			setStyleForState( style, selectedState, {
				css: 'color: blue;',
			} )
		).toEqual( {
			css: 'color: red;',
			'@mobile': { css: 'color: blue;' },
		} );
	} );

	it( 'reads custom CSS for the selected viewport state', () => {
		const style = {
			css: 'color: red;',
			'@tablet': { css: 'color: green;' },
		};

		expect(
			getStyleForState( style, {
				viewport: '@tablet',
				pseudo: 'default',
			} )
		).toEqual( { css: 'color: green;' } );
	} );
} );
