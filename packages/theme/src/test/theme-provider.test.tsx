// These tests read the resolved CSS custom properties produced by the provider.
// jsdom does not cascade custom properties to descendant elements, so the value
// is asserted on the provider's own scoping element (where the property is
// defined and from which real children would inherit) and on the document root.

import { readFileSync } from 'fs';
import { join } from 'path';
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
const BRAND_BG = '--wpds-color-background-interactive-brand-strong';
const SURFACE_BG = '--wpds-color-background-surface-neutral';
const CURSOR_CONTROL = '--wpds-cursor-control';
const BORDER_RADIUS_SM = '--wpds-border-radius-sm';
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

	it( 'defines the color tokens from the seeds within its subtree', () => {
		render(
			<ThemeProvider
				color={ { primary: PRIMARY, background: BACKGROUND } }
			>
				<div data-testid="child">x</div>
			</ThemeProvider>
		);

		const provider = getScopingProvider( screen.getByTestId( 'child' ) );
		expect( readProp( provider, BRAND_BG ) ).toBe( PRIMARY );
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
		expect( readProp( provider, CURSOR_CONTROL ) ).toBe( 'pointer' );
	} );

	describe( 'cornerRadius', () => {
		it( 'reflects the preset as a data attribute', () => {
			render(
				<ThemeProvider cornerRadius="pronounced">
					<div data-testid="child">x</div>
				</ThemeProvider>
			);

			expect(
				getScopingProvider( screen.getByTestId( 'child' ) )
			).toHaveAttribute( 'data-wpds-corner-radius', 'pronounced' );
		} );

		it( 'defaults to the subtle preset', () => {
			render(
				<ThemeProvider>
					<div data-testid="child">x</div>
				</ThemeProvider>
			);

			expect(
				getScopingProvider( screen.getByTestId( 'child' ) )
			).toHaveAttribute( 'data-wpds-corner-radius', 'subtle' );
		} );
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

		// Unlike color/cursor (emitted at runtime in the provider's own
		// `<style>`), the `cornerRadius` preset resolves to
		// `--wpds-border-radius-*` values through the prebuilt design-token CSS
		// (the modes authored in `terrazzo.config.ts`). A root provider relies
		// on that stylesheet's `:root:has( [data-wpds-root-provider='true']… )`
		// rule to forward the preset to the document element, so these tests
		// load the prebuilt CSS to exercise it. It is injected only for this
		// block (it also defines base tokens on `:root`) to avoid interfering
		// with the color assertions above.
		describe( 'cornerRadius forwarding', () => {
			let prebuiltStyle: HTMLStyleElement;

			beforeAll( () => {
				prebuiltStyle = document.createElement( 'style' );
				prebuiltStyle.textContent = readFileSync(
					join( __dirname, '../prebuilt/css/design-tokens.css' ),
					'utf8'
				);
				document.head.appendChild( prebuiltStyle );
			} );

			afterAll( () => {
				prebuiltStyle.remove();
			} );

			it( 'forwards the preset to the document root when isRoot is set', () => {
				render(
					<ThemeProvider isRoot cornerRadius="moderate">
						<div data-testid="child">x</div>
					</ThemeProvider>
				);

				const provider = getScopingProvider(
					screen.getByTestId( 'child' )
				);
				const forwarded = readProp(
					document.documentElement,
					BORDER_RADIUS_SM
				);

				// `:root` resolves to the same `moderate` value as the provider.
				expect( forwarded ).toBeTruthy();
				expect( forwarded ).toBe(
					readProp( provider, BORDER_RADIUS_SM )
				);
			} );

			it( 'does not forward the preset to the document root by default', () => {
				render(
					<ThemeProvider cornerRadius="moderate">
						<div data-testid="child">x</div>
					</ThemeProvider>
				);

				const provider = getScopingProvider(
					screen.getByTestId( 'child' )
				);

				// `:root` keeps the base preset rather than the provider's
				// `moderate` one, since the provider is not a root provider.
				expect(
					readProp( document.documentElement, BORDER_RADIUS_SM )
				).not.toBe( readProp( provider, BORDER_RADIUS_SM ) );
			} );
		} );
	} );

	describe( 'nested providers', () => {
		it( 'overrides the settings it defines and inherits the rest', () => {
			render(
				<ThemeProvider
					color={ { primary: PRIMARY, background: BACKGROUND } }
					cursor={ { control: 'pointer' } }
					cornerRadius="pronounced"
				>
					<ThemeProvider>
						<div data-testid="inheriting">a</div>
					</ThemeProvider>
					<ThemeProvider color={ { primary: OTHER_PRIMARY } }>
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

			// A nested provider with no settings of its own inherits everything.
			expect( readProp( inheriting, BRAND_BG ) ).toBe( PRIMARY );
			expect( readProp( inheriting, SURFACE_BG ) ).toBe( BACKGROUND );
			expect( readProp( inheriting, CURSOR_CONTROL ) ).toBe( 'pointer' );
			expect( inheriting ).toHaveAttribute(
				'data-wpds-corner-radius',
				'pronounced'
			);

			// A nested provider overrides only what it defines (`primary`),
			// inheriting the rest (`background`, `cursor`, `cornerRadius`).
			expect( readProp( overriding, BRAND_BG ) ).toBe( OTHER_PRIMARY );
			expect( readProp( overriding, SURFACE_BG ) ).toBe( BACKGROUND );
			expect( readProp( overriding, CURSOR_CONTROL ) ).toBe( 'pointer' );
			expect( overriding ).toHaveAttribute(
				'data-wpds-corner-radius',
				'pronounced'
			);
		} );
	} );
} );
