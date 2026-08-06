/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import withFontSizes from '../with-font-sizes';
import { useSettings } from '../../use-settings';

jest.mock( '../../use-settings', () => ( {
	useSettings: jest.fn(),
} ) );

jest.mock( '../utils', () => ( {
	getFontSize: ( fontSizes, fontSizeAttribute, customFontSizeAttribute ) => {
		if ( fontSizeAttribute ) {
			const fontSizeObject = fontSizes?.find(
				( { slug } ) => slug === fontSizeAttribute
			);
			if ( fontSizeObject ) {
				return fontSizeObject;
			}
		}
		return { size: customFontSizeAttribute };
	},
	getFontSizeClass: ( fontSizeSlug ) =>
		fontSizeSlug ? `has-${ fontSizeSlug }-font-size` : undefined,
} ) );

const FONT_SIZES = [
	{ name: 'Small', slug: 'small', size: 12 },
	{ name: 'Medium', slug: 'medium', size: 24 },
];

function FontSizeConsumer( { fontSize, setFontSize } ) {
	return (
		<>
			<span data-testid="font-size-value">
				{ JSON.stringify( fontSize ) }
			</span>
			<button type="button" onClick={ () => setFontSize( 24 ) }>
				Set named size
			</button>
			<button type="button" onClick={ () => setFontSize( 18 ) }>
				Set custom size
			</button>
		</>
	);
}

const EnhancedFontSizeConsumer =
	withFontSizes( 'fontSize' )( FontSizeConsumer );

function getRenderedFontSize() {
	return JSON.parse( screen.getByTestId( 'font-size-value' ).textContent );
}

describe( 'withFontSizes', () => {
	beforeEach( () => {
		useSettings.mockReturnValue( [ FONT_SIZES ] );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'derives named and custom font size values from attributes', () => {
		const setAttributes = jest.fn();
		const { rerender } = render(
			<EnhancedFontSizeConsumer
				attributes={ { fontSize: 'small' } }
				setAttributes={ setAttributes }
			/>
		);

		expect( getRenderedFontSize() ).toEqual( {
			name: 'Small',
			slug: 'small',
			size: 12,
			class: 'has-small-font-size',
		} );

		rerender(
			<EnhancedFontSizeConsumer
				attributes={ { customFontSize: 18 } }
				setAttributes={ setAttributes }
			/>
		);

		expect( getRenderedFontSize() ).toEqual( { size: 18 } );
	} );

	it( 'maps a matching size back to its named font size attribute', () => {
		const setAttributes = jest.fn();
		render(
			<EnhancedFontSizeConsumer
				attributes={ {} }
				setAttributes={ setAttributes }
			/>
		);
		fireEvent.click(
			screen.getByRole( 'button', { name: 'Set named size' } )
		);
		expect( setAttributes ).toHaveBeenCalledWith( {
			fontSize: 'medium',
			customFontSize: undefined,
		} );
	} );

	it( 'stores a non-matching size as a custom font size', () => {
		const setAttributes = jest.fn();
		render(
			<EnhancedFontSizeConsumer
				attributes={ {} }
				setAttributes={ setAttributes }
			/>
		);
		fireEvent.click(
			screen.getByRole( 'button', { name: 'Set custom size' } )
		);
		expect( setAttributes ).toHaveBeenCalledWith( {
			fontSize: undefined,
			customFontSize: 18,
		} );
	} );
} );
