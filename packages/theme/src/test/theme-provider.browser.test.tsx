import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { ThemeProvider } from '../theme-provider';
import type { ThemeProviderColorWarning } from '../theme-provider-color-warnings';
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
const FORMER_WARNING_PRIMARY = '#608010';
const FORMER_WARNING_BACKGROUND = '#4f386e';
const ACCESSIBLE_PRIMARY = '#3858e9';
const ACCESSIBLE_BACKGROUND = '#fcfcfc';

function readProp( element: Element, property: string ) {
	return getComputedStyle( element ).getPropertyValue( property ).trim();
}

// The `ThemeProvider` wrapper element that scopes the given descendant.
function getScopingProvider( element: Element ) {
	return element.closest< HTMLElement >( `.${ styles.wrapper }` )!;
}

describe( 'ThemeProvider', () => {
	it( 'renders its children', async () => {
		await render( <ThemeProvider>content</ThemeProvider> );

		expect( screen.getByText( 'content' ) ).toBeInTheDocument();
	} );

	it( 'keeps its scoping wrapper styled as display contents and unfocusable', async () => {
		await render(
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

	it( 'defines the color tokens from the seeds within its subtree', async () => {
		await render(
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

	it( 'does not define color tokens if neither customized nor inherited', async () => {
		await render(
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

	it( 'does not report color warnings when no colors are calculated', async () => {
		const onColorWarnings = vi.fn();

		await render( <ThemeProvider onColorWarnings={ onColorWarnings } /> );

		expect( onColorWarnings ).not.toHaveBeenCalled();
	} );

	it( 'does not report warnings for accessible active fill pairs', async () => {
		const onColorWarnings =
			vi.fn<
				( warnings: readonly ThemeProviderColorWarning[] ) => void
			>();
		const { rerender } = await render(
			<ThemeProvider
				color={ {
					primary: FORMER_WARNING_PRIMARY,
					background: FORMER_WARNING_BACKGROUND,
				} }
				onColorWarnings={ onColorWarnings }
			/>
		);

		expect( onColorWarnings ).toHaveBeenCalledWith( [] );

		onColorWarnings.mockClear();
		await rerender(
			<ThemeProvider
				color={ {
					primary: ACCESSIBLE_PRIMARY,
					background: ACCESSIBLE_BACKGROUND,
				} }
				onColorWarnings={ onColorWarnings }
			/>
		);

		expect( onColorWarnings ).toHaveBeenCalledWith( [] );
	} );

	it( 'does not report warnings again when only the callback identity changes', async () => {
		const onColorWarnings =
			vi.fn<
				( warnings: readonly ThemeProviderColorWarning[] ) => void
			>();
		const renderProvider = () => (
			<ThemeProvider
				color={ {
					primary: ACCESSIBLE_PRIMARY,
					background: ACCESSIBLE_BACKGROUND,
				} }
				onColorWarnings={ ( warnings ) => onColorWarnings( warnings ) }
			/>
		);

		const { rerender } = await render( renderProvider() );

		expect( onColorWarnings ).toHaveBeenCalledTimes( 1 );

		await rerender( renderProvider() );

		expect( onColorWarnings ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not define the custom property outside of the provider', async () => {
		await render(
			<ThemeProvider color={ { primary: PRIMARY } }>
				<div data-testid="child">x</div>
			</ThemeProvider>
		);

		const outside = document.createElement( 'div' );
		document.body.appendChild( outside );

		expect( readProp( outside, BRAND_BG ) ).not.toBe( PRIMARY );
	} );

	it( 'applies the cursor custom property when set', async () => {
		await render(
			<ThemeProvider cursor={ { control: 'pointer' } }>
				<div data-testid="child">x</div>
			</ThemeProvider>
		);

		const provider = getScopingProvider( screen.getByTestId( 'child' ) );
		expect( readProp( provider, CURSOR_CONTROL ) ).toBe( 'pointer' );
	} );

	describe( 'cornerRadius', () => {
		it( 'reflects the preset as a data attribute', async () => {
			await render(
				<ThemeProvider cornerRadius="pronounced">
					<div data-testid="child">x</div>
				</ThemeProvider>
			);

			expect(
				getScopingProvider( screen.getByTestId( 'child' ) )
			).toHaveAttribute( 'data-wpds-corner-radius', 'pronounced' );
		} );

		it( 'defaults to the subtle preset', async () => {
			await render(
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
		it( 'defines the token on the document root', async () => {
			await render(
				<ThemeProvider isRoot color={ { primary: PRIMARY } }>
					<div>x</div>
				</ThemeProvider>
			);

			expect( readProp( document.documentElement, BRAND_BG ) ).toBe(
				PRIMARY
			);
		} );

		it( 'does not affect the document root by default', async () => {
			await render(
				<ThemeProvider color={ { primary: PRIMARY } }>
					<div>x</div>
				</ThemeProvider>
			);

			expect( readProp( document.documentElement, BRAND_BG ) ).not.toBe(
				PRIMARY
			);
		} );

		it( 'removes the forwarded properties from the document root on unmount', async () => {
			const { unmount } = await render(
				<ThemeProvider isRoot color={ { primary: PRIMARY } }>
					<div>x</div>
				</ThemeProvider>
			);

			expect( readProp( document.documentElement, BRAND_BG ) ).toBe(
				PRIMARY
			);

			await unmount();

			expect( readProp( document.documentElement, BRAND_BG ) ).not.toBe(
				PRIMARY
			);
		} );

		it( "forwards tokens to the wrapper's own document, not the top document", async () => {
			const iframe = document.createElement( 'iframe' );
			document.body.appendChild( iframe );
			const iframeDoc = iframe.contentDocument!;
			// Mount into a child element (not the iframe `body` directly, which
			// React warns against) so the wrapper's `ownerDocument` is the iframe.
			const mount = iframeDoc.createElement( 'div' );
			iframeDoc.body.appendChild( mount );

			const { unmount } = await render(
				<ThemeProvider
					isRoot
					color={ { primary: PRIMARY } }
					cornerRadius="moderate"
				>
					<div>x</div>
				</ThemeProvider>,
				{ container: mount }
			);

			expect( readProp( iframeDoc.documentElement, BRAND_BG ) ).toBe(
				PRIMARY
			);
			expect( iframeDoc.documentElement ).toHaveAttribute(
				'data-wpds-root-provider',
				'true'
			);
			expect( iframeDoc.documentElement ).toHaveAttribute(
				'data-wpds-corner-radius',
				'moderate'
			);
			expect( document.documentElement ).not.toHaveAttribute(
				'data-wpds-root-provider'
			);
			expect( document.documentElement ).not.toHaveAttribute(
				'data-wpds-corner-radius'
			);
			expect( readProp( document.documentElement, BRAND_BG ) ).not.toBe(
				PRIMARY
			);

			await unmount();
			iframe.remove();
		} );

		it( 'warns when multiple root providers share a document', async () => {
			const warn = vi
				.spyOn( console, 'warn' )
				.mockImplementation( () => {} );

			await render(
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

		it( 'does not warn for a single root provider', async () => {
			const warn = vi
				.spyOn( console, 'warn' )
				.mockImplementation( () => {} );

			await render(
				<ThemeProvider isRoot color={ { primary: PRIMARY } }>
					<div>x</div>
				</ThemeProvider>
			);

			expect( warn ).not.toHaveBeenCalled();

			warn.mockRestore();
		} );
		describe( 'cornerRadius forwarding', () => {
			it( 'forwards the preset attributes and tokens to the document root when isRoot is set', async () => {
				await render(
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

				expect( document.documentElement ).toHaveAttribute(
					'data-wpds-root-provider',
					'true'
				);
				expect( document.documentElement ).toHaveAttribute(
					'data-wpds-corner-radius',
					'moderate'
				);

				// `:root` resolves to the same `moderate` value as the provider.
				expect( forwarded ).toBeTruthy();
				expect( forwarded ).toBe(
					readProp( provider, BORDER_RADIUS_SM )
				);
			} );

			it( 'updates the document-root attributes when the preset changes', async () => {
				const { rerender } = await render(
					<ThemeProvider isRoot cornerRadius="moderate">
						<div>x</div>
					</ThemeProvider>
				);

				await rerender(
					<ThemeProvider isRoot cornerRadius="pronounced">
						<div>x</div>
					</ThemeProvider>
				);

				expect( document.documentElement ).toHaveAttribute(
					'data-wpds-root-provider',
					'true'
				);
				expect( document.documentElement ).toHaveAttribute(
					'data-wpds-corner-radius',
					'pronounced'
				);
			} );

			it( 'restores previous document-root attributes on unmount', async () => {
				const root = document.documentElement;
				root.setAttribute( 'data-wpds-root-provider', 'previous' );
				root.setAttribute( 'data-wpds-corner-radius', 'none' );
				let unmount: undefined | ( () => void );

				try {
					( { unmount } = await render(
						<ThemeProvider isRoot cornerRadius="moderate">
							<div>x</div>
						</ThemeProvider>
					) );

					expect( root ).toHaveAttribute(
						'data-wpds-root-provider',
						'true'
					);
					expect( root ).toHaveAttribute(
						'data-wpds-corner-radius',
						'moderate'
					);

					await unmount();
					unmount = undefined;

					expect( root ).toHaveAttribute(
						'data-wpds-root-provider',
						'previous'
					);
					expect( root ).toHaveAttribute(
						'data-wpds-corner-radius',
						'none'
					);
				} finally {
					unmount?.();
					root.removeAttribute( 'data-wpds-root-provider' );
					root.removeAttribute( 'data-wpds-corner-radius' );
				}
			} );

			it( 'does not forward the preset to the document root by default', async () => {
				await render(
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
				expect( document.documentElement ).not.toHaveAttribute(
					'data-wpds-root-provider'
				);
				expect( document.documentElement ).not.toHaveAttribute(
					'data-wpds-corner-radius'
				);
			} );
		} );
	} );

	describe( 'nested providers', () => {
		it( 'overrides the settings it defines and inherits the rest', async () => {
			await render(
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
