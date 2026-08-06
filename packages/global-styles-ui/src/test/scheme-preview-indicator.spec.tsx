/**
 * WordPress dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { GlobalStylesContext } from '../context';
import SchemePreviewIndicator, {
	hasSchemePresets,
} from '../scheme-preview-indicator';

const renderIndicator = ( colorSettings: Record< string, unknown > ) => {
	const base = {
		settings: {
			color: colorSettings,
		},
		styles: {},
	};

	return render(
		<GlobalStylesContext.Provider
			value={ {
				base,
				merged: base,
				onChange: jest.fn(),
				user: { settings: {}, styles: {} },
			} }
		>
			<SchemePreviewIndicator ratio={ 1 } />
		</GlobalStylesContext.Provider>
	);
};

describe( 'hasSchemePresets', () => {
	it( 'detects flat and origin-keyed scheme presets', () => {
		expect(
			hasSchemePresets( {
				palette: [ { slug: 'base' } ],
			} )
		).toBe( true );
		expect(
			hasSchemePresets( {
				gradients: {
					theme: [ { slug: 'signal' } ],
				},
			} )
		).toBe( true );
		expect( hasSchemePresets( {} ) ).toBe( false );
	} );
} );

describe( 'SchemePreviewIndicator', () => {
	it( 'shows an indicator for each theme-provided alternative', () => {
		renderIndicator( {
			light: {
				palette: [ { slug: 'base', color: '#ffffff' } ],
			},
			dark: {
				duotone: {
					theme: [
						{
							slug: 'portrait',
							colors: [ '#000000', '#ffffff' ],
						},
					],
				},
			},
		} );

		expect(
			screen.getByLabelText( 'Light color scheme available' )
		).toBeVisible();
		expect(
			screen.getByLabelText( 'Dark color scheme available' )
		).toBeVisible();
	} );

	it( 'does not render when the theme has no alternative', () => {
		const { container } = renderIndicator( {} );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
