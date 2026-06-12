// These tests read the resolved CSS custom properties produced by the provider.
// jsdom does not cascade custom properties to descendant elements, so the value
// is asserted on the provider's own scoping element (where the property is
// defined and from which real children would inherit) and on the document root.

import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../theme-provider';
import { DEFAULT_SEED_COLORS } from '../color-ramps';

// Mock the CSS module so the provider's scoping class is a real, stable class
// name. Without this the global Jest CSS mock leaves the class `undefined`, and
// jsdom cannot match the generated rules to compute the custom properties.
jest.mock( '../style.module.css', () => ( {
	root: 'theme-provider-root',
} ) );

// A semantic design-system token derived from the `color.primary` seed.
const BRAND_BG = '--wpds-color-bg-interactive-brand-strong';

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

	it( 'defines the brand color token within its subtree', () => {
		render(
			<ThemeProvider>
				<div data-testid="child">x</div>
			</ThemeProvider>
		);

		const provider = getScopingProvider( screen.getByTestId( 'child' ) );
		// With no overrides, the brand background resolves to the default seed.
		expect( readProp( provider, BRAND_BG ) ).toBe(
			DEFAULT_SEED_COLORS.primary
		);
	} );

	it( 'does not define the custom property outside of the provider', () => {
		render(
			<ThemeProvider>
				<div data-testid="child">x</div>
			</ThemeProvider>
		);

		const outside = document.createElement( 'div' );
		document.body.appendChild( outside );

		expect( readProp( outside, BRAND_BG ) ).toBe( '' );
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
		it( 'defines the token on the document root', () => {
			render(
				<ThemeProvider isRoot>
					<div>x</div>
				</ThemeProvider>
			);

			expect( readProp( document.documentElement, BRAND_BG ) ).toBe(
				DEFAULT_SEED_COLORS.primary
			);
		} );

		it( 'does not affect the document root by default', () => {
			render(
				<ThemeProvider>
					<div>x</div>
				</ThemeProvider>
			);

			expect( readProp( document.documentElement, BRAND_BG ) ).toBe( '' );
		} );
	} );

	describe( 'nested providers', () => {
		it( 'inherits the parent value, and a nested provider can override it', () => {
			render(
				<>
					<ThemeProvider color={ { primary: 'rgb(255, 0, 0)' } }>
						<div data-testid="parent">p</div>
						<ThemeProvider>
							<div data-testid="inheriting">a</div>
						</ThemeProvider>
						<ThemeProvider color={ { primary: 'rgb(0, 255, 0)' } }>
							<div data-testid="overriding">b</div>
						</ThemeProvider>
					</ThemeProvider>
					<ThemeProvider color={ { primary: 'rgb(0, 255, 0)' } }>
						<div data-testid="reference-green">g</div>
					</ThemeProvider>
				</>
			);

			const parentValue = readProp(
				getScopingProvider( screen.getByTestId( 'parent' ) ),
				BRAND_BG
			);
			const inheritingValue = readProp(
				getScopingProvider( screen.getByTestId( 'inheriting' ) ),
				BRAND_BG
			);
			const overridingValue = readProp(
				getScopingProvider( screen.getByTestId( 'overriding' ) ),
				BRAND_BG
			);
			const referenceGreenValue = readProp(
				getScopingProvider( screen.getByTestId( 'reference-green' ) ),
				BRAND_BG
			);

			// A nested provider without its own `color` inherits the parent's.
			expect( inheritingValue ).toBe( parentValue );
			// A nested provider with its own `color` overrides the parent's,
			// resolving to the same value as a standalone provider seeded with
			// that color.
			expect( overridingValue ).not.toBe( parentValue );
			expect( overridingValue ).toBe( referenceGreenValue );
		} );
	} );
} );
