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
			'`privateApis.useThemeProviderStyles` from `@wordpress/theme` is deprecated since version 7.1 and will be removed in version 7.3. Please use `ThemeProvider` from `@wordpress/theme` for supported theming use cases instead. Note: `useThemeProviderStyles` has no public replacement.'
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
			'`privateApis.ThemeProvider` from `@wordpress/theme` is deprecated since version 7.1 and will be removed in version 7.3. Please use `ThemeProvider` from `@wordpress/theme` instead.'
		);

		warn.mockRestore();
	} );
} );
