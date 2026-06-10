// `useThemeProviderStyles` is the resolution layer behind `ThemeProvider`. These
// tests focus on what the hook uniquely owns:
//
// - `resolvedSettings`: how each setting is resolved (local prop > inherited from
//   a parent provider > built-in default), which is the value propagated through
//   context to descendant providers.
// - the conditional emission of `themeProviderStyles`: the hook returns
//   `undefined` (so `ThemeProvider` skips the `<style>`) whenever the resolved
//   settings already match the inherited ones, and only pins the legacy
//   `--wp-admin-theme-color*` bridge when `color.primary` actually changes.
//
// The resolved values of the semantic `--wpds-*` tokens are covered by the
// `ThemeProvider` tests (which read them as computed CSS custom properties). The
// legacy `--wp-components-*` aliases live in the prebuilt/static stylesheet, not
// in the emitted style, so they are not asserted here.

import { renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { ThemeContext } from '../context';
import { ThemeProvider } from '../theme-provider';
import { useThemeProviderStyles } from '../use-theme-provider-styles';
import { DEFAULT_SEED_COLORS } from '../color-ramps';
import type { ThemeProviderSettings } from '../types';

// Renders the hook as if it were nested inside a parent `<ThemeProvider>` whose
// resolved settings are `inherited`.
function withInheritedSettings( inherited: ThemeProviderSettings ) {
	return ( { children }: { children: ReactNode } ) => (
		<ThemeContext.Provider value={ { resolvedSettings: inherited } }>
			{ children }
		</ThemeContext.Provider>
	);
}

describe( 'useThemeProviderStyles', () => {
	describe( 'resolvedSettings', () => {
		it( 'falls back to the default seed colors and no cursor', () => {
			const { result } = renderHook( () => useThemeProviderStyles() );

			expect( result.current.resolvedSettings.color ).toEqual( {
				primary: DEFAULT_SEED_COLORS.primary,
				background: DEFAULT_SEED_COLORS.background,
			} );
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

	describe( 'when settings resolve to the inherited values', () => {
		it( 'returns `undefined` styles when no overrides are passed', () => {
			const { result } = renderHook( () => useThemeProviderStyles() );
			expect( result.current.themeProviderStyles ).toBeUndefined();
		} );

		it.each( [
			[ 'uppercase hex', '#3858E9', '#FCFCFC' ],
			[ 'mixed case hex', '#3858E9', '#fCfCfC' ],
			[ 'rgb()', 'rgb(56, 88, 233)', 'rgb(252, 252, 252)' ],
		] )(
			'treats %s representations of the defaults as defaults',
			( _, primary, background ) => {
				const { result } = renderHook( () =>
					useThemeProviderStyles( {
						color: { primary, background },
					} )
				);
				expect( result.current.themeProviderStyles ).toBeUndefined();
			}
		);

		it( 'returns `undefined` when a nested provider resolves to its inherited values', () => {
			const { result } = renderHook(
				() =>
					useThemeProviderStyles( { color: { primary: 'hotpink' } } ),
				{
					wrapper: withInheritedSettings( {
						color: { primary: 'hotpink' },
					} ),
				}
			);
			expect( result.current.themeProviderStyles ).toBeUndefined();
		} );

		it( 'still emits only the cursor variable when nothing but `cursor.control` is set', () => {
			const { result } = renderHook( () =>
				useThemeProviderStyles( {
					cursor: { control: 'pointer' },
				} )
			);
			expect( result.current.themeProviderStyles ).toEqual( {
				'--wpds-cursor-control': 'pointer',
			} );
		} );
	} );

	describe( 'when settings differ from the inherited values', () => {
		it( 'derives the `--wp-admin-theme-color*` bridge from the primary seed', () => {
			const { result } = renderHook( () =>
				useThemeProviderStyles( { color: { primary: '#1e90ff' } } )
			);
			const styles = result.current.themeProviderStyles ?? {};

			expect( styles[ '--wp-admin-theme-color' ] ).toBe( '#1e90ff' );
			expect( styles[ '--wp-admin-theme-color--rgb' ] ).toBe(
				'30, 144, 255'
			);
			expect( Object.keys( styles ) ).toEqual(
				expect.arrayContaining( [
					'--wp-admin-theme-color-darker-10',
					'--wp-admin-theme-color-darker-20',
				] )
			);
		} );

		it( 'does not emit `--wp-admin-theme-color*` overrides when only `color.background` differs', () => {
			const { result } = renderHook( () =>
				useThemeProviderStyles( {
					color: { background: '#222222' },
				} )
			);
			expect( result.current.themeProviderStyles ).toBeDefined();
			expect(
				Object.keys( result.current.themeProviderStyles ?? {} )
			).toEqual(
				expect.not.arrayContaining( [ '--wp-admin-theme-color' ] )
			);
		} );

		it( 'emits overrides when a nested provider resets a setting an ancestor overrode back to the default', () => {
			// A parent set `primary` to `hotpink`; this nested provider resets
			// it to the design system default. The override must still be
			// emitted so it wins over the ancestor's `hotpink` in the cascade.
			const { result } = renderHook(
				() =>
					useThemeProviderStyles( {
						color: { primary: '#3858e9' },
					} ),
				{
					wrapper: withInheritedSettings( {
						color: { primary: 'hotpink' },
					} ),
				}
			);
			expect( result.current.themeProviderStyles ).toBeDefined();
			expect(
				Object.keys( result.current.themeProviderStyles ?? {} )
			).toEqual( expect.arrayContaining( [ '--wp-admin-theme-color' ] ) );
		} );
	} );

	describe( 'when seeds are unparseable', () => {
		it( 'does not silently treat an unparseable `color.primary` as default', () => {
			expect( () =>
				renderHook( () =>
					useThemeProviderStyles( {
						color: { primary: 'not-a-color' },
					} )
				)
			).toThrow();
			// Rendering the throwing hook makes React log the error; assert it
			// so the global jest-console setup does not flag it as unexpected.
			expect( console ).toHaveErrored();
		} );
	} );
} );
