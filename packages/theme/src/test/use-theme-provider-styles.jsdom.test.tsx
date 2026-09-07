// `useThemeProviderStyles` is the resolution layer behind `ThemeProvider`. These
// tests focus on what the hook uniquely owns:
//
// - `resolvedSettings`: how each setting is resolved (local prop > inherited from
//   a parent provider > built-in default when generating), which is the value
//   propagated through context to descendant providers. Color stays unset when
//   neither local nor inherited seeds are present.
// - when color custom properties are emitted (any resolved color) vs omitted
//   (total default only)
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

describe( 'useThemeProviderStyles', () => {
	describe( 'resolvedSettings', () => {
		it( 'leaves color unset by default, expecting that CSS or build fallbacks apply', () => {
			const { result } = renderHook( () => useThemeProviderStyles() );

			expect( result.current.resolvedSettings.color ).toEqual( {} );
			expect( result.current.resolvedSettings.cursor ).toBeUndefined();
			// `cornerRadius` falls back to the prebuilt default.
			expect( result.current.resolvedSettings.cornerRadius ).toBe(
				'subtle'
			);
		} );

		it( 'uses locally provided settings', () => {
			const { result } = renderHook( () =>
				useThemeProviderStyles( {
					color: { primary: '#1e90ff', background: '#f8f8f8' },
					cursor: { control: 'pointer' },
					cornerRadius: 'moderate',
				} )
			);

			expect( result.current.resolvedSettings.color ).toEqual( {
				primary: '#1e90ff',
				background: '#f8f8f8',
			} );
			expect( result.current.resolvedSettings.cursor ).toEqual( {
				control: 'pointer',
			} );
			expect( result.current.resolvedSettings.cornerRadius ).toBe(
				'moderate'
			);
		} );

		describe( 'within a parent provider', () => {
			const wrapper = ( { children }: { children: ReactNode } ) => (
				<ThemeProvider
					color={ { primary: '#abcdef', background: '#222222' } }
					cursor={ { control: 'pointer' } }
					cornerRadius="pronounced"
				>
					{ children }
				</ThemeProvider>
			);

			it( 'inherits every unset setting from the parent', () => {
				const { result } = renderHook( () => useThemeProviderStyles(), {
					wrapper,
				} );

				expect( result.current.resolvedSettings.color ).toEqual( {
					primary: '#abcdef',
					background: '#222222',
				} );
				expect( result.current.resolvedSettings.cursor ).toEqual( {
					control: 'pointer',
				} );
				expect( result.current.resolvedSettings.cornerRadius ).toBe(
					'pronounced'
				);
			} );

			it( 'resolves each setting independently: local wins, unset inherits', () => {
				const { result } = renderHook(
					() =>
						useThemeProviderStyles( {
							color: { primary: '#00ff00' },
						} ),
					{ wrapper }
				);

				expect( result.current.resolvedSettings.color ).toEqual( {
					// Provided locally.
					primary: '#00ff00',
					// `background` keeps inheriting from the parent.
					background: '#222222',
				} );
				// `cursor` and `cornerRadius` keep inheriting from the parent.
				expect( result.current.resolvedSettings.cursor ).toEqual( {
					control: 'pointer',
				} );
				expect( result.current.resolvedSettings.cornerRadius ).toBe(
					'pronounced'
				);
			} );
		} );
	} );

	describe( 'color styles', () => {
		it( 'omits color custom properties by default', () => {
			const { result } = renderHook( () => useThemeProviderStyles() );

			expect( result.current.themeProviderStyles ).not.toHaveProperty(
				'--wp-admin-theme-color'
			);
			expect( result.current.themeProviderStyles ).not.toHaveProperty(
				'--wpds-color-background-interactive-brand-strong'
			);
		} );

		it( 'emits color properties when at least one setting is provided', () => {
			const { result } = renderHook( () =>
				useThemeProviderStyles( { color: { primary: '#1e90ff' } } )
			);

			expect( result.current.resolvedSettings.color ).toEqual( {
				primary: '#1e90ff',
				background: DEFAULT_SEED_COLORS.background,
			} );
			expect(
				result.current.themeProviderStyles[
					'--wpds-color-background-interactive-brand-strong'
				]
			).toBe( '#1e90ff' );
		} );

		it( 'emits neutral interactive background state properties from the background ramp', () => {
			const { result } = renderHook( () =>
				useThemeProviderStyles( { color: { background: '#222222' } } )
			);
			const styles = result.current.themeProviderStyles;

			expect(
				styles[ '--wpds-color-background-interactive-neutral' ]
			).toBe(
				styles[ '--wpds-color-background-surface-neutral-strong' ]
			);
			expect(
				styles[ '--wpds-color-background-interactive-neutral-active' ]
			).toBe(
				styles[ '--wpds-color-background-surface-neutral-strong' ]
			);
			expect(
				styles[ '--wpds-color-background-interactive-neutral-disabled' ]
			).toBe(
				styles[ '--wpds-color-background-surface-neutral-strong' ]
			);
		} );

		it( 're-emits inherited color tokens so portaled subtrees can re-apply them', () => {
			const wrapper = ( { children }: { children: ReactNode } ) => (
				<ThemeProvider
					color={ { primary: '#abcdef', background: '#222222' } }
				>
					{ children }
				</ThemeProvider>
			);

			const { result } = renderHook( () => useThemeProviderStyles(), {
				wrapper,
			} );

			expect( result.current.resolvedSettings.color ).toEqual( {
				primary: '#abcdef',
				background: '#222222',
			} );
			expect( result.current.themeProviderStyles ).toHaveProperty(
				'--wp-admin-theme-color',
				'#abcdef'
			);
			expect( result.current.themeProviderStyles ).toHaveProperty(
				'--wpds-color-background-interactive-brand-strong',
				'#abcdef'
			);
		} );
	} );

	describe( 'legacy wp-admin / wp-components bridge', () => {
		it( 'derives the wp-admin theme color from the primary seed', () => {
			const { result } = renderHook( () =>
				useThemeProviderStyles( { color: { primary: '#1e90ff' } } )
			);
			const styles = result.current.themeProviderStyles;

			expect( styles[ '--wp-admin-theme-color' ] ).toBe( '#1e90ff' );
			expect( styles[ '--wp-admin-theme-color--rgb' ] ).toBe(
				'30, 144, 255'
			);
		} );

		it( 'aliases the wp-components colors onto the wp-admin and semantic tokens', () => {
			const { result } = renderHook( () =>
				useThemeProviderStyles( { color: { primary: '#1e90ff' } } )
			);
			const styles = result.current.themeProviderStyles;

			expect( styles[ '--wp-components-color-accent' ] ).toBe(
				'var(--wp-admin-theme-color)'
			);
			expect( styles[ '--wp-components-color-accent-inverted' ] ).toBe(
				'var(--wpds-color-foreground-interactive-brand-strong)'
			);
			expect( styles[ '--wp-components-color-background' ] ).toBe(
				'var(--wpds-color-background-surface-neutral-strong)'
			);
		} );
	} );

	describe( 'cursor', () => {
		it( 'sets the cursor control custom property when provided', () => {
			const { result } = renderHook( () =>
				useThemeProviderStyles( { cursor: { control: 'pointer' } } )
			);

			expect(
				result.current.themeProviderStyles[ '--wpds-cursor-control' ]
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
