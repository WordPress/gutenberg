import { renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { ThemeProvider } from '../theme-provider';
import { useThemeProviderStyles } from '../use-theme-provider-styles';
import { DEFAULT_SEED_COLORS } from '../color-ramps';

type Styles = Record< string, string >;

describe( 'useThemeProviderStyles', () => {
	describe( 'defaults', () => {
		it( 'resolves to the default seed colors when no settings are provided', () => {
			const { result } = renderHook( () => useThemeProviderStyles() );

			expect( result.current.resolvedSettings.color ).toEqual( {
				primary: DEFAULT_SEED_COLORS.primary,
				background: DEFAULT_SEED_COLORS.background,
			} );
			expect( result.current.resolvedSettings.cursor ).toBeUndefined();
		} );

		it( 'returns custom properties for the semantic and legacy tokens', () => {
			const { result } = renderHook( () => useThemeProviderStyles() );
			const styles = result.current.themeProviderStyles;

			// Semantic design-system tokens.
			expect( Object.keys( styles ) ).toEqual(
				expect.arrayContaining( [
					expect.stringMatching( /^--wpds-color-/ ),
				] )
			);
			// Legacy `wp-admin` / `wp-components` overrides.
			expect( styles ).toHaveProperty( '--wp-admin-theme-color' );
			expect( styles ).toHaveProperty( '--wp-components-color-accent' );
		} );

		it( 'does not set the cursor custom property', () => {
			const { result } = renderHook( () => useThemeProviderStyles() );

			expect( result.current.themeProviderStyles ).not.toHaveProperty(
				'--wpds-cursor-control'
			);
		} );
	} );

	describe( 'explicit settings', () => {
		it( 'uses the provided primary color', () => {
			const { result } = renderHook( () =>
				useThemeProviderStyles( { color: { primary: '#ff0000' } } )
			);

			expect( result.current.resolvedSettings.color?.primary ).toBe(
				'#ff0000'
			);
			// The background falls back to the default seed.
			expect( result.current.resolvedSettings.color?.background ).toBe(
				DEFAULT_SEED_COLORS.background
			);
		} );

		it( 'sets the cursor control custom property', () => {
			const { result } = renderHook( () =>
				useThemeProviderStyles( { cursor: { control: 'pointer' } } )
			);

			expect( result.current.resolvedSettings.cursor ).toEqual( {
				control: 'pointer',
			} );
			expect(
				( result.current.themeProviderStyles as Styles )[
					'--wpds-cursor-control'
				]
			).toBe( 'pointer' );
		} );
	} );

	describe( 'inheritance from a parent provider', () => {
		const wrapper = ( { children }: { children: ReactNode } ) => (
			<ThemeProvider
				color={ { primary: '#abcdef', background: '#222222' } }
				cursor={ { control: 'pointer' } }
			>
				{ children }
			</ThemeProvider>
		);

		it( 'inherits color and cursor settings when none are provided locally', () => {
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
		} );

		it( 'lets local settings override the inherited ones', () => {
			const { result } = renderHook(
				() =>
					useThemeProviderStyles( {
						color: { primary: '#00ff00' },
						cursor: { control: 'default' },
					} ),
				{ wrapper }
			);

			// Locally provided values win.
			expect( result.current.resolvedSettings.color?.primary ).toBe(
				'#00ff00'
			);
			expect( result.current.resolvedSettings.cursor ).toEqual( {
				control: 'default',
			} );
			// Values not provided locally keep inheriting from the parent.
			expect( result.current.resolvedSettings.color?.background ).toBe(
				'#222222'
			);
		} );
	} );
} );
