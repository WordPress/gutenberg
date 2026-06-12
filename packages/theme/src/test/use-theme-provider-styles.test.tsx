// `useThemeProviderStyles` is the resolution layer behind `ThemeProvider`. These
// tests focus on what the hook uniquely owns:
//
// - `resolvedSettings`: how each setting is resolved (local prop > inherited from
//   a parent provider > built-in default), which is the value propagated through
//   context to descendant providers.
// - the legacy `wp-admin` / `wp-components` bridge in `themeProviderStyles`, which
//   the `ThemeProvider` tests intentionally do not cover.
//
// The resolved values of the semantic `--wpds-*` tokens are covered by the
// `ThemeProvider` tests (which read them as computed CSS custom properties).

import { renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { ThemeProvider } from '../theme-provider';
import { useThemeProviderStyles } from '../use-theme-provider-styles';
import { DEFAULT_SEED_COLORS } from '../color-ramps';

type Styles = Record< string, string >;

describe( 'useThemeProviderStyles', () => {
	describe( 'resolvedSettings', () => {
		it( 'falls back to the default seed colors and no cursor', () => {
			const { result } = renderHook( () => useThemeProviderStyles() );

			expect( result.current.resolvedSettings.color ).toEqual( {
				primary: DEFAULT_SEED_COLORS.primary,
				background: DEFAULT_SEED_COLORS.background,
			} );
			expect( result.current.resolvedSettings.cursor ).toBeUndefined();
		} );

		it( 'uses locally provided settings', () => {
			const { result } = renderHook( () =>
				useThemeProviderStyles( {
					color: { primary: '#1e90ff', background: '#f8f8f8' },
					cursor: { control: 'pointer' },
				} )
			);

			expect( result.current.resolvedSettings ).toEqual( {
				color: { primary: '#1e90ff', background: '#f8f8f8' },
				cursor: { control: 'pointer' },
			} );
		} );

		describe( 'within a parent provider', () => {
			const wrapper = ( { children }: { children: ReactNode } ) => (
				<ThemeProvider
					color={ { primary: '#abcdef', background: '#222222' } }
					cursor={ { control: 'pointer' } }
				>
					{ children }
				</ThemeProvider>
			);

			it( 'inherits every unset setting from the parent', () => {
				const { result } = renderHook( () => useThemeProviderStyles(), {
					wrapper,
				} );

				expect( result.current.resolvedSettings ).toEqual( {
					color: { primary: '#abcdef', background: '#222222' },
					cursor: { control: 'pointer' },
				} );
			} );

			it( 'resolves each setting independently: local wins, unset inherits', () => {
				const { result } = renderHook(
					() =>
						useThemeProviderStyles( {
							color: { primary: '#00ff00' },
						} ),
					{ wrapper }
				);

				expect( result.current.resolvedSettings ).toEqual( {
					// Provided locally.
					color: { primary: '#00ff00', background: '#222222' },
					// `background` and `cursor` keep inheriting from the parent.
					cursor: { control: 'pointer' },
				} );
			} );
		} );
	} );

	describe( 'legacy wp-admin / wp-components bridge', () => {
		it( 'derives the wp-admin theme color from the primary seed', () => {
			const { result } = renderHook( () =>
				useThemeProviderStyles( { color: { primary: '#1e90ff' } } )
			);
			const styles = result.current.themeProviderStyles as Styles;

			expect( styles[ '--wp-admin-theme-color' ] ).toBe( '#1e90ff' );
			expect( styles[ '--wp-admin-theme-color--rgb' ] ).toBe(
				'30, 144, 255'
			);
		} );

		it( 'aliases the wp-components colors onto the wp-admin and semantic tokens', () => {
			const { result } = renderHook( () => useThemeProviderStyles() );
			const styles = result.current.themeProviderStyles as Styles;

			expect( styles[ '--wp-components-color-accent' ] ).toBe(
				'var(--wp-admin-theme-color)'
			);
			expect( styles[ '--wp-components-color-accent-inverted' ] ).toBe(
				'var(--wpds-color-fg-interactive-brand-strong)'
			);
			expect( styles[ '--wp-components-color-background' ] ).toBe(
				'var(--wpds-color-bg-surface-neutral-strong)'
			);
		} );
	} );

	describe( 'cursor', () => {
		it( 'sets the cursor control custom property when provided', () => {
			const { result } = renderHook( () =>
				useThemeProviderStyles( { cursor: { control: 'pointer' } } )
			);

			expect(
				( result.current.themeProviderStyles as Styles )[
					'--wpds-cursor-control'
				]
			).toBe( 'pointer' );
		} );

		it( 'omits the cursor control custom property by default', () => {
			const { result } = renderHook( () => useThemeProviderStyles() );

			expect( result.current.themeProviderStyles ).not.toHaveProperty(
				'--wpds-cursor-control'
			);
		} );
	} );
} );
