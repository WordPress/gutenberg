// These tests read the resolved CSS custom properties produced by the provider.
// jsdom does not cascade custom properties to descendant elements, so the value
// is asserted on the provider's own scoping element (where the property is
// defined and from which real children would inherit) and on the document root.

import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../theme-provider';

// Mock the CSS module so the provider's scoping class is a real, stable class
// name. Without this the global Jest CSS mock leaves the class `undefined`, and
// jsdom cannot match the generated rules to compute the custom properties.
jest.mock( '../style.module.css', () => ( {
	root: 'theme-provider-root',
} ) );

// The legacy accent property is set to the seed color's sRGB channels, which
// makes the expected value predictable regardless of color serialization.
const ACCENT_RGB = '--wp-admin-theme-color--rgb';

function readProp( element: Element, property: string ) {
	return getComputedStyle( element ).getPropertyValue( property ).trim();
}

// The `ThemeProvider` wrapper element that scopes the given descendant.
function getScopingProvider( element: Element ) {
	return element.closest< HTMLElement >( '[data-wpds-theme-provider-id]' )!;
}

describe( 'ThemeProvider', () => {
	it( 'renders its children', () => {
		render( <ThemeProvider>content</ThemeProvider> );

		expect( screen.getByText( 'content' ) ).toBeInTheDocument();
	} );

	it( 'defines the themed custom property within its subtree', () => {
		render(
			<ThemeProvider color={ { primary: 'rgb(255, 0, 0)' } }>
				<div data-testid="child">x</div>
			</ThemeProvider>
		);

		const provider = getScopingProvider( screen.getByTestId( 'child' ) );
		expect( readProp( provider, ACCENT_RGB ) ).toBe( '255, 0, 0' );
	} );

	it( 'does not define the custom property outside of the provider', () => {
		render(
			<ThemeProvider color={ { primary: 'rgb(255, 0, 0)' } }>
				x
			</ThemeProvider>
		);

		const outside = document.createElement( 'div' );
		document.body.appendChild( outside );

		expect( readProp( outside, ACCENT_RGB ) ).toBe( '' );
	} );

	it( 'applies the cursor custom property when set', () => {
		render(
			<ThemeProvider cursor={ { control: 'pointer' } }>
				<div data-testid="child">x</div>
			</ThemeProvider>
		);

		const provider = getScopingProvider( screen.getByTestId( 'child' ) );
		expect( readProp( provider, '--wpds-cursor-control' ) ).toBe(
			'pointer'
		);
	} );

	describe( 'isRoot', () => {
		it( 'defines the custom property on the document root', () => {
			render(
				<ThemeProvider isRoot color={ { primary: 'rgb(255, 0, 0)' } }>
					x
				</ThemeProvider>
			);

			expect( readProp( document.documentElement, ACCENT_RGB ) ).toBe(
				'255, 0, 0'
			);
		} );

		it( 'does not affect the document root by default', () => {
			render(
				<ThemeProvider color={ { primary: 'rgb(255, 0, 0)' } }>
					x
				</ThemeProvider>
			);

			expect( readProp( document.documentElement, ACCENT_RGB ) ).toBe(
				''
			);
		} );
	} );

	describe( 'nested providers', () => {
		it( 'inherits the parent value, and a nested provider can override it', () => {
			render(
				<ThemeProvider color={ { primary: 'rgb(255, 0, 0)' } }>
					<ThemeProvider>
						<div data-testid="inheriting">a</div>
					</ThemeProvider>
					<ThemeProvider color={ { primary: 'rgb(0, 255, 0)' } }>
						<div data-testid="overriding">b</div>
					</ThemeProvider>
				</ThemeProvider>
			);

			const inheriting = getScopingProvider(
				screen.getByTestId( 'inheriting' )
			);
			const overriding = getScopingProvider(
				screen.getByTestId( 'overriding' )
			);

			// A nested provider without its own `color` inherits the parent's.
			expect( readProp( inheriting, ACCENT_RGB ) ).toBe( '255, 0, 0' );
			// A nested provider with its own `color` overrides the parent's.
			expect( readProp( overriding, ACCENT_RGB ) ).toBe( '0, 255, 0' );
		} );
	} );
} );
