import { unlock } from '../lock-unlock';
import { privateApis } from '../private-apis';
import { ThemeProvider } from '../theme-provider';
import { useThemeProviderStyles } from '../use-theme-provider-styles';

describe( 'privateApis', () => {
	it( 'warns when accessing useThemeProviderStyles through private APIs', () => {
		const warn = jest
			.spyOn( console, 'warn' )
			.mockImplementation( () => {} );

		const unlockedPrivateApis = unlock< {
			useThemeProviderStyles: typeof useThemeProviderStyles;
		} >( privateApis );

		expect( unlockedPrivateApis.useThemeProviderStyles ).toBe(
			useThemeProviderStyles
		);

		expect( warn ).toHaveBeenCalledWith(
			'`@wordpress/theme`: Accessing `useThemeProviderStyles` through private APIs is deprecated. Import `ThemeProvider` from `@wordpress/theme` instead; this private export is scheduled for deletion as `@wordpress/theme` approaches stabilization.'
		);

		warn.mockRestore();
	} );

	it( 'warns when accessing ThemeProvider through private APIs', () => {
		const warn = jest
			.spyOn( console, 'warn' )
			.mockImplementation( () => {} );

		const unlockedPrivateApis = unlock< {
			ThemeProvider: typeof ThemeProvider;
		} >( privateApis );

		expect( unlockedPrivateApis.ThemeProvider ).toBe( ThemeProvider );

		expect( warn ).toHaveBeenCalledWith(
			'`@wordpress/theme`: Accessing `ThemeProvider` through private APIs is deprecated. Import `ThemeProvider` from `@wordpress/theme` instead; this private export is scheduled for deletion as `@wordpress/theme` approaches stabilization.'
		);

		warn.mockRestore();
	} );
} );
