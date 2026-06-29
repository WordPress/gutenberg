import { unlock } from '../lock-unlock';
import { privateApis } from '../private-apis';
import { ThemeProvider } from '../theme-provider';
import { useThemeProviderStyles } from '../use-theme-provider-styles';

describe( 'privateApis', () => {
	it( 'does not warn when accessing private APIs that remain private', () => {
		const warn = jest
			.spyOn( console, 'warn' )
			.mockImplementation( () => {} );

		expect(
			unlock< {
				useThemeProviderStyles: typeof useThemeProviderStyles;
			} >( privateApis ).useThemeProviderStyles
		).toBe( useThemeProviderStyles );

		expect( warn ).not.toHaveBeenCalled();

		warn.mockRestore();
	} );

	it( 'warns once when accessing ThemeProvider through private APIs', () => {
		const warn = jest
			.spyOn( console, 'warn' )
			.mockImplementation( () => {} );

		const unlockedPrivateApis = unlock< {
			ThemeProvider: typeof ThemeProvider;
		} >( privateApis );

		expect( unlockedPrivateApis.ThemeProvider ).toBe( ThemeProvider );
		expect( unlockedPrivateApis.ThemeProvider ).toBe( ThemeProvider );

		expect( warn ).toHaveBeenCalledTimes( 1 );
		expect( warn ).toHaveBeenCalledWith(
			'ThemeProvider: Accessing `ThemeProvider` through `@wordpress/theme` private APIs is deprecated. Import `ThemeProvider` from `@wordpress/theme` instead.'
		);

		warn.mockRestore();
	} );
} );
