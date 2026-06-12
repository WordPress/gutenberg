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

// The "strong" brand background resolves to the `color.primary` seed itself, and
// the neutral surface resolves to the `color.background` seed itself, which makes
// the expected values predictable. (Extreme seeds get snapped into the accessible
// ramp, so the seeds below are deliberately mid-range/light hex values that
// round-trip. Ramp generation itself is covered by the color-ramps tests.)
const BRAND_BG = '--wpds-color-bg-interactive-brand-strong';
const SURFACE_BG = '--wpds-color-bg-surface-neutral';
const PRIMARY = '#1e90ff';
const OTHER_PRIMARY = '#8e44ad';
const BACKGROUND = '#f8f8f8';

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

	it( 'defines the brand color token from the primary seed within its subtree', () => {
		render(
			<ThemeProvider color={ { primary: PRIMARY } }>
				<div data-testid="child">x</div>
			</ThemeProvider>
		);

		const provider = getScopingProvider( screen.getByTestId( 'child' ) );
		expect( readProp( provider, BRAND_BG ) ).toBe( PRIMARY );
	} );

	it( 'defines the surface color token from the background seed within its subtree', () => {
		render(
			<ThemeProvider color={ { background: BACKGROUND } }>
				<div data-testid="child">x</div>
			</ThemeProvider>
		);

		const provider = getScopingProvider( screen.getByTestId( 'child' ) );
		expect( readProp( provider, SURFACE_BG ) ).toBe( BACKGROUND );
	} );

	it( 'does not define the custom property outside of the provider', () => {
		render(
			<ThemeProvider color={ { primary: PRIMARY } }>
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
				<ThemeProvider isRoot color={ { primary: PRIMARY } }>
					<div>x</div>
				</ThemeProvider>
			);

			expect( readProp( document.documentElement, BRAND_BG ) ).toBe(
				PRIMARY
			);
		} );

		it( 'does not affect the document root by default', () => {
			render(
				<ThemeProvider color={ { primary: PRIMARY } }>
					<div>x</div>
				</ThemeProvider>
			);

			expect( readProp( document.documentElement, BRAND_BG ) ).toBe( '' );
		} );
	} );

	describe( 'nested providers', () => {
		it( 'inherits the parent value, and a nested provider can override it', () => {
			render(
				<ThemeProvider color={ { primary: PRIMARY } }>
					<div data-testid="parent">p</div>
					<ThemeProvider>
						<div data-testid="inheriting">a</div>
					</ThemeProvider>
					<ThemeProvider color={ { primary: OTHER_PRIMARY } }>
						<div data-testid="overriding">b</div>
					</ThemeProvider>
				</ThemeProvider>
			);

			const parent = getScopingProvider( screen.getByTestId( 'parent' ) );
			const inheriting = getScopingProvider(
				screen.getByTestId( 'inheriting' )
			);
			const overriding = getScopingProvider(
				screen.getByTestId( 'overriding' )
			);

			expect( readProp( parent, BRAND_BG ) ).toBe( PRIMARY );
			// A nested provider without its own `color` inherits the parent's.
			expect( readProp( inheriting, BRAND_BG ) ).toBe( PRIMARY );
			// A nested provider with its own `color` overrides the parent's.
			expect( readProp( overriding, BRAND_BG ) ).toBe( OTHER_PRIMARY );
		} );

		it( 'overrides only the provided color, inheriting the rest', () => {
			render(
				<ThemeProvider
					color={ { primary: PRIMARY, background: BACKGROUND } }
				>
					<ThemeProvider color={ { primary: OTHER_PRIMARY } }>
						<div data-testid="child">c</div>
					</ThemeProvider>
				</ThemeProvider>
			);

			const child = getScopingProvider( screen.getByTestId( 'child' ) );
			// `primary` is overridden by the nested provider...
			expect( readProp( child, BRAND_BG ) ).toBe( OTHER_PRIMARY );
			// ...while `background` keeps inheriting from the parent.
			expect( readProp( child, SURFACE_BG ) ).toBe( BACKGROUND );
		} );

		it( 'inherits cursor while overriding color', () => {
			render(
				<ThemeProvider
					color={ { primary: PRIMARY } }
					cursor={ { control: 'pointer' } }
				>
					<ThemeProvider color={ { primary: OTHER_PRIMARY } }>
						<div data-testid="child">c</div>
					</ThemeProvider>
				</ThemeProvider>
			);

			const child = getScopingProvider( screen.getByTestId( 'child' ) );
			expect( readProp( child, BRAND_BG ) ).toBe( OTHER_PRIMARY );
			// `cursor` is a separate settings group and keeps inheriting.
			expect( readProp( child, '--wpds-cursor-control' ) ).toBe(
				'pointer'
			);
		} );
	} );
} );
