import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../theme-provider';
import styles from '../style.module.css';
// Browser Mode verifies the generated design-token stylesheet itself.
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import '../../prebuilt/css/design-tokens.css';

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
	return element.closest< HTMLElement >( `.${ styles.root }` )!;
}

describe( 'ThemeProvider', () => {
	it( 'renders its children', () => {
		render( <ThemeProvider>content</ThemeProvider> );

		expect( screen.getByText( 'content' ) ).toBeInTheDocument();
	} );

	it( 'keeps its scoping wrapper styled as display contents and unfocusable', async () => {
		render(
			<>
				<button>Before</button>
				<ThemeProvider>
					<button>Inside</button>
				</ThemeProvider>
				<button>After</button>
			</>
		);

		const before = screen.getByRole( 'button', { name: 'Before' } );
		const inside = screen.getByRole( 'button', { name: 'Inside' } );
		const after = screen.getByRole( 'button', { name: 'After' } );
		const provider = getScopingProvider( inside );

		expect( getComputedStyle( provider ).display ).toBe( 'contents' );
		expect( provider ).not.toHaveAttribute( 'tabindex' );

		provider.focus();
		expect( provider ).not.toHaveFocus();

		await userEvent.tab();
		expect( before ).toHaveFocus();
		await userEvent.tab();
		expect( inside ).toHaveFocus();
		await userEvent.tab();
		expect( after ).toHaveFocus();
		await userEvent.tab( { shift: true } );
		expect( inside ).toHaveFocus();
		await userEvent.tab( { shift: true } );
		expect( before ).toHaveFocus();
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

	it( 'does not define color tokens if neither customized nor inherited', () => {
		render(
			<ThemeProvider>
				<div data-testid="child">x</div>
			</ThemeProvider>
		);

		const provider = getScopingProvider( screen.getByTestId( 'child' ) );
		expect( provider.style.getPropertyValue( BRAND_BG ) ).toBe( '' );
		expect( provider.style.getPropertyValue( SURFACE_BG ) ).toBe( '' );
		expect(
			provider.style.getPropertyValue( '--wp-admin-theme-color' )
		).toBe( '' );
	} );

	it( 'does not define the custom property outside of the provider', () => {
		render(
			<ThemeProvider color={ { primary: PRIMARY } }>
				<div data-testid="child">x</div>
			</ThemeProvider>
		);

		const outside = document.createElement( 'div' );
		document.body.appendChild( outside );

		expect( readProp( outside, BRAND_BG ) ).not.toBe( PRIMARY );
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

			expect( readProp( document.documentElement, BRAND_BG ) ).not.toBe(
				PRIMARY
			);
		} );

		it( 'removes the forwarded properties from the document root on unmount', () => {
			const { unmount } = render(
				<ThemeProvider isRoot color={ { primary: PRIMARY } }>
					<div>x</div>
				</ThemeProvider>
			);

			expect( readProp( document.documentElement, BRAND_BG ) ).toBe(
				PRIMARY
			);

			unmount();

			expect( readProp( document.documentElement, BRAND_BG ) ).not.toBe(
				PRIMARY
			);
		} );

		it( "forwards tokens to the wrapper's own document, not the top document", () => {
			const iframe = document.createElement( 'iframe' );
			document.body.appendChild( iframe );
			const iframeDoc = iframe.contentDocument!;
			// Mount into a child element (not the iframe `body` directly, which
			// React warns against) so the wrapper's `ownerDocument` is the iframe.
			const mount = iframeDoc.createElement( 'div' );
			iframeDoc.body.appendChild( mount );

			const { unmount } = render(
				<ThemeProvider isRoot color={ { primary: PRIMARY } }>
					<div>x</div>
				</ThemeProvider>,
				{ container: mount }
			);

			expect( readProp( iframeDoc.documentElement, BRAND_BG ) ).toBe(
				PRIMARY
			);
			expect( readProp( document.documentElement, BRAND_BG ) ).not.toBe(
				PRIMARY
			);

			unmount();
			iframe.remove();
		} );

		it( 'warns when multiple root providers share a document', () => {
			const warn = vi
				.spyOn( console, 'warn' )
				.mockImplementation( () => {} );

			render(
				<>
					<ThemeProvider isRoot color={ { primary: PRIMARY } }>
						<div>a</div>
					</ThemeProvider>
					<ThemeProvider isRoot color={ { primary: OTHER_PRIMARY } }>
						<div>b</div>
					</ThemeProvider>
				</>
			);

			expect( warn ).toHaveBeenCalledWith(
				expect.stringContaining( 'More than one root provider' )
			);

			warn.mockRestore();
		} );

		it( 'does not warn for a single root provider', () => {
			const warn = vi
				.spyOn( console, 'warn' )
				.mockImplementation( () => {} );

			render(
				<ThemeProvider isRoot color={ { primary: PRIMARY } }>
					<div>x</div>
				</ThemeProvider>
			);

			expect( warn ).not.toHaveBeenCalled();

			warn.mockRestore();
		} );

		describe( 'cornerRadius forwarding', () => {
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

			// A nested provider with no settings of its own inherits everything
			// and re-applies color tokens so portaled descendants have them.
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
